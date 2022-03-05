import { TEScraper } from "./scrapers/te";
import { DOIScraper } from "./scrapers/doi";
import { ArXivScraper } from "./scrapers/arxiv";
import { DBLPbyTimeScraper, DBLPScraper, DBLPVenueScraper } from "./scrapers/dblp";
import { IEEEScraper } from "./scrapers/ieee";
import { CVFScraper } from "./scrapers/cvf";

export class WebRepository {
    constructor(preference) {
        this.preference = preference;

        this.scraperList = [
            new TEScraper(this.preference.get("teScraper")),
            new ArXivScraper(this.preference.get("arXivScraper")),
            new DOIScraper(this.preference.get("doiScraper")),
            new DBLPScraper(this.preference.get("dblpScraper")),
            new DBLPbyTimeScraper(this.preference.get("dblpScraper"), 0),
            new DBLPbyTimeScraper(this.preference.get("dblpScraper"), 1),
            new DBLPVenueScraper(this.preference.get("dblpScraper")),
            new CVFScraper(this.preference.get("cvfScraper")),
            new IEEEScraper(this.preference.get("ieeeScraper"), this.preference.get("ieeeAPIKey")),
        ]
    }

    async scrape(entityDraft) {
        for (let scraper of this.scraperList) {
            entityDraft = await scraper.scrape(entityDraft);
        }
        return entityDraft;
    }
}
