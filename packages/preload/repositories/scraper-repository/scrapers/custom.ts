import { Response } from "got";

import { Preference, ScraperPreference } from "../../../utils/preference";
import { SharedState } from "../../../utils/appstate";
import { Scraper, ScraperRequestType, ScraperType } from "./scraper";
import { formatString } from "../../../utils/string";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";

export class CustomScraper extends Scraper {
  scrapeImplCode = "";
  name = "";

  constructor(sharedState: SharedState, preference: Preference, name: string) {
    super(sharedState, preference);

    this.scrapeImplCode =
      (this.preference.get("scrapers") as Array<ScraperPreference>).find(
        (scraperPref) => scraperPref.name === this.name
      )?.scrapeImplCode || "";

    this.name = name;

    if (this.scrapeImplCode) {
      this.scrapeImpl = eval(this.scrapeImplCode);
    }
  }

  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    let enable = this.getEnable(this.name);
    let scrapeURL = `https://httpbin.org/get`;
    let headers = {};
    const preProcessCode = (
      this.preference.get("scrapers") as Array<ScraperPreference>
    ).find((scraperPref) => scraperPref.name === this.name)?.preProcessCode;

    if (preProcessCode) {
      eval(preProcessCode);
    } else {
      enable = false;
    }

    if (enable) {
      this.sharedState.set(
        "viewState.processInformation",
        `Scraping metadata from ${this.name}...`
      );
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    entityDraft: PaperEntityDraft
  ): PaperEntityDraft {
    const parsingProcessCode = (
      this.preference.get("scrapers") as Array<ScraperPreference>
    ).find((scraperPref) => scraperPref.name === this.name)?.parsingProcessCode;

    if (parsingProcessCode) {
      eval(parsingProcessCode);
    }

    return entityDraft;
  }
}
