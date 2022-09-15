import { PaperEntity } from "@/models/paper-entity";
import { DownloaderPreference, Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

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
    const downloadUrl = await this.queryProcess(
      queryUrl,
      headers,
      paperEntityDraft
    );
    if (downloadUrl) {
      const downloadedUrl = await window.networkTool.downloadPDFs([
        downloadUrl,
      ]);

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
