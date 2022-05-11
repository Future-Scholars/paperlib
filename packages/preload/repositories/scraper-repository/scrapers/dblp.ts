import { Response } from "got";

import { Scraper, ScraperRequestType } from "./scraper";
import { formatString } from "../../../utils/string";
import { Preference } from "../../../utils/preference";
import { SharedState } from "../../../utils/appstate";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";

function parsingProcess(
  rawResponse: Response<string>,
  entityDraft: PaperEntityDraft
): PaperEntityDraft {
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
            year: string;
            type: string;
            key: string;
            volume: string;
            pages: string;
            number: string;
            publisher: string;
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
        const pubKey = article.key.split("/").slice(0, 2).join("/");

        if (pubKey != "journals/corr") {
          entityDraft.setValue("title", title);
          entityDraft.setValue("authors", authors);
          entityDraft.setValue("pubTime", `${pubTime}`);
          entityDraft.setValue("pubType", pubType);
          entityDraft.setValue("publication", "dblp://" + pubKey);

          if (article.volume) {
            entityDraft.setValue("volume", article.volume);
          }
          if (article.pages) {
            entityDraft.setValue("pages", article.pages);
          }
          if (article.number) {
            entityDraft.setValue("number", article.number);
          }
          if (article.publisher) {
            entityDraft.setValue("publisher", article.publisher);
          }
        }
        break;
      }
    }
  }

  return entityDraft;
}

export class DBLPScraper extends Scraper {
  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    let dblpQuery = formatString({
      str: entityDraft.title,
      removeStr: "&amp",
    });
    dblpQuery = formatString({
      str: dblpQuery,
      removeStr: "&",
    }).replace("—", "-");

    const enable =
      dblpQuery !== "" && (this.preference.get("dblpScraper") as boolean);
    const scrapeURL =
      "https://dblp.org/search/publ/api?q=" + dblpQuery + "&format=json";
    const headers = {};

    if (enable) {
      this.sharedState.set(
        "viewState.processInformation",
        `Scraping metadata from dblp.com ...`
      );
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess = parsingProcess;
}

export class DBLPbyTimeScraper extends Scraper {
  offset: number;

  constructor(
    sharedState: SharedState,
    preference: Preference,
    offset: number
  ) {
    super(sharedState, preference);
    this.offset = offset;
  }

  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    const year = parseInt(entityDraft.pubTime);

    let dblpQuery = formatString({
      str: entityDraft.title,
      removeStr: "&amp",
    });
    dblpQuery = formatString({
      str: dblpQuery,
      removeStr: "&",
    }).replace("—", "-");
    dblpQuery += " " + `year:${year + this.offset}`;

    const enable =
      dblpQuery !== "" && (this.preference.get("dblpScraper") as boolean);
    const scrapeURL =
      "https://dblp.org/search/publ/api?q=" + dblpQuery + "&format=json";

    const headers = {};

    return { scrapeURL, headers, enable };
  }

  parsingProcess = parsingProcess;
}

export class DBLPVenueScraper extends Scraper {
  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    const enable = entityDraft.publication.startsWith("dblp://");

    const scrapeURL =
      "https://dblp.org/search/venue/api?q=" +
      entityDraft.publication.replace("dblp://", "") +
      "&format=json";

    const headers = {};
    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    entityDraft: PaperEntityDraft
  ): PaperEntityDraft {
    const response = JSON.parse(rawResponse.body) as {
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
        if (
          venueInfo["url"].includes(
            entityDraft.publication.replace("dblp://", "") + "/"
          )
        ) {
          const venue = venueInfo["venue"];
          entityDraft.setValue("publication", venue);
          break;
        } else {
          entityDraft.setValue("publication", "");
        }
      }
    } else {
      entityDraft.setValue("publication", "");
    }
    return entityDraft;
  }
}
