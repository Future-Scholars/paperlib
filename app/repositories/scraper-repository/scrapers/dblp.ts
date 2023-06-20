import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { bibtex2json } from "@/utils/bibtex";
import { isMetadataCompleted } from "@/utils/metadata";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";

interface ResponseType {
  result: {
    hits: {
      "@sent": number;
      hit: {
        info: {
          title: string;
          authors: {
            author:
              | {
                  "@pid": string;
                  text: string;
                }
              | { text: string }[];
          };
          venue: string;
          year: string;
          type: string;
          key: string;
          volume: string;
          pages: string;
          number: string;
          publisher: string;
          doi?: string;
        };
      }[];
    };
  };
}

export class DBLPScraper extends Scraper {
  static checkEnable(paperEntityDraft: PaperEntity): boolean {
    return (
      paperEntityDraft.title.replaceAll("&amp;", "").replaceAll("&", "") !==
        "" && !isMetadataCompleted(paperEntityDraft)
    );
  }

  static preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    let dblpQuery = formatString({
      str: paperEntityDraft.title,
      removeStr: "&amp;",
    });
    dblpQuery = formatString({
      str: dblpQuery,
      removeStr: "&",
    }).replace("—", "-");

    const scrapeURL =
      "https://dblp.org/search/publ/api?q=" + dblpQuery + "&format=json";
    const headers = {};

    return { scrapeURL, headers };
  }

  static parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const response = JSON.parse(rawResponse.body) as ResponseType;

    if (response.result.hits["@sent"] > 0) {
      for (const hit of response.result.hits.hit) {
        const article = hit.info;

        const plainHitTitle = formatString({
          str: article.title,
          removeStr: "&amp;",
          removeSymbol: true,
          removeNewline: true,
          removeWhite: true,
          lowercased: true,
        });

        const existTitle = formatString({
          str: paperEntityDraft.title,
          removeStr: "&amp;",
          removeSymbol: true,
          removeNewline: true,
          removeWhite: true,
          lowercased: true,
        });
        if (plainHitTitle != existTitle) {
          continue;
        } else {
          const title = article.title.replace(/&amp;/g, "&").replace(/\.$/, "");

          const authorList: string[] = [];
          const authorResponse = article.authors.author;

          if ("@pid" in authorResponse) {
            authorList.push(authorResponse.text.replace(/[0-9]/g, "").trim());
          } else {
            for (const author of authorResponse) {
              authorList.push(author.text.replace(/[0-9]/g, "").trim());
            }
          }
          const authors = authorList.join(", ");

          const pubTime = article.year;
          let pubType;
          if (article.type.includes("Journal")) {
            pubType = 0;
          } else if (article.type.includes("Conference")) {
            pubType = 1;
          } else if (article.type.includes("Book")) {
            pubType = 3;
          } else {
            pubType = 2;
          }
          const paperKey = article.key;
          const pubKey = article.key.split("/").slice(0, 2).join("/");
          const venueKey = article.venue;

          if (
            pubKey != "journals/corr" ||
            (pubKey == "journals/corr" && venueKey != "CoRR")
          ) {
            if (article.doi) {
              paperEntityDraft.setValue("doi", article.doi);
            }
            paperEntityDraft.setValue("title", title, false, true);
            paperEntityDraft.setValue("authors", authors);
            paperEntityDraft.setValue("pubTime", `${pubTime}`);
            paperEntityDraft.setValue("pubType", pubType);
            paperEntityDraft.setValue(
              "publication",
              "dblp://" +
                JSON.stringify({
                  venueID: pubKey == "journals/corr" ? venueKey : pubKey,
                  paperKey: paperKey,
                })
            );

            if (article.volume) {
              paperEntityDraft.setValue("volume", article.volume);
            }
            if (article.pages) {
              paperEntityDraft.setValue("pages", article.pages);
            }
            if (article.number) {
              paperEntityDraft.setValue("number", article.number);
            }
            if (article.publisher) {
              paperEntityDraft.setValue("publisher", article.publisher);
            }
          }
          break;
        }
      }
    }

    return paperEntityDraft;
  }

  static async _scrapeRequest(
    scrapeURL: string,
    headers: Record<string, string>
  ) {
    let rawSearchResponse: Response<string> | null;
    try {
      rawSearchResponse = (await networkTool.get(
        scrapeURL,
        headers
      )) as Response<string>;
    } catch (e) {
      console.error(e);
      rawSearchResponse = null;
    }

    if (!rawSearchResponse) {
      // Try an alternative URL
      const alternativeURL = scrapeURL.replace("dblp.org", "dblp.uni-trier.de");
      rawSearchResponse = (await networkTool.get(
        alternativeURL,
        headers
      )) as Response<string>;
    }

    return rawSearchResponse;
  }

  static async scrape(
    paperEntityDraft: PaperEntity,
    force = false
  ): Promise<PaperEntity> {
    if (!this.checkEnable(paperEntityDraft) && !force) {
      return paperEntityDraft;
    }

    const { scrapeURL, headers } = this.preProcess(paperEntityDraft);

    // Initial request
    const rawSearchResponse = await this._scrapeRequest(scrapeURL, headers);

    paperEntityDraft = this.parsingProcess(rawSearchResponse, paperEntityDraft);

    // Request by time
    for (const timeOffset of [0, 1]) {
      if (!paperEntityDraft.publication.includes("dblp://")) {
        const baseScrapeURL = scrapeURL.slice(
          0,
          scrapeURL.indexOf("&format=json")
        );

        const year = parseInt(paperEntityDraft.pubTime);
        const offsetScrapeURL =
          baseScrapeURL + " " + `year:${year - timeOffset}` + "&format=json";

        const rawSearchResponse = await this._scrapeRequest(
          offsetScrapeURL,
          headers
        );

        paperEntityDraft = this.parsingProcess(
          rawSearchResponse,
          paperEntityDraft
        );
      }
    }

    // Request venue
    if (paperEntityDraft.publication.includes("dblp://")) {
      const { venueID, paperKey } = JSON.parse(
        paperEntityDraft.publication.replace("dblp://", "")
      ) as { venueID: string; paperKey: string };
      const venueScrapeURL =
        "https://dblp.org/search/venue/api?q=" + venueID + "&format=json";

      const rawSearchResponse = await this._scrapeRequest(
        venueScrapeURL,
        headers
      );

      // Try to fetch bib to handel workshop papers
      const bibURL = `https://dblp.org/rec/${paperKey}.bib?param=1`;
      const rawBibResponse = await this._scrapeRequest(bibURL, headers);

      paperEntityDraft = this.parsingProcessVenue(
        {
          apiResponse: rawSearchResponse,
          bibResponse: rawBibResponse,
        },
        paperEntityDraft,
        venueID
      );
    }

    return paperEntityDraft;
  }

  static parsingProcessVenue(
    rawResponse: Record<string, Response<string>>,
    paperEntityDraft: PaperEntity,
    venueID: string
  ): PaperEntity {
    const { apiResponse, bibResponse } = rawResponse;

    const response = JSON.parse(apiResponse.body) as {
      result: {
        hits: {
          "@sent": number;
          hit: {
            info: {
              url: string;
              venue: string;
            };
          }[];
        };
      };
    };

    if (response.result.hits["@sent"] > 0) {
      const hits = response.result.hits.hit;
      for (const hit of hits) {
        const venueInfo = hit["info"];
        if (venueInfo["url"].includes(venueID.toLowerCase())) {
          const venue = venueInfo["venue"];
          paperEntityDraft.setValue("publication", venue);
          break;
        } else {
          paperEntityDraft.setValue("publication", "", true);
        }
      }

      // handle workshop
      try {
        const bibtex = bibtex2json(bibResponse.body);
        if (bibtex[0]["container-title"].toLowerCase().includes("workshop")) {
          paperEntityDraft.setValue(
            "publication",
            paperEntityDraft.publication + " Workshop"
          );
          paperEntityDraft.setValue("pubType", 1);
        }
      } catch (e) {}
    } else {
      paperEntityDraft.setValue("publication", "", true);
    }
    return paperEntityDraft;
  }
}
