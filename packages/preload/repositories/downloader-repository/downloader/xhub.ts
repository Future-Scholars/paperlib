import got from "got";
import { parse } from "node-html-parser";

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
      )?.args ?? "";
    const enable =
      entityDraft.doi !== "" && siteUrl !== "" && this.getEnable("x-hub");

    const requestIdentifier = entityDraft.doi;
    const downloadURL = siteUrl + requestIdentifier;

    const headers = {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
    };

    if (enable) {
      this.sharedState.set(
        "viewState.processInformation",
        `Downloading PDF from X-hub ...`
      );
    }

    return { downloadURL, headers, enable };
  }

  downloadImpl = downloadImpl;
}

async function downloadImpl(
  this: DownloaderType,
  entityDraft: PaperEntityDraft
): Promise<PaperEntityDraft> {
  const { downloadURL, headers, enable } = this.preProcess(
    entityDraft
  ) as DownloaderRequestType;

  if (enable) {
    const siteUrl =
      (this.preference.get("downloaders") as Array<DownloaderPreference>).find(
        (downloaderPref) => downloaderPref.name === "x-hub"
      )?.args ?? "";
    const agent = this.getProxyAgent();
    let options = {
      headers: headers,
      retry: 1,
      timeout: 10000,
      agent: agent,
    };

    const body = await ipcRenderer.invoke("xhub-request", downloadURL);

    const root = parse(body);
    const buttonNodes = root.querySelectorAll("button");
    const button = buttonNodes.find((node) => {
      return node.attributes.onclick.includes("download");
    });

    if (button) {
      const url =
        siteUrl +
        button.attributes.onclick.replace("location.href='", "").slice(0, -1);
      const downloadedUrl = await ipcRenderer.invoke("xhub-request", url);
      if (downloadedUrl) {
        entityDraft.mainURL = downloadedUrl;
      }
      return entityDraft;
    }

    return entityDraft;
  } else {
    return entityDraft;
  }
}
