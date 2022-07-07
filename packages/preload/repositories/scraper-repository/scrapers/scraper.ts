import got, { Response } from "got";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

import { PDFFileResponseType } from "./pdf";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";
import { Preference, ScraperPreference } from "../../../utils/preference";
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
  getProxyAgent(): Record<string, HttpProxyAgent | HttpsProxyAgent | void>;
  getEnable(name: string): boolean;
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
  entityDraft: PaperEntityDraft
): Promise<PaperEntityDraft> {
  const { scrapeURL, headers, enable } = this.preProcess(
    entityDraft
  ) as ScraperRequestType;

  if (enable) {
    const agent = this.getProxyAgent();
    let options = {
      headers: headers,
      retry: 0,
      timeout: 5000,
      agent: agent,
    };
    const response = await got(scrapeURL, options);
    return this.parsingProcess(response, entityDraft) as PaperEntityDraft;
  } else {
    return entityDraft;
  }
}
