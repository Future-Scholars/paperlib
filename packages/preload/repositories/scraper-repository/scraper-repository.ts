import got from "got";

import { ScraperType } from "./scrapers/scraper";
import { PDFScraper } from "./scrapers/pdf";
import { DOIScraper } from "./scrapers/doi";
import { ArXivScraper } from "./scrapers/arxiv";
import {
  DBLPbyTimeScraper,
  DBLPScraper,
  DBLPVenueScraper,
} from "./scrapers/dblp";
import { IEEEScraper } from "./scrapers/ieee";
import { CVFScraper } from "./scrapers/cvf";
import { PwCScraper } from "./scrapers/paperwithcode";
import { OpenreviewScraper } from "./scrapers/openreview";
import { GoogleScholarScraper } from "./scrapers/google-scholar";

import { Preference } from "../../utils/preference";
import { PaperEntityDraft } from "../../models/PaperEntityDraft";
import { SharedState } from "../../utils/appstate";

export class ScraperRepository {
  sharedState: SharedState;
  preference: Preference;

  scraperList: Record<string, ScraperType>;

  constructor(sharedState: SharedState, preference: Preference) {
    this.sharedState = sharedState;
    this.preference = preference;

    this.scraperList = {
      PDFScraper: new PDFScraper(this.sharedState, this.preference),
      ArXivScraper: new ArXivScraper(this.sharedState, this.preference),
      DOIScraper: new DOIScraper(this.sharedState, this.preference),
      DBLPScraper: new DBLPScraper(this.sharedState, this.preference),
      DBLPbyTimeScraper0: new DBLPbyTimeScraper(
        this.sharedState,
        this.preference,
        0
      ),
      DBLPbyTimeScraper1: new DBLPbyTimeScraper(
        this.sharedState,
        this.preference,
        1
      ),
      DBLPVenueScraper: new DBLPVenueScraper(this.sharedState, this.preference),
      OpenreviewScraper: new OpenreviewScraper(
        this.sharedState,
        this.preference
      ),
      OpenreviewVenueScraper: new DBLPVenueScraper(
        this.sharedState,
        this.preference
      ),
      CVFScraper: new CVFScraper(this.sharedState, this.preference),
      IEEEScraper: new IEEEScraper(this.sharedState, this.preference),
      GoogleScholarScraper: new GoogleScholarScraper(
        this.sharedState,
        this.preference
      ),
      PwCScraper: new PwCScraper(this.sharedState, this.preference),
    };

    void got("https://paperlib.app/api/version");
  }

  async scrape(entityDraft: PaperEntityDraft): Promise<PaperEntityDraft> {
    for (const [name, scraper] of Object.entries(this.scraperList)) {
      try {
        entityDraft = await scraper.scrape(entityDraft);
      } catch (error) {
        console.log(error);
        this.sharedState.set(
          "viewState.alertInformation",
          `${name} error: ${error as string}`
        );
      }
    }
    return entityDraft;
  }
}
