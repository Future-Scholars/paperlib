import { Response } from "got";
import stringSimilarity from "string-similarity";

import { isMetadataCompleted } from "@/base/metadata";
import { formatString } from "@/base/string";
import { PaperEntity } from "@/models/paper-entity";

import { DOIScraper } from "./doi";
import { Scraper, ScraperRequestType } from "./scraper";

interface ResponseType {
  doi: string;
  vor?: {
    vorDoi: string;
  };
  title: string;
  statusDate: string;
  authors: {
    firstName: string;
    lastName: string;
  }[];
}

export class ChemRxivPreciseScraper extends Scraper {
  static checkEnable(paperEntityDraft: PaperEntity): boolean {
    return (
      paperEntityDraft.doi !== "" &&
      paperEntityDraft.doi.includes("chemrxiv") &&
      !isMetadataCompleted(paperEntityDraft)
    );
  }

  static preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const scrapeURL = `https://chemrxiv.org/engage/chemrxiv/public-api/v1/items/doi/${paperEntityDraft.doi}`;
    const headers = {};

    return { scrapeURL, headers };
  }

  static parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const parsedResponse = JSON.parse(rawResponse.body) as
      | ResponseType
      | { itemHits: ResponseType[] };
    let chemRxivResponses: ResponseType[];
    if (parsedResponse.hasOwnProperty("itemHits")) {
      chemRxivResponses = (parsedResponse as { itemHits: ResponseType[] })
        .itemHits;
    } else {
      chemRxivResponses = [parsedResponse as ResponseType];
    }

    for (const response of chemRxivResponses) {
      const plainHitTitle = formatString({
        str: response.title,
        removeStr: "&amp;",
        removeSymbol: true,
        lowercased: true,
      });

      const existTitle = formatString({
        str: paperEntityDraft.title,
        removeStr: "&amp;",
        removeSymbol: true,
        lowercased: true,
      });

      const sim = stringSimilarity.compareTwoStrings(plainHitTitle, existTitle);

      if (response.doi === paperEntityDraft.doi || sim > 0.95) {
        paperEntityDraft.setValue("title", response.title, false, true);
        paperEntityDraft.setValue(
          "authors",
          response.authors
            .map((a) => `${a.firstName} ${a.lastName}`)
            .join(", "),
          false
        );
        paperEntityDraft.setValue(
          "pubTime",
          response.statusDate.slice(0, 4),
          false
        );
        if (response.vor) {
          paperEntityDraft.setValue("doi", response.vor.vorDoi, false);
        } else {
          paperEntityDraft.setValue("publication", "chemRxiv", false);
        }
        break;
      }
    }
    return paperEntityDraft;
  }

  static async scrape(
    paperEntityDraft: PaperEntity,
    force = false
  ): Promise<PaperEntity> {
    if (!this.checkEnable(paperEntityDraft) && !force) {
      return paperEntityDraft;
    }

    const { scrapeURL, headers } = this.preProcess(paperEntityDraft);

    const response = (await networkTool.get(
      scrapeURL,
      headers,
      1,
      false,
      5000
    )) as Response<string>;
    paperEntityDraft = this.parsingProcess(
      response,
      paperEntityDraft
    ) as PaperEntity;

    paperEntityDraft = await DOIScraper.scrape(paperEntityDraft);

    return paperEntityDraft;
  }
}

export class ChemRxivFuzzyScraper extends ChemRxivPreciseScraper {
  static checkEnable(paperEntityDraft: PaperEntity): boolean {
    return (
      paperEntityDraft.title !== "" && !isMetadataCompleted(paperEntityDraft)
    );
  }

  static preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const scrapeURL = `https://chemrxiv.org/engage/chemrxiv/public-api/v1/items?term=${paperEntityDraft.title}`;
    const headers = {};

    return { scrapeURL, headers };
  }
}
