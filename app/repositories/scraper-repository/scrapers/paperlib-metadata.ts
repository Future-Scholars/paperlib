import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { formatString } from "@/utils/string";

import { ScraperRequestType } from "./scraper";

interface ResponseType {
  title: string;
  minifiedtitle: string;
  authors: string;
  publication: string;
  pubTime: string;
  pubType: number;
  doi: string;
  arxiv: string;
  pages: string;
  volume: string;
  number: string;
  publisher: string;
  source: string;
  codes: string[];
}

export class PaperlibMetadataServiceScraper {
  static checkEnable(paperEntityDraft: PaperEntity): boolean {
    return (
      paperEntityDraft.title !== "" ||
      paperEntityDraft.arxiv !== "" ||
      paperEntityDraft.doi !== ""
    );
  }

  static preProcess(
    paperEntityDraft: PaperEntity,
    scrapers: string[]
  ): ScraperRequestType {
    const title = formatString({
      str: paperEntityDraft.title,
      removeNewline: true,
      removeStr: "&amp;",
    });
    let scrapeURL = `https://api.paperlib.app/metadata/query?scrapers=${scrapers.join(
      ","
    )}&`;
    const queryParams = [];
    if (title) {
      queryParams.push(`title=${title}`);
    }
    if (paperEntityDraft.arxiv) {
      queryParams.push(`arxiv=${paperEntityDraft.arxiv}`);
    }
    if (paperEntityDraft.doi) {
      queryParams.push(`doi=${paperEntityDraft.doi}`);
    }
    scrapeURL += queryParams.join("&");

    const headers = {};

    console.log(scrapeURL);
    return { scrapeURL, headers };
  }

  static parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const response = JSON.parse(rawResponse.body) as ResponseType;

    paperEntityDraft.setValue("title", response.title, false, true);
    paperEntityDraft.setValue("authors", response.authors, false);
    paperEntityDraft.setValue("publication", response.publication, false);
    paperEntityDraft.setValue("pubTime", response.pubTime, false);
    paperEntityDraft.setValue("pubType", response.pubType, false);
    paperEntityDraft.setValue("doi", response.doi, false);
    paperEntityDraft.setValue("arxiv", response.arxiv, false);
    paperEntityDraft.setValue("pages", response.pages, false);
    paperEntityDraft.setValue("volume", response.volume, false);
    paperEntityDraft.setValue("number", response.number, false);
    paperEntityDraft.setValue("publisher", response.publisher, false);

    paperEntityDraft.setValue("codes", response.codes);

    return paperEntityDraft;
  }

  static async scrape(
    paperEntityDraft: PaperEntity,
    scrapers: string[],
    force = false
  ): Promise<PaperEntity> {
    if (!this.checkEnable(paperEntityDraft) && !force) {
      return paperEntityDraft;
    }

    let { scrapeURL, headers } = this.preProcess(paperEntityDraft, scrapers);

    if (force) {
      scrapeURL += "&force=true";
    }

    const response = (await window.networkTool.get(
      scrapeURL,
      headers,
      1,
      false,
      15000
    )) as Response<string>;
    return this.parsingProcess(response, paperEntityDraft);
  }
}
