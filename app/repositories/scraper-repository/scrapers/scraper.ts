import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { Preference, ScraperPreference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import { PDFFileResponseType } from "./pdf";

export interface ScraperRequestType {
  scrapeURL: string;
  headers: Record<string, string>;
  enable: boolean;
}

export interface ScraperType {
  stateStore: MainRendererStateStore;
  preference: Preference;

  scrape(entityDraft: PaperEntity, force?: boolean): Promise<PaperEntity>;
  preProcess(entityDraft: PaperEntity): ScraperRequestType | void;
  parsingProcess(
    rawResponse: Response<string> | PDFFileResponseType | string,
    entityDraft: PaperEntity
  ): PaperEntity | void;
  scrapeImpl: (_: PaperEntity, force?: boolean) => Promise<PaperEntity>;
  getEnable(name: string): boolean;
}

export class Scraper implements ScraperType {
  stateStore: MainRendererStateStore;
  preference: Preference;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;
  }

  scrape(entityDraft: PaperEntity, force = false): Promise<PaperEntity> {
    return this.scrapeImpl(entityDraft, force);
  }

  preProcess(_entityDraft: PaperEntity): ScraperRequestType | void {
    throw new Error("Method not implemented.");
  }

  parsingProcess(
    _rawResponse: Response<string> | PDFFileResponseType | string,
    _entityDraft: PaperEntity
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
}

async function scrapeImpl(
  this: ScraperType,
  entityDraft: PaperEntity,
  force = false
): Promise<PaperEntity> {
  const { scrapeURL, headers, enable } = this.preProcess(
    entityDraft
  ) as ScraperRequestType;

  if (enable || force) {
    const response = (await window.networkTool.get(
      scrapeURL,
      headers
    )) as Response<string>;
    return this.parsingProcess(response, entityDraft) as PaperEntity;
  } else {
    return entityDraft;
  }
}
