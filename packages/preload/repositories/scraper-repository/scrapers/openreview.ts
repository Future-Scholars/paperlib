import { Response } from "got";

import { Scraper, ScraperRequestType } from "./scraper";
import { formatString } from "../../../utils/string";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";

export class OpenreviewScraper extends Scraper {
  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    const enable =
      entityDraft.title !== "" &&
      (entityDraft.publication === "arXiv" || entityDraft.publication === "") &&
      this.getEnable("openreview");

    const scrapeURL = `https://api.openreview.net/notes/search?term=${entityDraft.title}`;

    const headers = {
      Accept: "application/json",
    };

    if (enable) {
      this.sharedState.set(
        "viewState.processInformation",
        `Scraping metadata from openreview.net ...`
      );
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    entityDraft: PaperEntityDraft
  ): PaperEntityDraft {
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
      str: entityDraft.title,
      removeStr: "&amp",
      removeSymbol: true,
      lowercased: true,
    });

    if (plainHitTitle !== existTitle) {
      return entityDraft;
    }

    const title = response.content.title;
    const authors = response.content.authors.join(", ");

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

        entityDraft.setValue("pubTime", `${pubTime}`);
        entityDraft.setValue("publication", publication);
      }
    } else {
      if (
        response.content._bibtex &&
        response.content._bibtex.includes("year={")
      ) {
        const pubTimeReg = response.content._bibtex.match(/year={(\d{4})/);
        const pubTime = pubTimeReg ? pubTimeReg[1] : "";
        entityDraft.setValue("pubTime", `${pubTime}`);
      }
      entityDraft.setValue("publication", "openreview.net");
    }

    entityDraft.setValue("title", title);
    entityDraft.setValue("authors", authors);

    return entityDraft;
  }
}
