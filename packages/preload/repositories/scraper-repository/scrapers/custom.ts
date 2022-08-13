import got, { Response } from "got";

import { Preference, ScraperPreference } from "../../../utils/preference";
import { SharedState } from "../../../utils/appstate";
import { Scraper, ScraperRequestType } from "./scraper";
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
  // @ts-ignore
  scrapeImpl = scrapeImpl;
}

async function scrapeImpl(this: CustomScraper, entityDraft: PaperEntityDraft) {
  const { scrapeURL, headers, enable } = this.preProcess(
    entityDraft
  ) as ScraperRequestType;

  if (this.scrapeImplCode) {
    eval(this.scrapeImplCode);
  } else {
    if (enable) {
      const agent = this.getProxyAgent();
      let options = {
        headers: headers,
        retry: 1,
        timeout: 10000,
        agent: agent,
      };
      const response = await got(scrapeURL, options);
      return this.parsingProcess(response, entityDraft) as PaperEntityDraft;
    } else {
      return entityDraft;
    }
  }
}
