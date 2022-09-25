import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType, ScraperType } from "./scraper";

export class CrossRefScraper extends Scraper {
  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    super(stateStore, preference);
  }

  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      this.getEnable("crossref") &&
      paperEntityDraft.title !== "" &&
      this.isPreprint(paperEntityDraft);

    const scrapeURL = encodeURI(
      `https://api.crossref.org/works?query.bibliographic=${formatString({
        str: paperEntityDraft.title,
        whiteSymbol: true,
      })}&rows=5&mailto=hi@paperlib.app`
    );

    const headers = {};
    if (enable) {
      this.stateStore.logState.processLog = `Scraping metadata from crossref.org ...`;
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const parsedResponse = JSON.parse(rawResponse.body) as {
      message: {
        items: [
          {
            title: string[];
            DOI?: string;
            publisher?: string;
            type?: string;
            page?: string;
            author?: { given: string; family: string }[];
            "container-title"?: string[];
            published?: { "date-parts": number[][] };
            issue: string;
            volume: string;
          }
        ];
      };
    };
    for (const item of parsedResponse.message.items) {
      const plainHitTitle = formatString({
        str: item.title[0],
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

      if (plainHitTitle === existTitle) {
        paperEntityDraft.setValue("doi", item.DOI, false);
        paperEntityDraft.setValue("publisher", item.publisher, false);

        if (item.type?.includes("journal")) {
          paperEntityDraft.setValue("type", 0, false);
        } else if (item.type?.includes("book")) {
          paperEntityDraft.setValue("type", 3, false);
        } else if (item.type?.includes("proceedings")) {
          paperEntityDraft.setValue("type", 1, false);
        } else {
          paperEntityDraft.setValue("type", 2, false);
        }

        paperEntityDraft.setValue("pages", item.page, false);
        paperEntityDraft.setValue(
          "publication",
          item["container-title"]?.join(" "),
          false
        );
        paperEntityDraft.setValue(
          "pubTime",
          `${item.published?.["date-parts"]?.[0]?.[0]}`,
          false
        );
        paperEntityDraft.setValue(
          "authors",
          item.author
            ?.map((author) => `${author.given} ${author.family}`)
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

  scrapeImpl = scrapeImpl;
}

async function scrapeImpl(
  this: ScraperType,
  entityDraft: PaperEntity,
  force = false
): Promise<PaperEntity> {
  const { scrapeURL, headers, enable } = this.preProcess(
    entityDraft
  ) as ScraperRequestType;

  if (enable || force) {
    const response = (await window.networkTool.get(
      scrapeURL,
      headers,
      1,
      false,
      10000
    )) as Response<string>;
    return this.parsingProcess(response, entityDraft) as PaperEntity;
  } else {
    return entityDraft;
  }
}
