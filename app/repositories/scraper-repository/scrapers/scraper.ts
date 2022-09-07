import got, { Response } from "got";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

import { PDFFileResponseType } from "./pdf";
import { PaperEntity } from "@/models/paper-entity";
import { Preference, ScraperPreference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

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
  getProxyAgent(): Record<string, HttpProxyAgent | HttpsProxyAgent | void>;
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

  getProxyAgent() {
    const httpproxyUrl = this.preference.get("httpproxy") as string;
    const httpsproxyUrl = this.preference.get("httpsproxy") as string;

    let agnets = {};
    if (httpproxyUrl || httpsproxyUrl) {
      let validHttpproxyUrl, validHttpsproxyUrl;
      if (httpproxyUrl) {
        validHttpproxyUrl = httpproxyUrl;
      } else {
        validHttpproxyUrl = httpsproxyUrl;
      }
      if (httpsproxyUrl) {
        validHttpsproxyUrl = httpsproxyUrl;
      } else {
        validHttpsproxyUrl = httpproxyUrl;
      }
      // @ts-ignore
      agnets["http"] = new HttpProxyAgent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 256,
        maxFreeSockets: 256,
        scheduling: "lifo",
        proxy: validHttpproxyUrl,
      });

      // @ts-ignore
      agnets["https"] = new HttpsProxyAgent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 256,
        maxFreeSockets: 256,
        scheduling: "lifo",
        proxy: validHttpsproxyUrl,
      });
    }

    return agnets;
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
      (this.preference.get("scrapers") as Array<ScraperPreference>).find(
        (scraperPref) => scraperPref.name === name
      )?.enable ?? false
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
    const agent = this.getProxyAgent();
    let options = {
      headers: headers,
      retry: 1,
      timeout: 10000,
      agent: agent,
    };
    const response = await got(scrapeURL, options);
    return this.parsingProcess(response, entityDraft) as PaperEntity;
  } else {
    return entityDraft;
  }
}
