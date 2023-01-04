import { Response } from "got";
import stringSimilarity from "string-similarity";

import { PaperEntity } from "@/models/paper-entity";

import { Downloader, DownloaderRequestType } from "./downloader";
import { formatString } from "@/utils/string";

export class SemanticScholarDownloader extends Downloader {
  preProcess(paperEntityDraft: PaperEntity): DownloaderRequestType {
    const enable =
      (paperEntityDraft.doi !== "" || paperEntityDraft.title !== "" || paperEntityDraft.arxiv !== "") &&
      this.getEnable("semanticscholar");

    let queryUrl;

    if (paperEntityDraft.doi !== "") {
      queryUrl = `https://api.semanticscholar.org/graph/v1/paper/${paperEntityDraft.doi}?fields=title,isOpenAccess,openAccessPdf`;
    } else if (paperEntityDraft.arxiv !== "") {
      queryUrl = `https://api.semanticscholar.org/graph/v1/paper/arXiv:${paperEntityDraft.arxiv.toLowerCase().replace('arxiv:', '').split('v')[0]}?fields=title,isOpenAccess,openAccessPdf`;
    } else {
      queryUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${formatString(
        {
          str: paperEntityDraft.title,
          whiteSymbol: true,
        }
      )}&limit=10&fields=title,title,isOpenAccess,openAccessPdf`;
    }


    const headers = {};

    if (enable) {
      this.stateStore.logState.processLog = `Downloading PDF from SemanticScholar ...`;
    }

    return { queryUrl, headers, enable };
  }

  async queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    paperEntityDraft: PaperEntity | null
  ): Promise<string> {
    try {
      const response = (await window.networkTool.get(
        queryUrl,
        headers,
        0,
        false
      )) as Response<string>;
      const parsedResponse = JSON.parse(response.body) as {
        data: {
          title: string;
          isOpenAccess: boolean;
          openAccessPdf?: {
            "url": string,
            "status": "HYBRID"
          },
        }[]
      } | {
        title: string;
        isOpenAccess: boolean;
        openAccessPdf?: {
          "url": string,
          "status": "HYBRID"
        },
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

        const sim = stringSimilarity.compareTwoStrings(plainHitTitle, existTitle);
        if (sim > 0.95) {
          if (item.isOpenAccess) {
            if (item.openAccessPdf) {
              downloadUrl = item.openAccessPdf.url;
            }
          }
          break;
        }
      }

      return downloadUrl;
    } catch (error) {
      console.log(error);
      return "";
    }
  }
}
