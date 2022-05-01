import { Response } from "got";

import { Scraper, ScraperRequestType } from "./scraper";
import { formatString } from "../../../utils/string";
import { Preference } from "../../../utils/preference";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";

export class PwCScraper extends Scraper {
  constructor(preference: Preference) {
    super(preference);
  }

  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    const enable =
      entityDraft.title !== "" &&
      (this.preference.get("pwcScraper") as boolean);

    const connectedTitle = formatString({
      str: entityDraft.title,
      removeStr: "&amp",
      lowercased: true,
      trimWhite: true,
    })
      .replace(/ /g, "-")
      .replace(/\./g, "");
    const scrapeURL = `https://paperswithcode.com/api/v1/search/?q=${connectedTitle}`;

    const headers = {
      Accept: "application/json",
    };
    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    entityDraft: PaperEntityDraft
  ): PaperEntityDraft {
    const response = JSON.parse(rawResponse.body) as {
      count?: number;
      results: {
        paper: {
          title: string;
        };
        repository: {
          url: string;
        };
        is_official: boolean;
      }[];
    };
    const targetTitle = formatString({
      str: entityDraft.title,
      removeStr: "&amp",
      removeSymbol: true,
      lowercased: true,
    });

    if (response.count) {
      const codeList: string[] = [];
      for (const result of response.results) {
        const hitTitle = formatString({
          str: result.paper.title,
          removeStr: "&amp",
          removeSymbol: true,
          lowercased: true,
        });

        if (hitTitle === targetTitle && result.repository) {
          codeList.push(
            JSON.stringify({
              url: result.repository.url,
              isOfficial: result.is_official,
            })
          );
        }
      }
      entityDraft.setValue("codes", codeList);
    }
    return entityDraft;
  }
}
