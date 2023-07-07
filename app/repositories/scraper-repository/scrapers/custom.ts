import { Response } from "got";

import { PaperFolder, PaperTag } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import { ScraperPreference } from "@/preference/preference";

import { Scraper, ScraperRequestType } from "./scraper";

export class CustomScraper {
  scraperName: string;

  tagClass: typeof PaperTag;
  folderClass: typeof PaperFolder;

  constructor(scraperName: string) {
    this.scraperName = scraperName;
    this.tagClass = PaperTag;
    this.folderClass = PaperFolder;
  }

  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    let scrapeURL = `https://httpbin.org/get`;
    let headers = {};
    const preProcessCode = (
      window.preference.get("scrapers") as Record<string, ScraperPreference>
    )[this.scraperName]?.preProcessCode;

    if (preProcessCode) {
      eval(preProcessCode);
    }

    return { scrapeURL, headers };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const parsingProcessCode = (
      window.preference.get("scrapers") as Record<string, ScraperPreference>
    )[this.scraperName]?.parsingProcessCode;

    if (parsingProcessCode) {
      eval(parsingProcessCode);
    }

    return paperEntityDraft;
  }

  async scrape(
    paperEntityDraft: PaperEntity,
    force: boolean = false
  ): Promise<PaperEntity> {
    let scrapeImplCode =
      (window.preference.get("scrapers") as Record<string, ScraperPreference>)[
        this.scraperName
      ]?.scrapeImplCode || "";

    scrapeImplCode = scrapeImplCode.replaceAll("return", "paperEntityDraft = ");

    if (scrapeImplCode) {
      eval(scrapeImplCode);
    } else {
      const { scrapeURL, headers } = this.preProcess(
        paperEntityDraft
      ) as ScraperRequestType;

      const response = (await networkTool.get(
        scrapeURL,
        headers
      )) as Response<string>;
      return this.parsingProcess(response, paperEntityDraft);
    }

    return paperEntityDraft;
  }
}
