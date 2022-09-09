import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

import { PaperEntity } from "@/models/paper-entity";
import { DownloaderPreference, Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { downloadPDFs } from "@/utils/got";

export interface DownloaderRequestType {
  queryUrl: string;
  headers: Record<string, string>;
  enable: boolean;
}

export interface DownloaderType {
  stateStore: MainRendererStateStore;
  preference: Preference;
  download(paperEntityDraft: PaperEntity): Promise<PaperEntity | null>;
  preProcess(paperEntityDraft: PaperEntity): DownloaderRequestType | void;
  queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    paperEntityDraft: PaperEntity | null
  ): Promise<string>;
  downloadImpl: (_: PaperEntity) => Promise<PaperEntity | null>;
  getProxyAgent(): Record<string, HttpProxyAgent | HttpsProxyAgent | void>;
  getEnable(name: string): boolean;
}

export class Downloader implements DownloaderType {
  stateStore: MainRendererStateStore;
  preference: Preference;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;
  }

  download(paperEntityDraft: PaperEntity): Promise<PaperEntity | null> {
    return this.downloadImpl(paperEntityDraft);
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

  preProcess(_paperEntityDraft: PaperEntity): DownloaderRequestType | void {
    throw new Error("Method not implemented.");
  }

  queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    paperEntityDraft: PaperEntity | null
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
  paperEntityDraft: PaperEntity
): Promise<PaperEntity | null> {
  const { queryUrl, headers, enable } = this.preProcess(
    paperEntityDraft
  ) as DownloaderRequestType;

  if (enable) {
    const agent = this.getProxyAgent();
    const downloadUrl = await this.queryProcess(
      queryUrl,
      headers,
      paperEntityDraft
    );
    if (downloadUrl) {
      this.stateStore.logState.processLog = "Downloading...";
      const downloadedUrl = await downloadPDFs([downloadUrl], agent);

      if (downloadedUrl.length > 0) {
        paperEntityDraft.mainURL = downloadedUrl[0];
        return paperEntityDraft;
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
