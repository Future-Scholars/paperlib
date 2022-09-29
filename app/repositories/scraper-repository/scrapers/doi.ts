import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";

export class DOIScraper extends Scraper {
  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      paperEntityDraft.doi !== "" &&
      this.getEnable("doi") &&
      this.isPreprint(paperEntityDraft);
    const doiID = formatString({
      str: paperEntityDraft.doi,
      removeNewline: true,
      removeWhite: true,
    });
    const scrapeURL = `https://dx.doi.org/${doiID}`;
    const headers = {
      Accept: "application/json",
    };

    if (enable) {
      this.stateStore.logState.processLog = `Scraping metadata by DOI ...`;
    }
    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    if (rawResponse.body.startsWith("<")) {
      return paperEntityDraft;
    }

    const response = JSON.parse(rawResponse.body) as {
      title: string;
      author: { given?: string; family?: string; name?: string }[];
      published: {
        "date-parts": { "0": string[] };
      };
      type: string;
      "container-title": string | string[];
      publisher: string;
      page: string;
      volume: string;
      issue: string;
    };
    const title = response.title;
    const authors = response.author
      .map((author) => {
        if (author.name) {
          return author.name;
        } else {
          return author.given?.trim() + " " + author.family?.trim();
        }
      })
      .join(", ");
    const pubTime = response.published["date-parts"]["0"][0];
    let pubType;
    if (response.type == "proceedings-article") {
      pubType = 1;
    } else if (response.type == "journal-article") {
      pubType = 0;
    } else if (response.type.includes("book") || response.type.includes("monograph")) {
      pubType = 3;
    } else {
      pubType = 2;
    }

    let publication
    if (response.type.includes('monograph')) {
      publication = response.publisher.replaceAll('&amp;', '&');
    } else {
      publication = response["container-title"];
      if (Array.isArray(publication)) {
        publication = publication.join(', ').replaceAll('&amp;', '&');
      } else {
        publication = publication.replaceAll('&amp;', '&');
      }
    }

    paperEntityDraft.setValue("title", title);
    paperEntityDraft.setValue("authors", authors);
    paperEntityDraft.setValue("pubTime", `${pubTime}`);
    paperEntityDraft.setValue("pubType", pubType);
    paperEntityDraft.setValue("publication", publication);
    if (response.volume) {
      paperEntityDraft.setValue("volume", response.volume);
    }
    if (response.issue) {
      paperEntityDraft.setValue("number", response.issue);
    }
    if (response.page) {
      paperEntityDraft.setValue("pages", response.page);
    }
    if (response.publisher) {
      paperEntityDraft.setValue(
        "publisher",
        response.publisher ===
          "Institute of Electrical and Electronics Engineers (IEEE)"
          ? "IEEE"
          : response.publisher
      );
    }
    this.uploadCache(paperEntityDraft, "doi");
    return paperEntityDraft;
  }
}
