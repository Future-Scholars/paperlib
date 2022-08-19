import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

import { PaperEntityDraft } from "../../../models/PaperEntityDraft";
import { Preference, DownloaderPreference } from "../../../utils/preference";
import { SharedState } from "../../../utils/appstate";
import { downloadPDFs } from "../../../utils/got";

export interface DownloaderRequestType {
  queryUrl: string;
  headers: Record<string, string>;
  enable: boolean;
}

export interface DownloaderType {
  sharedState: SharedState;
  preference: Preference;
  download(entityDraft: PaperEntityDraft): Promise<PaperEntityDraft | null>;
  preProcess(entityDraft: PaperEntityDraft): DownloaderRequestType | void;
  queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    entityDraft: PaperEntityDraft | null
  ): Promise<string>;
  downloadImpl: (_: PaperEntityDraft) => Promise<PaperEntityDraft | null>;
  getProxyAgent(): Record<string, HttpProxyAgent | HttpsProxyAgent | void>;
  getEnable(name: string): boolean;
}

export class Downloader implements DownloaderType {
  sharedState: SharedState;
  preference: Preference;

  constructor(sharedState: SharedState, preference: Preference) {
    this.sharedState = sharedState;
    this.preference = preference;
  }

  download(entityDraft: PaperEntityDraft): Promise<PaperEntityDraft | null> {
    return this.downloadImpl(entityDraft);
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

  preProcess(_entityDraft: PaperEntityDraft): DownloaderRequestType | void {
    throw new Error("Method not implemented.");
  }

  queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    entityDraft: PaperEntityDraft | null
  ): Promise<string> {
    throw new Error("Method not implemented.");
  }

  downloadImpl = downloadImpl;

  getEnable(name: string) {
    return (
      (this.preference.get("downloaders") as Array<DownloaderPreference>).find(
        (downloaderPref) => downloaderPref.name === name
      )?.enable ?? false
    );
  }
}

async function downloadImpl(
  this: DownloaderType,
  entityDraft: PaperEntityDraft
): Promise<PaperEntityDraft | null> {
  const { queryUrl, headers, enable } = this.preProcess(
    entityDraft
  ) as DownloaderRequestType;

  if (enable) {
    const agent = this.getProxyAgent();
    const downloadUrl = await this.queryProcess(queryUrl, headers, entityDraft);
    if (downloadUrl) {
      this.sharedState.set("viewState.processInformation", "Downloading...");
      const downloadedUrl = await downloadPDFs([downloadUrl], agent);

      if (downloadedUrl.length > 0) {
        entityDraft.mainURL = downloadedUrl[0];
        return entityDraft;
      } else {
        return null;
      }
    } else {
      return null;
    }
  } else {
    return null;
  }
}
