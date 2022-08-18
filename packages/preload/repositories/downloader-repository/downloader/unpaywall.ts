import path from "path";
import got from "got";

import { Downloader, DownloaderRequestType } from "./downloader";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";
import { DownloaderPreference } from "../../../utils/preference";

export class UnpayWallDownloader extends Downloader {
  preProcess(entityDraft: PaperEntityDraft): DownloaderRequestType {
    const authEmail =
      (this.preference.get("downloaders") as Array<DownloaderPreference>).find(
        (downloaderPref) => downloaderPref.name === "unpaywall"
      )?.args || "unpaywall@paperlib.app";
    const enable =
      (entityDraft.doi !== "" || entityDraft.title !== "") &&
      this.getEnable("unpaywall");

    let queryUrl;
    if (entityDraft.doi) {
      queryUrl = path.join(
        "https://api.unpaywall.org/v2/",
        entityDraft.doi + "?email=" + authEmail
      );
    } else {
      queryUrl =
        "https://api.unpaywall.org/v2/search" +
        "?query=" +
        entityDraft.title +
        "&email=" +
        authEmail;
    }

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

    return { queryUrl, headers, enable };
  }

  async queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    entityDraft: PaperEntityDraft | null
  ): Promise<string> {
    const agent = this.getProxyAgent();
    let options = {
      headers: headers,
      retry: 1,
      timeout: 10000,
      agent: agent,
    };
    try {
      const response = await got(queryUrl, options);
      const responseBody = JSON.parse(response.body);

      let downloadUrl = "";
      if (responseBody.best_oa_location) {
        downloadUrl = responseBody.best_oa_location.url_for_pdf;
      } else if (responseBody.results) {
        for (const result of responseBody.results) {
          if (
            result.response.title === entityDraft?.title &&
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
