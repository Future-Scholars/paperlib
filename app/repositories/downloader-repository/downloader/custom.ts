import { PaperEntity } from "@/models/paper-entity";
import { DownloaderPreference, Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import { downloadPDFs } from "../../../utils/got";
import {
  Downloader,
  DownloaderRequestType,
  DownloaderType,
} from "./downloader";

export class CustomDownloader extends Downloader {
  name = "";

  constructor(
    stateStore: MainRendererStateStore,
    preference: Preference,
    name: string
  ) {
    super(stateStore, preference);

    this.name = name;
  }

  preProcess(paperEntityDraft: PaperEntity): DownloaderRequestType {
    let enable = this.getEnable(this.name);
    let queryUrl = "";
    let headers = {};

    const preProcessCode = (
      this.preference.get("downloaders") as Array<DownloaderPreference>
    ).find(
      (downloaderPref) => downloaderPref.name === this.name
    )?.preProcessCode;

    if (preProcessCode) {
      eval(preProcessCode);
    } else {
      enable = false;
    }

    if (enable) {
      this.stateStore.logState.processLog = `Download PDF from ${this.name}...`;
    }

    return { queryUrl, headers, enable };
  }

  async queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    paperEntityDraft: PaperEntity | null
  ): Promise<string> {
    let downloadUrl = "";
    const queryProcessCode = (
      this.preference.get("downloaders") as Array<DownloaderPreference>
    ).find(
      (downloaderPref) => downloaderPref.name === this.name
    )?.queryProcessCode;

    if (queryProcessCode) {
      eval(queryProcessCode);
      eval("downloadUrl = queryUrl;");
    }
    return downloadUrl;
  }

  downloadImpl = downloadImpl;
}

async function downloadImpl(
  this: DownloaderType,
  paperEntityDraft: PaperEntity
): Promise<PaperEntity | null> {
  let paperEntityDraftWithDownloaded = null;

  const downloadImplCode =
    (this.preference.get("downloaders") as Array<DownloaderPreference>).find(
      // @ts-ignore
      (downloaderPref) => downloaderPref.name === this.name
    )?.downloadImplCode || "";

  if (downloadImplCode) {
    // @ts-ignore
    eval(downloadImplCode);
  } else {
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
        this.stateStore.logState.processLog = `Downloading...`;
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

  return paperEntityDraftWithDownloaded;
}
