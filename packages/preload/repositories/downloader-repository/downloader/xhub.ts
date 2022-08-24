import { parse } from "node-html-parser";
import path from "path";

import {
  Downloader,
  DownloaderRequestType,
  DownloaderType,
} from "./downloader";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";
import { DownloaderPreference } from "../../../utils/preference";
import { ipcRenderer } from "electron";

export class XHubDownloader extends Downloader {
  preProcess(entityDraft: PaperEntityDraft): DownloaderRequestType {
    const siteUrl =
      (this.preference.get("downloaders") as Array<DownloaderPreference>).find(
        (downloaderPref) => downloaderPref.name === "x-hub"
      )?.args || "";
    const enable =
      (entityDraft.doi || entityDraft.title) !== "" &&
      siteUrl !== "" &&
      this.getEnable("x-hub");

    let queryUrl = "";

    let headers = {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
      method: "GET",
      requestIdentifier: "",
    };

    if (entityDraft.doi) {
      queryUrl = path.join(siteUrl, entityDraft.doi);
      headers.method = "GET";
    } else if (entityDraft.title) {
      queryUrl = siteUrl;
      headers.method = "POST";
      headers.requestIdentifier = entityDraft.title;
    }

    if (enable) {
      this.sharedState.set(
        "viewState.processInformation",
        `Downloading PDF from X-hub ...`
      );
    }

    return { queryUrl, headers, enable };
  }

  async queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    entityDraft: PaperEntityDraft | null
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
  entityDraft: PaperEntityDraft
): Promise<PaperEntityDraft | null> {
  const { queryUrl, headers, enable } = this.preProcess(
    entityDraft
  ) as DownloaderRequestType;

  if (enable) {
    const downloadUrl = await this.queryProcess(queryUrl, headers, null);
    if (downloadUrl) {
      const downloadedUrl = await ipcRenderer.invoke(
        "sidework-window-xhub-request",
        downloadUrl
      );
      if (downloadedUrl) {
        entityDraft.mainURL = downloadedUrl;
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
