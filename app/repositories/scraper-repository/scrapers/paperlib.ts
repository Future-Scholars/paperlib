import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";

export class PaperlibScraper extends Scraper {
  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      paperEntityDraft.title !== "" &&
      (paperEntityDraft.publication.toLowerCase().includes("arxiv") ||
        paperEntityDraft.publication.toLowerCase().includes("openreview") ||
        paperEntityDraft.publication === "") &&
      this.getEnable("paperlib");

    const shortTitle = formatString({
      str: paperEntityDraft.title,
      removeWhite: true,
      removeStr: "&amp",
    });
    const scrapeURL = `https://paperlib.app/api/cvf/${shortTitle}`;

    const headers = {};

    if (enable) {
      this.stateStore.logState.processLog = `Scraping metadata from the Paperlib Qeury Server...`;
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const response = JSON.parse(rawResponse.body) as {
      year: string;
      booktitle: string;
      type: string;
      ENTRYTYPE: string;
      pages: string;
      author: string;
    };
    if (typeof response.year !== "undefined") {
      const pubTime = response.year;
      const publication = response.booktitle;
      let pubType;
      if (
        response.type === "inproceedings" ||
        response.ENTRYTYPE === "inproceedings"
      ) {
        pubType = 1;
      } else if (
        response.type === "article" ||
        response.ENTRYTYPE === "article"
      ) {
        pubType = 0;
      } else {
        pubType = 2;
      }
      paperEntityDraft.setValue("pubTime", `${pubTime}`);
      paperEntityDraft.setValue("pubType", pubType);
      paperEntityDraft.setValue("publication", publication);
      paperEntityDraft.setValue("pages", response.pages || "");

      if (response.author) {
        const authorList = response.author.split("and").map((author) => {
          const first_last = author
            .trim()
            .split(",")
            .map((v) => v.trim());
          return `${first_last[1]} ${first_last[0]}`;
        });
        paperEntityDraft.setValue("authors", authorList.join(", "));
      }
    }
    return paperEntityDraft;
  }
}
