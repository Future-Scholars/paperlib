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
import { CustomScraper } from "./scrapers/custom";

import { Preference, ScraperPreference } from "../../utils/preference";
import { PaperEntityDraft } from "../../models/PaperEntityDraft";
import { SharedState } from "../../utils/appstate";

export class ScraperRepository {
  sharedState: SharedState;
  preference: Preference;

  scraperList: Array<{ name: string; scraper: ScraperType }>;

  constructor(sharedState: SharedState, preference: Preference) {
    this.sharedState = sharedState;
    this.preference = preference;

    this.scraperList = [];

    const scraperPrefs = (
      this.preference.get("scrapers") as Array<ScraperPreference>
    ).sort((a, b) => b.priority - a.priority);

    for (const scraper of scraperPrefs) {
      if (scraper.name === "dblp") {
        const dblpScraper = new DBLPScraper(this.sharedState, this.preference);
        const dblpByTimeScraper0 = new DBLPbyTimeScraper(
          this.sharedState,
          this.preference,
          0
        );
        const dblpbyTimeScraper1 = new DBLPbyTimeScraper(
          this.sharedState,
          this.preference,
          1
        );
        const dblpVenueScraper = new DBLPVenueScraper(
          this.sharedState,
          this.preference
        );
        this.scraperList.push({
          name: "dblp",
          scraper: dblpScraper,
        });
        this.scraperList.push({
          name: "dblp-by-time-0",
          scraper: dblpByTimeScraper0,
        });
        this.scraperList.push({
          name: "dblp-by-time-1",
          scraper: dblpbyTimeScraper1,
        });
        this.scraperList.push({
          name: "dblp-venue",
          scraper: dblpVenueScraper,
        });
      } else {
        let scraperInstance: ScraperType | undefined;
        switch (scraper.name) {
          case "pdf":
            scraperInstance = new PDFScraper(this.sharedState, this.preference);
            break;
          case "doi":
            scraperInstance = new DOIScraper(this.sharedState, this.preference);
            break;
          case "arxiv":
            scraperInstance = new ArXivScraper(
              this.sharedState,
              this.preference
            );
            break;
          case "ieee":
            scraperInstance = new IEEEScraper(
              this.sharedState,
              this.preference
            );
            break;
          case "cvf":
            scraperInstance = new CVFScraper(this.sharedState, this.preference);
            break;
          case "pwc":
            scraperInstance = new PwCScraper(this.sharedState, this.preference);
            break;
          case "openreview":
            scraperInstance = new OpenreviewScraper(
              this.sharedState,
              this.preference
            );
            break;
          case "googlescholar":
            scraperInstance = new GoogleScholarScraper(
              this.sharedState,
              this.preference
            );
            break;
          default:
            scraperInstance = new CustomScraper(
              this.sharedState,
              this.preference,
              scraper.name
            );
        }
        if (scraperInstance !== undefined) {
          this.scraperList.push({
            name: scraper.name,
            scraper: scraperInstance,
          });
        }
      }
    }
    console.log(this.scraperList);

    void got("https://paperlib.app/api/version");
  }

  async scrape(entityDraft: PaperEntityDraft): Promise<PaperEntityDraft> {
    for (const scraper of this.scraperList) {
      try {
        entityDraft = await scraper.scraper.scrape(entityDraft);
      } catch (error) {
        console.log(error);
        this.sharedState.set(
          "viewState.alertInformation",
          `${scraper.name} error: ${error as string}`
        );
      }
    }
    return entityDraft;
  }
}
