import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";

export class PaperlibScraper extends Scraper {
  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      (paperEntityDraft.title !== "" ||
        paperEntityDraft.arxiv !== "" || paperEntityDraft.doi !== "") &&
      this.getEnable("paperlib");

    const shortTitle = formatString({
      str: paperEntityDraft.title,
      removeWhite: true,
      removeStr: "&amp;",
    });
    let scrapeURL = `https://api.paperlib.app/pubs/query?`;
    const queryParams = []
    if (shortTitle) {
      queryParams.push(`title=${shortTitle}`);
    }
    if (paperEntityDraft.arxiv) {
      queryParams.push(`arxiv=${paperEntityDraft.arxiv}`);
    }
    if (paperEntityDraft.doi) {
      queryParams.push(`doi=${paperEntityDraft.doi}`);
    }
    scrapeURL += queryParams.join("&");

    const headers = {};

    if (enable) {
      this.stateStore.logState.processLog = `Scraping from Paperlib Qeury Service...`;
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const response = JSON.parse(rawResponse.body) as {
      "count": number,
      "results": {
        "_id": string,
        "_partition": string,
        "addTime": Date,
        "title": string,
        "minifiedtitle": string,
        "authors": string,
        "publication": string,
        "pubTime": string,
        "pubType": number,
        "doi": string,
        "arxiv": string,
        "pages": string,
        "volume": string,
        "number": string,
        "publisher": string,
        "source": string,
        "hits": number,
        "permission": number
      }[]
    }

    if (response.count && response.count > 0) {

      const hotestResult = response.results.sort((a, b) => b.hits - a.hits)[0];

      paperEntityDraft.setValue("title", hotestResult.title, false, true);
      paperEntityDraft.setValue("authors", hotestResult.authors, false);
      paperEntityDraft.setValue("publication", hotestResult.publication, false);
      paperEntityDraft.setValue("pubTime", hotestResult.pubTime, false);
      paperEntityDraft.setValue("pubType", hotestResult.pubType, false);
      paperEntityDraft.setValue("doi", hotestResult.doi, false);
      paperEntityDraft.setValue("arxiv", hotestResult.arxiv, false);
      paperEntityDraft.setValue("pages", hotestResult.pages, false);
      paperEntityDraft.setValue("volume", hotestResult.volume, false);
      paperEntityDraft.setValue("number", hotestResult.number, false);
      paperEntityDraft.setValue("publisher", hotestResult.publisher, false);

    }
    return paperEntityDraft;
  }
}
