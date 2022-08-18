import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

import { PaperEntityDraft } from "../../../models/PaperEntityDraft";
import { SharedState } from "../../../utils/appstate";
import { Preference } from "../../../utils/preference";

export interface WebContentType {
  url: string;
  document: string;
  cookies: string;
}

export interface WebImporterType {
  preference: Preference;

  parse(webContent: WebContentType): Promise<PaperEntityDraft | boolean>;

  preProcess(webContent: WebContentType): boolean;
  parsingProcess(
    webContent: WebContentType
  ): Promise<PaperEntityDraft | boolean>;

  getProxyAgent(): Record<string, any>;
}

export class WebImporter implements WebImporterType {
  sharedState: SharedState;
  preference: Preference;
  urlRegExp: RegExp;

  constructor(
    sharedState: SharedState,
    preference: Preference,
    urlRegExp: RegExp
  ) {
    this.sharedState = sharedState;
    this.preference = preference;
    this.urlRegExp = urlRegExp;
  }

  async parse(webContent: WebContentType): Promise<PaperEntityDraft | boolean> {
    const enable = this.preProcess(webContent);

    if (enable) {
      return await this.parsingProcess(webContent);
    } else {
      return false;
    }
  }

  preProcess(webContent: WebContentType): boolean {
    return this.urlRegExp.test(webContent.url);
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

  // eslint-disable-next-line @typescript-eslint/require-await
  async parsingProcess(
    webContent: WebContentType
  ): Promise<PaperEntityDraft | boolean> {
    throw new Error("Method not implemented.");
  }
}
