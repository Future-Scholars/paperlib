import { readFileSync } from "fs";

import { bibtex2json, bibtex2paperEntityDraft } from "@/base/bibtex";
import { eraseProtocol, getFileType, getProtocol } from "@/base/url";
import { PaperEntity } from "@/models/paper-entity";

import { AbstractEntryScraper } from "./entry-scraper";

export interface IBibTexEntryScraperPayload {
  url: string;
}

export class BibTexEntryScraper extends AbstractEntryScraper {
  static validPayload(payload: any): boolean {
    if (!payload.hasOwnProperty("url")) {
      return false;
    }
    if (
      (getProtocol(payload.url) === "file" ||
        getProtocol(payload.url) === "") &&
      getFileType(payload.url) === "bib"
    ) {
      return true;
    } else {
      return false;
    }
  }
  static async scrape(
    payload: IBibTexEntryScraperPayload
  ): Promise<PaperEntity[]> {
    if (!this.validPayload(payload)) {
      return [];
    }

    const bibtexStr = readFileSync(eraseProtocol(payload.url), "utf8");
    const bibtexes = bibtex2json(bibtexStr);
    const paperEntityDrafts: PaperEntity[] = [];
    for (const bibtex of bibtexes) {
      let paperEntityDraft = new PaperEntity(true);
      paperEntityDraft = bibtex2paperEntityDraft(bibtex, paperEntityDraft);
      paperEntityDrafts.push(paperEntityDraft);
    }
    return paperEntityDrafts;
  }
}
