import { Response } from "got";
import stringSimilarity from "string-similarity";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { cryptoAndSign } from "@/utils/crypto/crypto";
import { formatString } from "@/utils/string";

import { DOIScraper } from "./doi";
import { Scraper, ScraperRequestType } from "./scraper";

export class ScopusScraper extends Scraper {
  doiScraper: DOIScraper;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    super(stateStore, preference);

    this.doiScraper = new DOIScraper(stateStore, preference);
  }

  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      this.getEnable("scopus") &&
      paperEntityDraft.title !== "" &&
      this.isPreprint(paperEntityDraft);

    // FIXME: Scopus API.
    const scrapeURL = `http://127.0.0.1:3000/publicdb/query`;
    const headers = {};
    if (enable) {
      this.stateStore.logState.processLog = `Scraping metadata from Elseivier Scopus...`;
    }

    const content = {
      query: `TITLE(${formatString({
        str: paperEntityDraft.title,
        removeNewline: true,
      })})`,
      database: "scopus",
    };

    return { scrapeURL, headers, enable, content };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    console.log(rawResponse.body);
    const parsedResponse = JSON.parse(rawResponse.body) as {
      "search-results": {
        entry: [
          {
            "dc:title": string;
            "dc:creator": string;
            "prism:volume": string;
            "prism:issueIdentifier": string;
            "prism:pageRange": string;
            "prism:coverDate": string;
            "prism:doi": string;
            "prism:aggregationType": string;
            "prism:publicationName": string;
          }
        ];
      };
    };
    for (const item of parsedResponse["search-results"].entry) {
      const plainHitTitle = formatString({
        str: item["dc:title"],
        removeStr: "&amp",
        removeSymbol: true,
        lowercased: true,
      });

      const existTitle = formatString({
        str: paperEntityDraft.title,
        removeStr: "&amp",
        removeSymbol: true,
        lowercased: true,
      });

      const sim = stringSimilarity.compareTwoStrings(plainHitTitle, existTitle);
      if (sim > 0.95) {
        paperEntityDraft.setValue("doi", item["prism:doi"], false);

        if (item["prism:aggregationType"].includes("journal")) {
          paperEntityDraft.setValue("type", 0, false);
        } else if (item["prism:aggregationType"].includes("book")) {
          paperEntityDraft.setValue("type", 3, false);
        } else {
          paperEntityDraft.setValue("type", 2, false);
        }

        paperEntityDraft.setValue("pages", item["prism:pageRange"], false);
        paperEntityDraft.setValue(
          "publication",
          item["prism:publicationName"],
          false
        );
        paperEntityDraft.setValue(
          "pubTime",
          `${item["prism:coverDate"].slice(0, 4)}`,
          false
        );
        paperEntityDraft.setValue(
          "authors",
          item["dc:creator"] + " et al.",
          false
        );
        paperEntityDraft.setValue(
          "number",
          item["prism:issueIdentifier"],
          false
        );
        paperEntityDraft.setValue("volume", item["prism:volume"], false);
        break;
      }
    }

    return paperEntityDraft;
  }

  // @ts-ignore
  scrapeImpl = scrapeImpl;
}

async function scrapeImpl(
  this: ScopusScraper,
  paperEntityDraft: PaperEntity,
  force = false
): Promise<PaperEntity> {
  const { scrapeURL, headers, enable, content } = this.preProcess(
    paperEntityDraft
  ) as ScraperRequestType;

  if (enable || force) {
    const signedData = cryptoAndSign(content!);

    const response = (await window.networkTool.post(
      scrapeURL,
      signedData,
      headers,
      1,
      5000
    )) as Response<string>;
    paperEntityDraft = this.parsingProcess(
      response,
      paperEntityDraft
    ) as PaperEntity;

    paperEntityDraft = await this.doiScraper.scrape(paperEntityDraft, true);
    this.uploadCache(paperEntityDraft, "scopus");

    return paperEntityDraft;
  } else {
    return paperEntityDraft;
  }
}
