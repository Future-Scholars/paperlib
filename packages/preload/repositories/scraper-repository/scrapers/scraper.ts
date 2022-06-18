import got, { Response } from "got";

import { PDFFileResponseType } from "./pdf";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";
import { Preference } from "../../../utils/preference";
import { SharedState } from "../../../utils/appstate";

export interface ScraperRequestType {
  scrapeURL: string;
  headers: Record<string, string>;
  enable: boolean;
}

export interface ScraperType {
  preference: Preference;
  scrape(entityDraft: PaperEntityDraft): Promise<PaperEntityDraft>;
  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType | void;
  parsingProcess(
    rawResponse: Response<string> | PDFFileResponseType | string,
    entityDraft: PaperEntityDraft
  ): PaperEntityDraft | void;
  scrapeImpl: (_: PaperEntityDraft) => Promise<PaperEntityDraft>;
}

export class Scraper implements ScraperType {
  sharedState: SharedState;
  preference: Preference;

  constructor(sharedState: SharedState, preference: Preference) {
    this.sharedState = sharedState;
    this.preference = preference;
  }

  scrape(entityDraft: PaperEntityDraft): Promise<PaperEntityDraft> {
    return this.scrapeImpl(entityDraft);
  }

  preProcess(_entityDraft: PaperEntityDraft): ScraperRequestType | void {
    throw new Error("Method not implemented.");
  }

  parsingProcess(
    _rawResponse: Response<string> | PDFFileResponseType | string,
    _entityDraft: PaperEntityDraft
  ): PaperEntityDraft | void {
    throw new Error("Method not implemented.");
  }

  scrapeImpl = scrapeImpl;
}

async function scrapeImpl(
  this: ScraperType,
  entityDraft: PaperEntityDraft
): Promise<PaperEntityDraft> {
  const { scrapeURL, headers, enable } = this.preProcess(
    entityDraft
  ) as ScraperRequestType;

  if (enable) {
    const options = {
      headers: headers,
      retry: 0,
      timeout: 5000,
    };
    const response = await got(scrapeURL, options);
    return this.parsingProcess(response, entityDraft) as PaperEntityDraft;
  } else {
    return entityDraft;
  }
}
