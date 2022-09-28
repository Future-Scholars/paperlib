import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";

export class OpenreviewScraper extends Scraper {
  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      paperEntityDraft.title !== "" &&
      this.isPreprint(paperEntityDraft) &&
      this.getEnable("openreview");

    const scrapeURL = `https://api.openreview.net/notes/search?term=${paperEntityDraft.title}`;

    const headers = {
      Accept: "application/json",
    };

    if (enable) {
      this.stateStore.logState.processLog = `Scraping metadata from openreview.net ...`;
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const response = (
      JSON.parse(rawResponse.body) as {
        notes: {
          content: {
            title: string;
            authors: string[];
            venueid: string;
            venue: string;
            _bibtex: string;
          };
        }[];
      }
    ).notes[0];

    const plainHitTitle = formatString({
      str: response.content.title,
      removeStr: "&amp",
      removeSymbol: true,
      lowercased: true,
    });

    const existTitle = formatString({
      str: paperEntityDraft.title,
      removeStr: "&amp",
      removeSymbol: true,
      lowercased: true,
    });

    if (plainHitTitle !== existTitle) {
      return paperEntityDraft;
    }

    const title = response.content.title;
    const authors = response.content.authors.join(", ");

    paperEntityDraft.setValue("title", title);
    paperEntityDraft.setValue("authors", authors);

    if (response.content.venue) {
      if (
        !response.content.venue.includes("Submitted") &&
        !response.content.venue.includes("CoRR")
      ) {
        const type = response.content.venueid.includes("Conference")
          ? "conf"
          : "journals";
        const publication = `dblp://${type}/${response.content.venueid
          .split("/")[0]
          .split(".")[0]
          .toLowerCase()}`;
        const pubTimeReg = response.content.venueid.match(/\d{4}/g);
        const pubTime = pubTimeReg ? pubTimeReg[0] : "";

        paperEntityDraft.setValue("pubTime", `${pubTime}`);
        paperEntityDraft.setValue("publication", publication);

        this.uploadCache(paperEntityDraft, "openreview");
      }
    } else {
      if (
        response.content._bibtex &&
        response.content._bibtex.includes("year={")
      ) {
        const pubTimeReg = response.content._bibtex.match(/year={(\d{4})/);
        const pubTime = pubTimeReg ? pubTimeReg[1] : "";
        paperEntityDraft.setValue("pubTime", `${pubTime}`);
      }
      paperEntityDraft.setValue("publication", "openreview.net");
    }


    return paperEntityDraft;
  }
}
