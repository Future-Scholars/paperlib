import { PaperEntity } from "@/models/paper-entity";

import { BibTexEntryScraper } from "./scrapers/bibtex-entry-scraper";
import { AbstractEntryScraper } from "./scrapers/entry-scraper";
import { PaperEntityEntryScraper } from "./scrapers/paperentity-entry-scraper";
import { PDFEntryScraper } from "./scrapers/pdf-entry-scraper";

const SCRAPER_OBJS = new Map<string, typeof AbstractEntryScraper>([
  ["pdf", PDFEntryScraper],
  ["bibtex", BibTexEntryScraper],
  ["paperentity", PaperEntityEntryScraper],
]);

// TODO: zotero csv

export class EntryScraperRepository {
  async scrape(payloads: any[]): Promise<PaperEntity[]> {
    const paperEntityDrafts = await Promise.all(
      payloads.map(async (payload) => {
        const paperEntityDrafts = await Promise.all(
          Array.from(SCRAPER_OBJS.values()).map(async (Scraper) => {
            return await Scraper.scrape(payload);
          })
        );
        return paperEntityDrafts.flat();
      })
    );
    return paperEntityDrafts.flat();
  }
}
