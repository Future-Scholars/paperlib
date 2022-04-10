import got from 'got';

import { ScraperType } from './scrapers/scraper';
import { PDFScraper } from './scrapers/pdf';
import { DOIScraper } from './scrapers/doi';
import { ArXivScraper } from './scrapers/arxiv';
import {
  DBLPbyTimeScraper,
  DBLPScraper,
  DBLPVenueScraper,
} from './scrapers/dblp';
import { IEEEScraper } from './scrapers/ieee';
import { CVFScraper } from './scrapers/cvf';
import { PwCScraper } from './scrapers/paperwithcode';

import { Preference } from '../../utils/preference';
import { PaperEntityDraft } from '../../models/PaperEntityDraft';
import { SharedState } from '../../interactors/app-state';

export class ScraperRepository {
  preference: Preference;
  sharedState: SharedState;
  scraperList: ScraperType[];

  constructor(preference: Preference, sharedState: SharedState) {
    this.preference = preference;
    this.sharedState = sharedState;

    this.scraperList = [
      new PDFScraper(this.preference),
      new ArXivScraper(this.preference),
      new DOIScraper(this.preference),
      new DBLPScraper(this.preference),
      new DBLPbyTimeScraper(this.preference, 0),
      new DBLPbyTimeScraper(this.preference, 1),
      new DBLPVenueScraper(this.preference),
      new CVFScraper(this.preference),
      new IEEEScraper(this.preference),
      new PwCScraper(this.preference),
    ];

    void got('https://paperlib.app/api/version');
  }

  async scrape(entityDraft: PaperEntityDraft): Promise<PaperEntityDraft> {
    for (const scraper of this.scraperList) {
      try {
        entityDraft = await scraper.scrape(entityDraft);
      } catch (error) {
        this.sharedState.set(
          'viewState.alertInformation',
          `Scraper ${scraper.constructor.name} error: ${error as string}`
        );
      }
    }
    return entityDraft;
  }
}
