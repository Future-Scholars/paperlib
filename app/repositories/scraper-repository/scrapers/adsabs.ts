import { Response } from "got";
import stringSimilarity from "string-similarity";

import { PaperEntity } from "@/models/paper-entity";
import { cryptoAndSign } from "@/utils/crypto/crypto";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";

interface ResponseType {
  response: {
    docs: [
      {
        author: string[];
        doi?: string[];
        issue: string;
        page: string[];
        pub: string;
        pubdate: string;
        title: string[];
        year: string;
        doctype: string;
        volume: string;
      }
    ];
  };
}

export class AdsabsScraper extends Scraper {
  static checkEnable(paperEntityDraft: PaperEntity): boolean {
    return paperEntityDraft.title !== "";
  }

  static preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const scrapeURL = `https://api.paperlib.app/publicdb/query`;
    const headers = {};

    const content = {
      query: `title:${formatString({
        str: paperEntityDraft.title,
        removeNewline: true,
      }).toLowerCase()}`,
      database: "adsabs",
    };

    return { scrapeURL, headers, content };
  }

  static parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const parsedResponse = JSON.parse(rawResponse.body) as ResponseType;

    for (const item of parsedResponse.response.docs) {
      const plainHitTitle = formatString({
        str: item.title.join(" - "),
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
        paperEntityDraft.setValue(
          "title",
          item.title.join(" ") || "",
          false,
          true
        );
        if (item.doi) {
          paperEntityDraft.setValue("doi", item.doi[0] || "", false);
        }

        if (item.doctype.includes("journal")) {
          paperEntityDraft.setValue("pubType", 0, false);
        } else if (item.doctype.includes("book")) {
          paperEntityDraft.setValue("pubType", 3, false);
        } else if (item.doctype.includes("proceeding")) {
          paperEntityDraft.setValue("pubType", 1, false);
        } else {
          paperEntityDraft.setValue("pubType", 2, false);
        }

        paperEntityDraft.setValue("pages", item.page.join("-"), false);
        paperEntityDraft.setValue("publication", item.pub, false);
        paperEntityDraft.setValue("pubTime", `${item.year.slice(0, 4)}`, false);
        paperEntityDraft.setValue(
          "authors",
          item.author
            .map((a) =>
              a
                .split(",")
                .map((n) => n.trim())
                .reverse()
                .join(" ")
            )
            .join(", "),
          false
        );
        paperEntityDraft.setValue("number", item.issue, false);
        paperEntityDraft.setValue("volume", item.volume, false);

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

    return paperEntityDraft;
  }
}
