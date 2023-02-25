import { Response } from "got";
import stringSimilarity from "string-similarity";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";
import { cryptoAndSign } from "@/utils/crypto/crypto";

export class SpringerScraper extends Scraper {
  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    super(stateStore, preference);
  }

  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      this.getEnable("springer") &&
      paperEntityDraft.title !== "" &&
      this.isPreprint(paperEntityDraft);

    const scrapeURL = `https://api.paperlib.app/publicdb/query`;
    const headers = {};
    if (enable) {
      this.stateStore.logState.processLog = `Scraping metadata from Springer...`;
    }

    const content = {
      query: `title:${formatString({
        str: paperEntityDraft.title,
        removeNewline: true,
      }).toLowerCase()}`,
      database: "springer",
    };

    return { scrapeURL, headers, enable, content };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const parsedResponse = JSON.parse(rawResponse.body) as {
      "records": [
        {
          "title": string,
          "creators": [
            {
              "creator": string
            }
          ],
          "publicationName": string,
          "doi": string,
          "publisher"?: string,
          "publicationDate": string,
          "contentType": string,
          "volume"?: string,
          "number"?: string,
          "startingPage"?: string,
          "endingPage"?: string,
        }
      ]
    };

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
        paperEntityDraft.setValue("title", item.title.replaceAll('&amp;', '&'), false, true);
        paperEntityDraft.setValue("doi", item.doi, false);

        if (item.contentType.toLowerCase().includes("journal")) {
          paperEntityDraft.setValue("type", 0, false);
        } else if (item.contentType.toLowerCase().includes("book")) {
          paperEntityDraft.setValue("type", 3, false);
        } else if (item.contentType.toLowerCase().includes('conference')) {
          paperEntityDraft.setValue("type", 1, false);
        } else {
          paperEntityDraft.setValue("type", 2, false);
        }

        if (item.startingPage && item.endingPage) {
          paperEntityDraft.setValue("pages", `${item.startingPage}-${item.endingPage}`, false);
        }
        paperEntityDraft.setValue(
          "publication",
          item.publicationName,
          false
        );
        paperEntityDraft.setValue(
          "pubTime",
          item.publicationDate?.slice(0, 4),
          false
        );
        paperEntityDraft.setValue(
          "authors",
          item.creators.map(a => a.creator.split(',').map(n => n.trim()).reverse().join(' ')).join(', '),
          false
        );
        paperEntityDraft.setValue(
          "number",
          item.number,
          false
        );
        paperEntityDraft.setValue("volume", item.volume, false);
        paperEntityDraft.setValue("publisher", item.publisher, false);


        this.uploadCache(paperEntityDraft, "springer");

        break;
      }
    }

    return paperEntityDraft;
  }

  // @ts-ignore
  scrapeImpl = scrapeImpl;
}

async function scrapeImpl(
  this: SpringerScraper,
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