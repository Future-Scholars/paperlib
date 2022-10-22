import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { formatString } from "@/utils/string";

import { ScraperRequestType } from "./scraper";
import { DOIScraper } from "./doi";

export class DOIInnerScraper extends DOIScraper {
  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable = paperEntityDraft.doi !== ""
    const doiID = formatString({
      str: paperEntityDraft.doi,
      removeNewline: true,
      removeWhite: true,
    });
    const scrapeURL = `https://dx.doi.org/${doiID}`;
    const headers = {
      Accept: "application/json",
    };

    return { scrapeURL, headers, enable };
  }
}