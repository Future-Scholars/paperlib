import { Response } from "got";
import path from "path";

import { PaperEntity } from "@/models/paper-entity";
import { DownloaderPreference } from "@/preference/preference";

import { Downloader, DownloaderRequestType } from "./downloader";

export class UnpayWallDownloader extends Downloader {
  preProcess(paperEntityDraft: PaperEntity): DownloaderRequestType {
    const authEmail =
      (this.preference.get("downloaders") as Array<DownloaderPreference>).find(
        (downloaderPref) => downloaderPref.name === "unpaywall"
      )?.args || "hi@paperlib.app";
    const enable =
      (paperEntityDraft.doi !== "" || paperEntityDraft.title !== "") &&
      this.getEnable("unpaywall");

    let queryUrl;
    if (paperEntityDraft.doi) {
      queryUrl = path.join(
        "https://api.unpaywall.org/v2/",
        paperEntityDraft.doi + "?email=" + authEmail
      );
    } else {
      queryUrl =
        "https://api.unpaywall.org/v2/search" +
        "?query=" +
        paperEntityDraft.title +
        "&email=" +
        authEmail;
    }

    const headers = {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
    };

    if (enable) {
      this.stateStore.logState.processLog = `Downloading PDF from Unpaywall ...`;
    }

    return { queryUrl, headers, enable };
  }

  async queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    paperEntityDraft: PaperEntity | null
  ): Promise<string> {
    try {
      const response = (await window.networkTool.get(
        queryUrl,
        headers,
        0,
        false
      )) as Response<string>;
      const responseBody = JSON.parse(response.body);

      let downloadUrl = "";
      if (responseBody.best_oa_location) {
        downloadUrl = responseBody.best_oa_location.url_for_pdf;
      } else if (responseBody.results) {
        for (const result of responseBody.results) {
          if (
            result.response.title === paperEntityDraft?.title &&
            result.best_oa_location
          ) {
            downloadUrl = result.response.best_oa_location.url_for_pdf;
            break;
          }
        }
      }
      return downloadUrl;
    } catch (error) {
      console.log(error);
      return "";
    }
  }
}
