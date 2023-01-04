import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { Preference, ScraperPreference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType, ScraperType } from "./scraper";
import { DOIInnerScraper } from "./doi-inner";
import { bibtex2json } from "@/utils/bibtex";

function parsingProcess(
  this: ScraperType,
  rawResponse: Response<string>,
  paperEntityDraft: PaperEntity
): PaperEntity {
  const response = JSON.parse(rawResponse.body) as {
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
  };
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
        const title = article.title.replace(/&amp;/g, "&");

        const authorList = [];
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

        if ((pubKey != "journals/corr") || (pubKey == "journals/corr" && venueKey != "CoRR")) {
          if (article.doi) {
            paperEntityDraft.setValue("doi", article.doi);
          }
          paperEntityDraft.setValue("title", title);
          paperEntityDraft.setValue("authors", authors);
          paperEntityDraft.setValue("pubTime", `${pubTime}`);
          paperEntityDraft.setValue("pubType", pubType);
          if (pubKey == "journals/corr") {
            paperEntityDraft.setValue("publication", "dblp://" + JSON.stringify({ 'venueID': pubKey == "journals/corr" ? venueKey : pubKey, 'paperKey': paperKey }));
          }

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

export class DBLPScraper extends Scraper {
  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    let dblpQuery = formatString({
      str: paperEntityDraft.title,
      removeStr: "&amp;",
    });
    dblpQuery = formatString({
      str: dblpQuery,
      removeStr: "&",
    }).replace("—", "-");

    const enable =
      dblpQuery !== "" &&
      this.isPreprint(paperEntityDraft) &&
      this.getEnable("dblp");
    const scrapeURL =
      "https://dblp.org/search/publ/api?q=" + dblpQuery + "&format=json";
    const headers = {};

    if (enable) {
      this.stateStore.logState.processLog = `Scraping metadata from dblp.com ...`;
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess = parsingProcess;
  scrapeImpl = scrapeImpl;
}

export class DBLPbyTimeScraper extends Scraper {
  offset: number;

  constructor(
    stateStore: MainRendererStateStore,
    preference: Preference,
    offset: number
  ) {
    super(stateStore, preference);
    this.offset = offset;
  }

  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const year = parseInt(paperEntityDraft.pubTime);

    let dblpQuery = formatString({
      str: paperEntityDraft.title,
      removeStr: "&amp;",
    });
    dblpQuery = formatString({
      str: dblpQuery,
      removeStr: "&",
    }).replace("—", "-");
    dblpQuery += " " + `year:${year + this.offset}`;

    const enable =
      dblpQuery !== "" &&
      this.getEnable("dblp") &&
      this.isPreprint(paperEntityDraft);
    const scrapeURL =
      "https://dblp.org/search/publ/api?q=" + dblpQuery + "&format=json";

    const headers = {};

    return { scrapeURL, headers, enable };
  }

  parsingProcess = parsingProcess;
  scrapeImpl = scrapeImpl;
}

async function scrapeImpl(
  this: ScraperType,
  paperEntityDraft: PaperEntity,
  force = false
): Promise<PaperEntity> {
  const { scrapeURL, headers, enable } = this.preProcess(
    paperEntityDraft
  ) as ScraperRequestType;

  if (enable || force) {
    let response: Response<string> | null;
    try {
      response = (await window.networkTool.get(
        scrapeURL,
        headers
      )) as Response<string>;
    } catch (e) {
      console.error(e);
      response = null;
    }

    if (!response) {
      // Try an alternative URL
      const alternativeURL = scrapeURL.replace("dblp.org", "dblp.uni-trier.de");
      response = (await window.networkTool.get(
        alternativeURL,
        headers
      )) as Response<string>;
    }

    return this.parsingProcess(response, paperEntityDraft) as PaperEntity;
  } else {
    return paperEntityDraft;
  }
}

export class DBLPVenueScraper extends Scraper {
  doiScraper: DOIInnerScraper;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    super(stateStore, preference);

    this.doiScraper = new DOIInnerScraper(stateStore, preference);
  }

  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable = this.getEnable("dblp") && paperEntityDraft.publication !== "";

    const scrapeURL =
      "https://dblp.org/search/venue/api?q=" +
      paperEntityDraft.publication +
      "&format=json";
    const headers = {};
    return { scrapeURL, headers, enable };
  }

  // @ts-ignore
  parsingProcess(
    rawResponse: Record<string, Response<string>>,
    paperEntityDraft: PaperEntity
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

    const venueID = paperEntityDraft.publication;
    if (response.result.hits["@sent"] > 0) {
      const hits = response.result.hits.hit;
      for (const hit of hits) {
        const venueInfo = hit["info"];
        if (venueInfo["url"].includes(venueID.toLowerCase())) {
          const venue = venueInfo["venue"];
          paperEntityDraft.setValue("publication", venue);
          this.uploadCache(paperEntityDraft, "dblp");
          break;
        } else {
          paperEntityDraft.setValue("publication", "", true);
        }
      }

      // handle workshop
      try {
        const bibtex = bibtex2json(bibResponse.body);
        if (bibtex[0]["container-title"].toLowerCase().includes('workshop')) {
          paperEntityDraft.setValue("publication", paperEntityDraft.publication + " Workshop");
        }
      } catch (e) {
      }


    } else {
      paperEntityDraft.setValue("publication", "", true);
    }
    return paperEntityDraft;
  }

  // @ts-ignore
  scrapeImpl = venueScrapeImpl;
}


async function venueScrapeImpl(
  this: DBLPVenueScraper,
  paperEntityDraft: PaperEntity,
  force = false
): Promise<PaperEntity> {

  const useDOIforVenue = (this.preference.get("scrapers") as Record<string, ScraperPreference>)[
    "dblp"
  ]?.args !== 'use-dblp'

  const dblpVenueIdPaperKey = paperEntityDraft.publication

  if (paperEntityDraft.doi && useDOIforVenue) {
    paperEntityDraft.publication = ""
    paperEntityDraft = await this.doiScraper.scrape(paperEntityDraft, force);
  }

  if (dblpVenueIdPaperKey.startsWith("dblp://") && (paperEntityDraft.publication === "" || paperEntityDraft.publication === dblpVenueIdPaperKey)) {
    console.log(dblpVenueIdPaperKey)
    const { venueID, paperKey } = JSON.parse(dblpVenueIdPaperKey.replace("dblp://", "")) as { venueID: string, paperKey: string }
    console.log(venueID, paperKey)

    paperEntityDraft.publication = venueID
    const { scrapeURL, headers, enable } = this.preProcess(
      paperEntityDraft
    ) as ScraperRequestType;

    if (enable || force) {
      let response: Response<string> | null;
      try {
        response = (await window.networkTool.get(
          scrapeURL,
          headers
        )) as Response<string>;
      } catch (e) {
        console.error(e);
        response = null;
      }

      if (!response) {
        // Try an alternative URL
        const alternativeURL = scrapeURL.replace("dblp.org", "dblp.uni-trier.de");
        response = (await window.networkTool.get(
          alternativeURL,
          headers
        )) as Response<string>;
      }

      // Try to fetch bib to handel workshop papers
      const bibURL = `https://${response ? 'dblp.org' : 'dblp.uni-trier.de'}/rec/${paperKey}.bib?param=1`
      const bibResponse = (await window.networkTool.get(
        bibURL,
        headers
      )) as Response<string>;

      paperEntityDraft = this.parsingProcess(
        {
          'apiResponse': response,
          'bibResponse': bibResponse
        },
        paperEntityDraft) as PaperEntity;
    }

    if (paperEntityDraft.publication === venueID) {
      paperEntityDraft.publication = ""
    }

  }

  return paperEntityDraft;
}