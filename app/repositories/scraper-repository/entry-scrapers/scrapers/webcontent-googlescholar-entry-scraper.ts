import parse from "node-html-parser";

import { PaperEntity } from "@/models/paper-entity";
import { bibtex2json, bibtex2paperEntityDraft } from "@/utils/bibtex";

import { AbstractEntryScraper } from "./entry-scraper";

export interface IWebcontentGoogleScholarEntryScraperPayload {
  type: "webcontent";
  value: {
    url: string;
    document: string;
    cookies: string;
  };
}

export class WebcontentGoogleScholarEntryImporter extends AbstractEntryScraper {
  static validPayload(payload: any) {
    if (
      !payload.hasOwnProperty("type") ||
      !payload.hasOwnProperty("value") ||
      payload.type !== "webcontent" ||
      !payload.value.hasOwnProperty("url") ||
      !payload.value.hasOwnProperty("document") ||
      !payload.value.hasOwnProperty("cookies")
    ) {
      return false;
    }
    const urlRegExp = new RegExp("https?://scholar.google.*");
    return urlRegExp.test(payload.url);
  }

  static async scrape(
    payload: IWebcontentGoogleScholarEntryScraperPayload
  ): Promise<PaperEntity[]> {
    if (!this.validPayload(payload)) {
      return [];
    }

    const paper = parse(payload.value.document);

    if (paper) {
      let entityDraft = new PaperEntity(true);
      const fileUrlNode = paper.querySelector(".gs_or_ggsm")?.firstChild;
      // @ts-ignore
      const downloadURL = fileUrlNode?.attributes["href"];
      if (downloadURL) {
        const downloadedFilePath = await window.networkTool.downloadPDFs([
          downloadURL,
        ]);

        if (downloadedFilePath) {
          if (downloadedFilePath.length > 0) {
            entityDraft.mainURL = downloadedFilePath[0];
          }
        }
      }

      // @ts-ignore
      const paperInfo = paper.childNodes[0].lastChild;
      let title = paperInfo.childNodes[0];
      if (title) {
        let titleStr = title.childNodes.pop()?.rawText;

        if (titleStr) {
          const headers = {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
          };
          const scrapeUrl = `https://scholar.google.com/scholar?q=${titleStr.replaceAll(
            " ",
            "+"
          )}`;
          await window.networkTool.get(scrapeUrl, headers, 0, true);

          const dataid = title.parentNode.parentNode.attributes["data-aid"];
          if (dataid) {
            const citeUrl = `https://scholar.google.com/scholar?q=info:${dataid}:scholar.google.com/&output=cite&scirp=1&hl=en`;
            const citeResponse = await window.networkTool.get(
              citeUrl,
              headers,
              0,
              true
            );
            if (citeResponse?.body) {
              const citeRoot = parse(citeResponse?.body);
              const citeBibtexNode = citeRoot.lastChild
                .childNodes[0] as any as HTMLElement;
              if (citeBibtexNode) {
                // @ts-ignore
                const citeBibtexUrl = citeBibtexNode.attributes["href"];
                if (citeBibtexUrl) {
                  const citeBibtexResponse = await window.networkTool.get(
                    citeBibtexUrl,
                    headers,
                    0,
                    true
                  );
                  const bibtexStr = citeBibtexResponse?.body;
                  if (bibtexStr) {
                    const bibtexs = bibtex2json(bibtexStr);
                    if (bibtexs.length > 0) {
                      const bibtex = bibtexs[0];
                      if (bibtex) {
                        return [bibtex2paperEntityDraft(bibtex, entityDraft)];
                      } else {
                        return [];
                      }
                    } else {
                      return [];
                    }
                  } else {
                    return [];
                  }
                } else {
                  return [];
                }
              } else {
                return [];
              }
            } else {
              return [];
            }
          } else {
            return [];
          }
        } else {
          return [];
        }
      } else {
        return [];
      }
    } else {
      return [];
    }
  }
}
