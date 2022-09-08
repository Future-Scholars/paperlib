import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";

export class CrossRefScraper extends Scraper {
  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    super(stateStore, preference);
  }

  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      this.getEnable("crossref") &&
      paperEntityDraft.title !== "" &&
      paperEntityDraft.doi === "";

    const scrapeURL = `https://api.crossref.org/works?query.title=${paperEntityDraft.title}`;

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
            DOI: string;
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

      if (
        plainHitTitle === existTitle &&
        item.DOI &&
        paperEntityDraft.doi === ""
      ) {
        paperEntityDraft.doi = item.DOI;
        break;
      }
    }

    return paperEntityDraft;
  }
}
