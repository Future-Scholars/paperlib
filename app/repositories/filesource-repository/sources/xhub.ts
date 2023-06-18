import { ipcRenderer } from "electron";
import parse from "node-html-parser";
import path from "path";

import { PaperEntity } from "@/models/paper-entity";
import { DownloaderPreference } from "@/preference/preference";

import { FileSource, FileSourceRequestType } from "./source";

export class XHubFileSource extends FileSource {
  static checkEnable(paperEntityDraft: PaperEntity) {
    const siteUrl =
      (
        preferenceService.get("downloaders") as Array<DownloaderPreference>
      ).find((downloaderPref) => downloaderPref.name === "x-hub")?.args || "";

    return (
      (paperEntityDraft.doi || paperEntityDraft.title) !== "" && siteUrl !== ""
    );
  }

  static preProcess(paperEntityDraft: PaperEntity): FileSourceRequestType {
    const siteUrl =
      (
        preferenceService.get("downloaders") as Array<DownloaderPreference>
      ).find((downloaderPref) => downloaderPref.name === "x-hub")?.args || "";

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

    return { queryUrl, headers };
  }

  static async queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    paperEntityDraft: PaperEntity | null
  ): Promise<string> {
    const siteUrl =
      (
        preferenceService.get("downloaders") as Array<DownloaderPreference>
      ).find((downloaderPref) => downloaderPref.name === "x-hub")?.args ?? "";

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

  static async download(
    paperEntityDraft: PaperEntity
  ): Promise<PaperEntity | null> {
    if (!this.checkEnable(paperEntityDraft)) {
      return null;
    }

    const { queryUrl, headers } = this.preProcess(
      paperEntityDraft
    ) as FileSourceRequestType;

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
  }
}
