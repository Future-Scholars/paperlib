import { Response } from "got";
import stringSimilarity from "string-similarity";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";
import { cryptoAndSign } from "@/utils/crypto/crypto";

export class AdsabsScraper extends Scraper {

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    super(stateStore, preference);
  }

  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      this.getEnable("adsabs") &&
      paperEntityDraft.title !== "" &&
      this.isPreprint(paperEntityDraft);

    const scrapeURL = `https://api.paperlib.app/publicdb/query`;
    const headers = {};
    if (enable) {
      this.stateStore.logState.processLog = `Scraping metadata from NASA Ads...`;
    }

    const content = {
      query: `title:${formatString({
        str: paperEntityDraft.title,
        removeNewline: true,
      }).toLowerCase()}`,
      database: "adsabs",
    };

    return { scrapeURL, headers, enable, content };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const parsedResponse = JSON.parse(rawResponse.body) as {
      "response": {
        "docs": [
          {
            "author": string[],
            "doi"?: string[],
            "issue": string,
            "page": string[],
            "pub": string,
            "pubdate": string,
            "title": string[],
            "year": string,
            "doctype": string,
            'volume': string,
          }
        ]
      }
    };

    for (const item of parsedResponse.response.docs) {
      const plainHitTitle = formatString({
        str: item.title.join(" - "),
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
        paperEntityDraft.setValue("title", item.title.join(' ') || "", false);
        if (item.doi) {
          paperEntityDraft.setValue("doi", item.doi[0] || "", false);
        }

        if (item.doctype.includes("journal")) {
          paperEntityDraft.setValue("type", 0, false);
        } else if (item.doctype.includes("book")) {
          paperEntityDraft.setValue("type", 3, false);
        } else if (item.doctype.includes('proceeding')) {
          paperEntityDraft.setValue("type", 1, false);
        } else {
          paperEntityDraft.setValue("type", 2, false);
        }

        paperEntityDraft.setValue("pages", item.page.join('-'), false);
        paperEntityDraft.setValue(
          "publication",
          item.pub,
          false
        );
        paperEntityDraft.setValue(
          "pubTime",
          `${item.year.slice(0, 4)}`,
          false
        );
        paperEntityDraft.setValue(
          "authors",
          item.author.join(', '),
          false
        );
        paperEntityDraft.setValue(
          "number",
          item.issue,
          false
        );
        paperEntityDraft.setValue("volume", item.volume, false);

        this.uploadCache(paperEntityDraft, "adsabs");

        break;
      }
    }

    return paperEntityDraft;
  }

  // @ts-ignore
  scrapeImpl = scrapeImpl;
}

async function scrapeImpl(
  this: AdsabsScraper,
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

    return paperEntityDraft;
  } else {
    return paperEntityDraft;
  }
}