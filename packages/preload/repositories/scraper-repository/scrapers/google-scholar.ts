import { parse } from "node-html-parser";
import { BibtexParser } from "bibtex-js-parser";

import { Scraper, ScraperRequestType, ScraperType } from "./scraper";
import { formatString } from "../../../utils/string";
import { Preference } from "../../../utils/preference";
import { SharedState } from "../../../utils/appstate";
import { safeGot } from "../../../utils/got";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";

async function scrapeImpl(
  this: ScraperType,
  entityDraft: PaperEntityDraft
): Promise<PaperEntityDraft> {
  const { scrapeURL, headers, enable } = this.preProcess(
    entityDraft
  ) as ScraperRequestType;

  if (enable) {
    const agent = this.getProxyAgent();
    const response = await safeGot(scrapeURL, headers, agent);

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
                    removeStr: "&amp",
                    removeSymbol: true,
                    lowercased: true,
                  });

                  const existTitle = formatString({
                    str: entityDraft.title,
                    removeStr: "&amp",
                    removeSymbol: true,
                    lowercased: true,
                  });

                  if (plainHitTitle === existTitle) {
                    const dataid =
                      title.parentNode.parentNode.attributes["data-aid"];

                    if (dataid) {
                      const citeUrl = `https://scholar.google.com/scholar?q=info:${dataid}:scholar.google.com/&output=cite&scirp=1&hl=en`;
                      const citeResponse = await safeGot(
                        citeUrl,
                        headers,
                        agent
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
                              const citeBibtexResponse = await safeGot(
                                citeBibtexUrl,
                                headers,
                                agent
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
    return this.parsingProcess(bibtex, entityDraft) as PaperEntityDraft;
  } else {
    return entityDraft;
  }
}

export class GoogleScholarScraper extends Scraper {
  constructor(sharedState: SharedState, preference: Preference) {
    super(sharedState, preference);
  }

  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    const enable =
      entityDraft.title !== "" &&
      (entityDraft.publication === "" ||
        entityDraft.publication.toLowerCase().includes("arxiv") ||
        entityDraft.publication.toLowerCase().includes("openreview")) &&
      this.getEnable("googlescholar");

    const query = entityDraft.title.replace(/ /g, "+");

    const scrapeURL = `https://scholar.google.com/scholar?q=${query}`;

    const headers = {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
    };

    if (enable) {
      this.sharedState.set(
        "viewState.processInformation",
        `Scraping metadata from google scholar ...`
      );
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: string,
    entityDraft: PaperEntityDraft
  ): PaperEntityDraft {
    if (rawResponse) {
      const bibtexs = BibtexParser.parseToJSON(
        rawResponse.replace("\\'", "").replace('\\"', "")
      );
      for (const bibtex of bibtexs) {
        if (bibtex.year) {
          entityDraft.pubTime = `${bibtex.year}`;
        }
        if (bibtex.author) {
          const authors = bibtex.author
            .split(" and ")
            .map((author) => {
              const first_last = author.split(",").map((author) => {
                return author.trim();
              });
              first_last.reverse();
              return first_last.join(" ");
            })
            .join(", ");
          entityDraft.authors = authors;
        }
        if (bibtex.type === "article") {
          if (
            bibtex.journal &&
            (entityDraft.publication === "" ||
              !bibtex.journal.toLowerCase().includes("arxiv"))
          ) {
            entityDraft.publication = bibtex.journal;
          }
          entityDraft.pubType = 0;
        } else if (
          bibtex.type === "inproceedings" ||
          bibtex.type === "incollection"
        ) {
          if (
            bibtex.booktitle &&
            (entityDraft.publication === "" ||
              !bibtex.booktitle.toLowerCase().includes("arxiv"))
          ) {
            entityDraft.publication = bibtex.booktitle;
          }
          entityDraft.pubType = 1;
        } else if (bibtex.type === "book") {
          if (
            bibtex.publisher &&
            (entityDraft.publication === "" ||
              !bibtex.publisher.toLowerCase().includes("arxiv"))
          ) {
            entityDraft.publication = bibtex.publisher;
          }
          entityDraft.pubType = 3;
        } else {
          if (
            bibtex.journal &&
            (entityDraft.publication === "" ||
              !bibtex.journal.toLowerCase().includes("arxiv"))
          ) {
            entityDraft.publication = bibtex.journal;
          }
          entityDraft.pubType = 2;
        }

        if (bibtex.pages) {
          entityDraft.pages = bibtex.pages;
        }
        if (bibtex.volume) {
          entityDraft.volume = bibtex.volume;
        }
        if (bibtex.number) {
          entityDraft.setValue("number", `${bibtex.number}`);
        }
        if (bibtex.publisher) {
          entityDraft.setValue("publisher", `${bibtex.publisher}`);
        }
      }
    }

    return entityDraft;
  }

  scrapeImpl = scrapeImpl;
}
