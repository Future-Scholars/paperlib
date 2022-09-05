import { Response } from "got";

import { Scraper, ScraperRequestType } from "./scraper";
import { formatString } from "../../../utils/string";
import { Preference } from "../../../utils/preference";
import { SharedState } from "../../../utils/appstate";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";

export class CrossRefScraper extends Scraper {
  constructor(sharedState: SharedState, preference: Preference) {
    super(sharedState, preference);
  }

  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    const enable =
      this.getEnable("crossref") &&
      entityDraft.title !== "" &&
      entityDraft.doi === "";

    const scrapeURL = `https://api.crossref.org/works?query.title=${entityDraft.title}`;

    const headers = {};
    if (enable) {
      this.sharedState.set(
        "viewState.processInformation",
        `Scraping metadata from crossref.org ...`
      );
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    entityDraft: PaperEntityDraft
  ): PaperEntityDraft {
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
    console.log(parsedResponse);
    for (const item of parsedResponse.message.items) {
      const plainHitTitle = formatString({
        str: item.title[0],
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

      if (plainHitTitle === existTitle && item.DOI && entityDraft.doi === "") {
        entityDraft.doi = item.DOI;
        break;
      }
    }

    return entityDraft;
  }
}
