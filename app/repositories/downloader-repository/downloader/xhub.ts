import { ipcRenderer } from "electron";
import { parse } from "node-html-parser";
import path from "path";

import { PaperEntity } from "@/models/paper-entity";
import { DownloaderPreference } from "@/preference/preference";

import {
  Downloader,
  DownloaderRequestType,
  DownloaderType,
} from "./downloader";

export class XHubDownloader extends Downloader {
  preProcess(paperEntityDraft: PaperEntity): DownloaderRequestType {
    const siteUrl =
      (this.preference.get("downloaders") as Array<DownloaderPreference>).find(
        (downloaderPref) => downloaderPref.name === "x-hub"
      )?.args || "";
    const enable =
      (paperEntityDraft.doi || paperEntityDraft.title) !== "" &&
      siteUrl !== "" &&
      this.getEnable("x-hub");

    let queryUrl = "";

    let headers = {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
      method: "GET",
      requestIdentifier: "",
    };

    if (paperEntityDraft.doi) {
      queryUrl = path.join(siteUrl, paperEntityDraft.doi);
      headers.method = "GET";
    } else if (paperEntityDraft.title) {
      queryUrl = siteUrl;
      headers.method = "POST";
      headers.requestIdentifier = paperEntityDraft.title;
    }

    if (enable) {
      this.stateStore.logState.processLog = `Downloading PDF from X-hub ...`;
    }

    return { queryUrl, headers, enable };
  }

  async queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    paperEntityDraft: PaperEntity | null
  ): Promise<string> {
    const siteUrl =
      (this.preference.get("downloaders") as Array<DownloaderPreference>).find(
        (downloaderPref) => downloaderPref.name === "x-hub"
      )?.args ?? "";

    let downloadUrl = "";

    if (headers.method === "POST") {
      queryUrl = await ipcRenderer.invoke(
        "sidework-window-xhub-request-by-title",
        queryUrl,
        headers
      );
    }

    const body = await ipcRenderer.invoke(
      "sidework-window-xhub-request",
      queryUrl
    );
    const root = parse(body);
    const buttonNodes = root.querySelectorAll("button");
    const button = buttonNodes.find((node) => {
      return node.attributes.onclick.includes("download");
    });
    if (button) {
      downloadUrl = button.attributes.onclick
        .replace("location.href='", "")
        .slice(0, -1);
      if (downloadUrl.startsWith("//")) {
        downloadUrl = "https:" + downloadUrl;
      } else {
        downloadUrl = path.join(siteUrl, downloadUrl);
      }
    } else {
      downloadUrl = "";
    }
    return downloadUrl;
  }

  downloadImpl = downloadImpl;
}

async function downloadImpl(
  this: DownloaderType,
  paperEntityDraft: PaperEntity
): Promise<PaperEntity | null> {
  const { queryUrl, headers, enable } = this.preProcess(
    paperEntityDraft
  ) as DownloaderRequestType;

  if (enable) {
    const downloadUrl = await this.queryProcess(queryUrl, headers, null);
    if (downloadUrl) {
      const downloadedUrl = await ipcRenderer.invoke(
        "sidework-window-xhub-request",
        downloadUrl
      );
      if (downloadedUrl) {
        paperEntityDraft.mainURL = downloadedUrl;
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
