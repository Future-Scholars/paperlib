import { Response } from "got";
import stringSimilarity from "string-similarity";

import { PaperEntity } from "@/models/paper-entity";
import { cryptoAndSign } from "@/utils/crypto/crypto";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";

interface ResponseType {
  records: [
    {
      title: string;
      creators: [
        {
          creator: string;
        }
      ];
      publicationName: string;
      doi: string;
      publisher?: string;
      publicationDate: string;
      contentType: string;
      volume?: string;
      number?: string;
      startingPage?: string;
      endingPage?: string;
    }
  ];
}

export class SpringerScraper extends Scraper {
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
      database: "springer",
    };

    return { scrapeURL, headers, content };
  }

  static parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const parsedResponse = JSON.parse(rawResponse.body) as ResponseType;

    for (const item of parsedResponse.records) {
      const plainHitTitle = formatString({
        str: item.title,
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
          item.title.replaceAll("&amp;", "&"),
          false,
          true
        );
        paperEntityDraft.setValue("doi", item.doi, false);

        if (item.contentType.toLowerCase().includes("journal")) {
          paperEntityDraft.setValue("pubType", 0, false);
        } else if (item.contentType.toLowerCase().includes("book")) {
          paperEntityDraft.setValue("pubType", 3, false);
        } else if (item.contentType.toLowerCase().includes("conference")) {
          paperEntityDraft.setValue("pubType", 1, false);
        } else {
          paperEntityDraft.setValue("pubType", 2, false);
        }

        if (item.startingPage && item.endingPage) {
          paperEntityDraft.setValue(
            "pages",
            `${item.startingPage}-${item.endingPage}`,
            false
          );
        }
        paperEntityDraft.setValue("publication", item.publicationName, false);
        paperEntityDraft.setValue(
          "pubTime",
          item.publicationDate?.slice(0, 4),
          false
        );
        paperEntityDraft.setValue(
          "authors",
          item.creators
            .map((a) =>
              a.creator
                .split(",")
                .map((n) => n.trim())
                .reverse()
                .join(" ")
            )
            .join(", "),
          false
        );
        paperEntityDraft.setValue("number", item.number, false);
        paperEntityDraft.setValue("volume", item.volume, false);
        paperEntityDraft.setValue("publisher", item.publisher, false);

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
