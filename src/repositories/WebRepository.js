import {TEScraper} from './scrapers/te';
import {DOIScraper} from './scrapers/doi';
import {ArXivScraper} from './scrapers/arxiv';
import {DBLPbyTimeScraper, DBLPScraper, DBLPVenueScraper} from './scrapers/dblp';
import {IEEEScraper} from './scrapers/ieee';
import {CVFScraper} from './scrapers/cvf';

export class WebRepository {
  constructor(preference) {
    this.preference = preference;

    this.scraperList = [
      new TEScraper(this.preference),
      new ArXivScraper(this.preference),
      new DOIScraper(this.preference),
      new DBLPScraper(this.preference),
      new DBLPbyTimeScraper(this.preference, 0),
      new DBLPbyTimeScraper(this.preference, 1),
      new DBLPVenueScraper(this.preference),
      new CVFScraper(this.preference),
      new IEEEScraper(this.preference),
    ];
  }

  async scrape(entityDraft) {
    for (const scraper of this.scraperList) {
      entityDraft = await scraper.scrape(entityDraft);
    }
    return entityDraft;
  }
}
