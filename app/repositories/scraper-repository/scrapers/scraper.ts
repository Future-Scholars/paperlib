import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { isMetadataCompleted } from "@/utils/metadata";

export interface ScraperRequestType {
  scrapeURL: string;
  headers: Record<string, string>;
  content?: Record<string, any>;
}

export abstract class Scraper {
  // All use static methods seems to be a better design for cross scrapers calls.

  static async scrape(
    paperEntityDraft: PaperEntity,
    force = false
  ): Promise<PaperEntity> {
    if (!this.checkEnable(paperEntityDraft) && !force) {
      return paperEntityDraft;
    }

    const { scrapeURL, headers } = this.preProcess(paperEntityDraft);

    const response = (await window.networkTool.get(
      scrapeURL,
      headers,
      1,
      false,
      10000
    )) as Response<string>;
    return this.parsingProcess(response, paperEntityDraft);
  }

  static preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    return { scrapeURL: "", headers: {} };
  }

  static parsingProcess(
    rawResponse: any,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    return paperEntityDraft;
  }

  // Check if the  paperEntityDraft contains enough information to scrape. (NOT enable or not by user preference)
  static checkEnable(paperEntityDraft: PaperEntity): boolean {
    return !isMetadataCompleted(paperEntityDraft);
  }
}
