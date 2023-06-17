import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";

import { Scraper, ScraperRequestType } from "./scraper";

export class AdsabsScraper extends Scraper {
  static checkEnable(paperEntityDraft: PaperEntity): boolean {
    // Deprecated scraper, always return false.
    return false;
  }

  static preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    return { scrapeURL: "", headers: {} };
  }

  static parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    return paperEntityDraft;
  }

  static async scrape(
    paperEntityDraft: PaperEntity,
    force = false
  ): Promise<PaperEntity> {
    return paperEntityDraft;
  }
}
