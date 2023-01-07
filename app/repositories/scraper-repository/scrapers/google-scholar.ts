import { parse } from "node-html-parser";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { bibtex2json, bibtex2paperEntityDraft } from "@/utils/bibtex";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType, ScraperType } from "./scraper";

async function scrapeImpl(
  this: ScraperType,
  paperEntityDraft: PaperEntity
): Promise<PaperEntity> {
  const { scrapeURL, headers, enable } = this.preProcess(
    paperEntityDraft
  ) as ScraperRequestType;

  if (enable) {
    const response = await window.networkTool.get(scrapeURL, headers, 0, true);

    let bibtex = "";

    if (response?.body) {
      const root = parse(response?.body);
      const results = root.querySelector("#gs_res_ccl_mid");

      if (results) {
        for (let node of results.childNodes) {
          if (node.nodeType === 1) {
            const paper = node.childNodes[1];
            if (paper) {
              let title = paper.childNodes[0];
              if (title) {
                let titleStr = title.childNodes.pop()?.rawText;
                if (titleStr) {
                  const plainHitTitle = formatString({
                    str: titleStr,
                    removeStr: "&amp;",
                    removeSymbol: true,
                    lowercased: true,
                  });

                  const existTitle = formatString({
                    str: paperEntityDraft.title,
                    removeStr: "&amp;",
                    removeSymbol: true,
                    lowercased: true,
                  });

                  if (plainHitTitle === existTitle) {
                    const dataid =
                      title.parentNode.parentNode.attributes["data-aid"];

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
                        if (citeBibtexNode && citeBibtexNode.attributes) {
                          // @ts-ignore
                          if (citeBibtexNode.attributes["href"]) {
                            // @ts-ignore
                            const citeBibtexUrl =
                              // @ts-ignore
                              citeBibtexNode.attributes["href"];
                            if (citeBibtexUrl) {
                              const citeBibtexResponse =
                                await window.networkTool.get(
                                  citeBibtexUrl,
                                  headers,
                                  0,
                                  true
                                );
                              bibtex = citeBibtexResponse?.body;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return this.parsingProcess(bibtex, paperEntityDraft) as PaperEntity;
  } else {
    return paperEntityDraft;
  }
}

export class GoogleScholarScraper extends Scraper {
  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    super(stateStore, preference);
  }

  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      paperEntityDraft.title !== "" &&
      this.isPreprint(paperEntityDraft) &&
      this.getEnable("googlescholar");

    const query = paperEntityDraft.title.replace(/ /g, "+");

    const scrapeURL = `https://scholar.google.com/scholar?q=${query}`;

    const headers = {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
    };

    if (enable) {
      this.stateStore.logState.processLog = `Scraping metadata from google scholar ...`;
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: string,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    if (rawResponse) {
      const bibtexs = bibtex2json(
        rawResponse.replace("\\'", "").replace('\\"', "")
      );
      for (const bibtex of bibtexs) {
        paperEntityDraft = bibtex2paperEntityDraft(bibtex, paperEntityDraft);

        this.uploadCache(paperEntityDraft, "googlescholar");
        break;
      }
    }

    return paperEntityDraft;
  }

  scrapeImpl = scrapeImpl;
}
