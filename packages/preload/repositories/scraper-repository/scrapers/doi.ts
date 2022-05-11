import { Response } from "got";

import { Scraper, ScraperRequestType } from "./scraper";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";
import { formatString } from "../../../utils/string";

export class DOIScraper extends Scraper {
  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    const enable =
      entityDraft.doi !== "" && (this.preference.get("doiScraper") as boolean);
    const doiID = formatString({
      str: entityDraft.doi,
      removeNewline: true,
      removeWhite: true,
    });
    const scrapeURL = `https://dx.doi.org/${doiID}`;
    const headers = {
      Accept: "application/json",
    };

    if (enable) {
      this.sharedState.set(
        "viewState.processInformation",
        "Scraping metadata by DOI..."
      );
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    entityDraft: PaperEntityDraft
  ): PaperEntityDraft {
    const response = JSON.parse(rawResponse.body) as {
      title: string;
      author: { given: string; family: string }[];
      published: {
        "date-parts": { "0": string[] };
      };
      type: string;
      "container-title": string;
      publisher: string;
      page: string;
      volume: string;
    };
    const title = response.title;
    const authors = response.author
      .map((author) => {
        return author.given.trim() + " " + author.family.trim();
      })
      .join(", ");
    const pubTime = response.published["date-parts"]["0"][0];
    let pubType;
    if (response.type == "proceedings-article") {
      pubType = 1;
    } else if (response.type == "journal-article") {
      pubType = 0;
    } else {
      pubType = 2;
    }
    const publication = response["container-title"];

    entityDraft.setValue("title", title);
    entityDraft.setValue("authors", authors);
    entityDraft.setValue("pubTime", `${pubTime}`);
    entityDraft.setValue("pubType", pubType);
    entityDraft.setValue("publication", publication);
    if (response.volume) {
      entityDraft.setValue("volume", response.volume);
    }
    if (response.page) {
      entityDraft.setValue("pages", response.page);
    }
    if (response.publisher) {
      entityDraft.setValue(
        "publisher",
        response.publisher ===
          "Institute of Electrical and Electronics Engineers (IEEE)"
          ? "IEEE"
          : response.publisher
      );
    }
    return entityDraft;
  }
}
