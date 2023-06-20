import { Response } from "got";
import stringSimilarity from "string-similarity";

import { formatString } from "@/base/string";
import { PaperEntity } from "@/models/paper-entity";

import { FileSource, FileSourceRequestType } from "./source";

export class SemanticScholarFileSource extends FileSource {
  static checkEnable(paperEntityDraft: PaperEntity): boolean {
    return (
      paperEntityDraft.doi !== "" ||
      paperEntityDraft.title !== "" ||
      paperEntityDraft.arxiv !== ""
    );
  }

  static preProcess(paperEntityDraft: PaperEntity): FileSourceRequestType {
    let queryUrl: string;

    if (paperEntityDraft.doi !== "") {
      queryUrl = `https://api.semanticscholar.org/graph/v1/paper/${paperEntityDraft.doi}?fields=title,isOpenAccess,openAccessPdf`;
    } else if (paperEntityDraft.arxiv !== "") {
      queryUrl = `https://api.semanticscholar.org/graph/v1/paper/arXiv:${
        paperEntityDraft.arxiv.toLowerCase().replace("arxiv:", "").split("v")[0]
      }?fields=title,isOpenAccess,openAccessPdf`;
    } else {
      queryUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${formatString(
        {
          str: paperEntityDraft.title,
          whiteSymbol: true,
        }
      )}&limit=10&fields=title,title,isOpenAccess,openAccessPdf`;
    }
    const headers = {};

    return { queryUrl, headers };
  }

  static async queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    paperEntityDraft: PaperEntity | null
  ): Promise<string> {
    try {
      const response = (await networkTool.get(
        queryUrl,
        headers,
        0,
        false
      )) as Response<string>;
      const parsedResponse = JSON.parse(response.body) as
        | {
            data: {
              title: string;
              isOpenAccess: boolean;
              openAccessPdf?: {
                url: string;
                status: "HYBRID";
              };
            }[];
          }
        | {
            title: string;
            isOpenAccess: boolean;
            openAccessPdf?: {
              url: string;
              status: "HYBRID";
            };
          };

      let downloadUrl = "";

      let itemList;
      // @ts-ignore
      if (parsedResponse.data) {
        // @ts-ignore
        itemList = parsedResponse.data;
      } else {
        itemList = [parsedResponse];
      }

      for (const item of itemList) {
        const plainHitTitle = formatString({
          str: item.title,
          removeStr: "&amp;",
          removeSymbol: true,
          lowercased: true,
        });

        const existTitle = formatString({
          str: paperEntityDraft!.title,
          removeStr: "&amp;",
          removeSymbol: true,
          lowercased: true,
        });

        const sim = stringSimilarity.compareTwoStrings(
          plainHitTitle,
          existTitle
        );
        if (sim > 0.95) {
          if (item.isOpenAccess) {
            if (item.openAccessPdf) {
              downloadUrl = item.openAccessPdf.url;
            }
          }
          break;
        }
      }
      console.log(downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.log(error);
      return "";
    }
  }
}
