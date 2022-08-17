import path from "path";
import os from "os";
import stream from "stream";
import { promisify } from "util";
import got from "got";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";
import { createWriteStream } from "fs";

import { PaperEntityDraft } from "../../../models/PaperEntityDraft";
import { Preference, DownloaderPreference } from "../../../utils/preference";
import { SharedState } from "../../../utils/appstate";
import { constructFileURL } from "../../../utils/path";

export interface DownloaderRequestType {
  downloadURL: string;
  headers: Record<string, string>;
  enable: boolean;
}

export interface DownloaderType {
  preference: Preference;
  download(entityDraft: PaperEntityDraft): Promise<PaperEntityDraft>;
  preProcess(entityDraft: PaperEntityDraft): DownloaderRequestType | void;
  downloadProcess(urlList: string[]): Promise<string[]>;
  downloadImpl: (_: PaperEntityDraft) => Promise<PaperEntityDraft>;
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

  download(entityDraft: PaperEntityDraft): Promise<PaperEntityDraft> {
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

  async downloadProcess(urlList: string[]): Promise<string[]> {
    const _download = async (url: string): Promise<string> => {
      try {
        let filename = url.split("/").pop() as string;
        filename = filename.slice(0, 100);
        if (!filename.endsWith(".pdf")) {
          filename += ".pdf";
        }
        const targetUrl = path.join(os.homedir(), "Downloads", filename);
        const pipeline = promisify(stream.pipeline);
        const headers = {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
        };
        await pipeline(
          got.stream(url, { headers: headers, rejectUnauthorized: false }),
          createWriteStream(constructFileURL(targetUrl, false, false))
        );
        return targetUrl;
      } catch (e) {
        console.log(e);
        return "";
      }
    };

    this.sharedState.set("viewState.processInformation", `Downloading...`);

    const downloadedUrls = (await Promise.all(urlList.map(_download))).filter(
      (url) => url !== ""
    );

    return downloadedUrls;
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
): Promise<PaperEntityDraft> {
  const { downloadURL, headers, enable } = this.preProcess(
    entityDraft
  ) as DownloaderRequestType;

  if (enable) {
    const agent = this.getProxyAgent();
    let options = {
      headers: headers,
      retry: 1,
      timeout: 10000,
      agent: agent,
    };
    const downloadedUrl = await this.downloadProcess([downloadURL]);

    if (downloadedUrl.length > 0) {
      entityDraft.mainURL = downloadedUrl[0];
    }

    return entityDraft;
  } else {
    return entityDraft;
  }
}
