import { Response } from "got";
import stringSimilarity from "string-similarity";

import { PaperEntity } from "@/models/paper-entity";
import { cryptoAndSign } from "@/utils/crypto/crypto";
import { formatString } from "@/utils/string";

import { DOIScraper } from "./doi";
import { Scraper, ScraperRequestType } from "./scraper";

interface ResponseType {
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
}

export class ScopusScraper extends Scraper {
  static checkEnable(paperEntityDraft: PaperEntity): boolean {
    return paperEntityDraft.title !== "";
  }

  static preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const scrapeURL = `https://api.paperlib.app/publicdb/query`;
    const headers = {};

    const content = {
      query: `TITLE(${formatString({
        str: paperEntityDraft.title,
        removeNewline: true,
      })})`,
      database: "scopus",
    };

    return { scrapeURL, headers, content };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const parsedResponse = JSON.parse(rawResponse.body) as ResponseType;
    for (const item of parsedResponse["search-results"].entry) {
      const plainHitTitle = formatString({
        str: item["dc:title"],
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

      const sim = stringSimilarity.compareTwoStrings(plainHitTitle, existTitle);
      if (sim > 0.95) {
        paperEntityDraft.setValue("doi", item["prism:doi"], false);

        if (item["prism:aggregationType"].includes("journal")) {
          paperEntityDraft.setValue("pubType", 0, false);
        } else if (item["prism:aggregationType"].includes("book")) {
          paperEntityDraft.setValue("pubType", 3, false);
        } else {
          paperEntityDraft.setValue("pubType", 2, false);
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

  static async scrape(
    paperEntityDraft: PaperEntity,
    force = false
  ): Promise<PaperEntity> {
    if (!this.checkEnable(paperEntityDraft) && !force) {
      return paperEntityDraft;
    }

    const { scrapeURL, headers, content } = this.preProcess(paperEntityDraft);

    const signedData = cryptoAndSign(content!);

    const response = (await window.networkTool.post(
      scrapeURL,
      signedData,
      headers,
      1,
      5000
    )) as Response<string>;
    paperEntityDraft = this.parsingProcess(response, paperEntityDraft);

    paperEntityDraft = await DOIScraper.scrape(paperEntityDraft);

    return paperEntityDraft;
  }
}
