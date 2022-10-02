import { Response } from "got";

import { APICache } from "@/models/apicache";
import { PaperEntity } from "@/models/paper-entity";
import { Preference, ScraperPreference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { cryptoAndSign } from "@/utils/crypto/crypto";

import { PDFFileResponseType } from "./pdf";

export interface ScraperRequestType {
  scrapeURL: string;
  headers: Record<string, string>;
  enable: boolean;
  content?: Record<string, any>;
}

export interface ScraperType {
  stateStore: MainRendererStateStore;
  preference: Preference;

  scrape(paperEntityDraft: PaperEntity, force?: boolean): Promise<PaperEntity>;
  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType | void;
  parsingProcess(
    rawResponse: Response<string> | PDFFileResponseType | string,
    paperEntityDraft: PaperEntity
  ): PaperEntity | void;
  scrapeImpl: (_: PaperEntity, force?: boolean) => Promise<PaperEntity>;
  getEnable(name: string): boolean;
  uploadCache(paperEntity: PaperEntity, scraperName: string): Promise<void>;
}

export class Scraper implements ScraperType {
  stateStore: MainRendererStateStore;
  preference: Preference;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;
  }

  scrape(paperEntityDraft: PaperEntity, force = false): Promise<PaperEntity> {
    return this.scrapeImpl(paperEntityDraft, force);
  }

  preProcess(_paperEntityDraft: PaperEntity): ScraperRequestType | void {
    throw new Error("Method not implemented.");
  }

  parsingProcess(
    _rawResponse: Response<string> | PDFFileResponseType | string,
    _paperEntityDraft: PaperEntity
  ): PaperEntity | void {
    throw new Error("Method not implemented.");
  }

  scrapeImpl = scrapeImpl;

  getEnable(name: string) {
    return (
      (this.preference.get("scrapers") as Record<string, ScraperPreference>)[
        name
      ]?.enable ?? false
    );
  }

  isPreprint(paperEntityDraft: PaperEntity) {
    return (
      !paperEntityDraft.publication ||
      paperEntityDraft.publication.toLowerCase().includes("rxiv") ||
      paperEntityDraft.publication.toLowerCase().includes("openreview")
    );
  }

  async uploadCache(
    paperEntityDraft: PaperEntity,
    scraperName: string
  ): Promise<void> {
    if (!this.isPreprint(paperEntityDraft)) {
      try {
        const apiCache = new APICache(true).initialize(
          paperEntityDraft,
          scraperName
        );
        const signedData = cryptoAndSign(apiCache);

        await window.networkTool.post(
          "https://api.paperlib.app/cache/",
          signedData
        );
      } catch (e) {
        console.log(e);
      }
    }
  }
}

async function scrapeImpl(
  this: ScraperType,
  paperEntityDraft: PaperEntity,
  force = false
): Promise<PaperEntity> {
  const { scrapeURL, headers, enable } = this.preProcess(
    paperEntityDraft
  ) as ScraperRequestType;

  if (enable || force) {
    const response = (await window.networkTool.get(
      scrapeURL,
      headers,
      1,
      false,
      10000
    )) as Response<string>;
    return this.parsingProcess(response, paperEntityDraft) as PaperEntity;
  } else {
    return paperEntityDraft;
  }
}
