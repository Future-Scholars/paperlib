import got from "got";
import queue from "queue";

import { createDecorator } from "@/base/injection/injection";
import { isMetadataCompleted, mergeMetadata } from "@/base/metadata";
import { PaperEntity } from "@/models/paper-entity";

import { AdsabsScraper } from "./scrapers/adsabs";
import { ArXivScraper } from "./scrapers/arxiv";
import {
  ChemRxivFuzzyScraper,
  ChemRxivPreciseScraper,
} from "./scrapers/chemrxiv";
import { CrossRefScraper } from "./scrapers/crossref";
import { DBLPScraper } from "./scrapers/dblp";
import { DOIScraper } from "./scrapers/doi";
import { GoogleScholarScraper } from "./scrapers/google-scholar";
import { IEEEScraper } from "./scrapers/ieee";
import { OpenreviewScraper } from "./scrapers/openreview";
import { PaperlibMetadataServiceScraper } from "./scrapers/paperlib-metadata";
import { PwCScraper } from "./scrapers/paperwithcode";
import { PubMedScraper } from "./scrapers/pubmed";
import { ScopusScraper } from "./scrapers/scopus";
import { Scraper } from "./scrapers/scraper";
import { SemanticScholarScraper } from "./scrapers/semanticscholar";
import { SPIEScraper } from "./scrapers/spie";
import { SpringerScraper } from "./scrapers/springer";

// ========== metadata Scraper Repository ============ //
//
// ------------------------------- (PaperlibMetadataService first)
// | PaperlibMetadataServiceScraper  (default)
// -------------------------------
//    v
//    v
// ------------------------------- (Local Scrapers, if PaperlibMetadataService failed)
// |
// | PreciseScrapers (by some ids, e.g. DOI, arXiv, ChemRxiv)
// |  v
// | FuzzyScrapers and ClientsideScrapers (by title, e.g. DBLP, Semantic Scholar)
// |  v
// | AdditionalScrapers (e.g., paper with code)
// |
// -------------------------------
//    v
//    v
// ------------------------------- (Clientside Scrapers, if PaperlibMetadataService cannot find the paper)
// | ClientsideScrapers (by title, e.g. Google Scholar, IEEE)
// |  v
// | AdditionalScrapers (e.g., paper with code)
// -------------------------------

// ========================== //

const PRECISE_SCRAPERS = new Map([
  ["doi", { breakable: true, mustwait: true }],
  ["arxiv", { breakable: false, mustwait: false }],
  ["chemrxivprecise", { breakable: false, mustwait: false }],
]); // name: {breakable, mustwait}

const FUZZY_SCRAPERS = new Map([
  ["dblp", { breakable: true, mustwait: true }],
  ["semanticscholar", { breakable: true, mustwait: false }],
  ["crossref", { breakable: true, mustwait: false }],
  ["openreview", { breakable: false, mustwait: false }],
  ["adsabs", { breakable: false, mustwait: false }],
  ["spie", { breakable: false, mustwait: false }],
  ["scopus", { breakable: true, mustwait: false }],
  ["springer", { breakable: true, mustwait: false }],
  ["chemrxivfuzzy", { breakable: false, mustwait: false }],
  ["pubmed", { breakable: true, mustwait: false }],
]);

const CLIENTSIDE_SCRAPERS = new Map([
  ["ieee", { breakable: true, mustwait: false }],
  ["googlescholar", { breakable: true, mustwait: false }],
]);

// Scrapers that should be run after all scrapers
const ADDITIONAL_SCRAPERS = new Map([
  ["pwc", { breakable: false, mustwait: true }],
]);

const PAPERLIB_METADATA_SERVICE_SCRAPERS = new Map([
  ...PRECISE_SCRAPERS,
  ...FUZZY_SCRAPERS,
  ...ADDITIONAL_SCRAPERS,
]);

const SCRAPER_OBJS = new Map<string, typeof Scraper>([
  ["doi", DOIScraper],
  ["arxiv", ArXivScraper],
  ["dblp", DBLPScraper],
  ["semanticscholar", SemanticScholarScraper],
  ["crossref", CrossRefScraper],
  ["openreview", OpenreviewScraper],
  ["adsabs", AdsabsScraper],
  ["pwc", PwCScraper],
  ["scopus", ScopusScraper],
  ["springer", SpringerScraper],
  ["spie", SPIEScraper],
  ["chemrxivprecise", ChemRxivPreciseScraper],
  ["chemrxivfuzzy", ChemRxivFuzzyScraper],
  ["ieee", IEEEScraper],
  ["pubmed", PubMedScraper],
  ["googlescholar", GoogleScholarScraper],
]);

export const IMetadataScraperRepository = createDecorator(
  "metadataScraperRepository"
);

export class MetadataScraperRepository {
  constructor() {
    void got("https://api.paperlib.app/version");
  }

  /**
   * Scrape from the default Paperlib Metadata Service(PMS)
   * @param paperEntityDraft - paper entity to be scraped
   * @param scrapers - list of scraper names to be used
   * @param force - whether to force scraping
   * @returns scraped paper entity with fullfilled metadata, and errors
   */
  async scrapePMS(
    paperEntityDraft: PaperEntity,
    scrapers: string[] = [],
    force: boolean = false
  ): Promise<{ paperEntityDraft: PaperEntity; errors: Error[] }> {
    //
    const enabeledPMSScraperList = scrapers.filter((name) =>
      Array.from(PAPERLIB_METADATA_SERVICE_SCRAPERS.keys()).includes(name)
    );
    const errors: Error[] = [];
    try {
      paperEntityDraft = await PaperlibMetadataServiceScraper.scrape(
        paperEntityDraft,
        ["cache"].concat(enabeledPMSScraperList),
        force
      );
    } catch (e) {
      errors.push(e as Error);

      const paperEntityDraftAndErrors = await this.scrapePMSLocalBackup(
        paperEntityDraft,
        scrapers,
        force
      );

      paperEntityDraft = paperEntityDraftAndErrors.paperEntityDraft;
      errors.push(...paperEntityDraftAndErrors.errors);
    }
    return { paperEntityDraft, errors };
  }

  /**
   * Scrape from local scrapers as backup if Paperlib Metadata Service(PMS) failed.
   * @param paperEntityDraft - paper entity to be scraped
   * @param scrapers - list of scraper names to be used
   * @param force - whether to force scraping
   * @returns scraped paper entity with fullfilled metadata, and errors
   */
  async scrapePMSLocalBackup(
    paperEntityDraft: PaperEntity,
    scrapers: string[] = [],
    force: boolean = false
  ): Promise<{ paperEntityDraft: PaperEntity; errors: Error[] }> {
    const errors: Error[] = [];
    const draftAndErrorsPrecise = await this._scrapePrecise(
      paperEntityDraft,
      scrapers,
      force
    );
    paperEntityDraft = draftAndErrorsPrecise.paperEntityDraft;
    errors.push(...draftAndErrorsPrecise.errors);

    if (!isMetadataCompleted(paperEntityDraft)) {
      const draftAndErrorsFuzzy = await this._scrapeFuzzy(
        paperEntityDraft,
        scrapers,
        force
      );
      paperEntityDraft = draftAndErrorsFuzzy.paperEntityDraft;
      errors.push(...draftAndErrorsFuzzy.errors);
    }
    const draftAndErrorsAdditional = await this._scrapeAdditional(
      paperEntityDraft,
      scrapers,
      force
    );
    paperEntityDraft = draftAndErrorsAdditional.paperEntityDraft;
    errors.push(...draftAndErrorsAdditional.errors);

    return { paperEntityDraft, errors };
  }

  /**
   * Scrape from some force-clientside scrapers, such as Google Scholars, if PMS and local backups cannot scrape the metadata.
   * @param paperEntityDraft - paper entity to be scraped
   * @param scrapers - list of scraper names to be used
   * @param force - whether to force scraping
   * @returns scraped paper entity with fullfilled metadata, and errors
   */
  async scrapeClientside(
    paperEntityDraft: PaperEntity,
    scrapers: string[] = [],
    force: boolean = false
  ): Promise<{ paperEntityDraft: PaperEntity; errors: Error[] }> {
    if (isMetadataCompleted(paperEntityDraft)) {
      return {
        paperEntityDraft,
        errors: [],
      };
    }
    const paperEntityDraftAndErrors = await this._scrapeClientside(
      paperEntityDraft,
      scrapers,
      force
    );

    const paperEntityDraftAndErrorsAdditional = await this._scrapeAdditional(
      paperEntityDraftAndErrors.paperEntityDraft,
      scrapers,
      force
    );

    return {
      paperEntityDraft: paperEntityDraftAndErrorsAdditional.paperEntityDraft,
      errors: [
        ...paperEntityDraftAndErrors.errors,
        ...paperEntityDraftAndErrorsAdditional.errors,
      ],
    };
  }

  async _scrapePrecise(
    paperEntityDraft: PaperEntity,
    scrapers: string[],
    force: boolean = false
  ): Promise<{ paperEntityDraft: PaperEntity; errors: Error[] }> {
    const enabledScrapers = Array.from(PRECISE_SCRAPERS.keys()).filter(
      (scraper) => scrapers.includes(scraper)
    );

    return await this._scrapePipeline(
      paperEntityDraft,
      enabledScrapers,
      PRECISE_SCRAPERS,
      0,
      0,
      force
    );
  }

  async _scrapeFuzzy(
    paperEntityDraft: PaperEntity,
    scrapers: string[],
    force: boolean = false
  ): Promise<{ paperEntityDraft: PaperEntity; errors: Error[] }> {
    const enabledScrapers = Array.from(FUZZY_SCRAPERS.keys()).filter(
      (scraper) => scrapers.includes(scraper)
    );

    return await this._scrapePipeline(
      paperEntityDraft,
      enabledScrapers,
      FUZZY_SCRAPERS,
      500,
      200,
      force
    );
  }

  async _scrapeAdditional(
    paperEntityDraft: PaperEntity,
    scrapers: string[],
    force: boolean = false
  ): Promise<{ paperEntityDraft: PaperEntity; errors: Error[] }> {
    const enabledScrapers = Array.from(ADDITIONAL_SCRAPERS.keys()).filter(
      (scraper) => scrapers.includes(scraper)
    );
    return this._scrapePipeline(
      paperEntityDraft,
      enabledScrapers,
      ADDITIONAL_SCRAPERS,
      0,
      400,
      force
    );
  }

  async _scrapeClientside(
    paperEntityDraft: PaperEntity,
    scrapers: string[],
    force: boolean = false
  ): Promise<{ paperEntityDraft: PaperEntity; errors: Error[] }> {
    const enabledScrapers = Array.from(CLIENTSIDE_SCRAPERS.keys()).filter(
      (scraper) => scrapers.includes(scraper)
    );

    return this._scrapePipeline(
      paperEntityDraft,
      enabledScrapers,
      ADDITIONAL_SCRAPERS,
      0,
      300,
      force
    );
  }

  async _scrapePipeline(
    paperEntityDraft: PaperEntity,
    enabledScrapers: string[],
    scraperProps: Map<string, { breakable: boolean; mustwait: boolean }>,
    gapTime = 0,
    priority_offset = 0,
    force: boolean = false
  ): Promise<{ paperEntityDraft: PaperEntity; errors: Error[] }> {
    const errors: Error[] = [];
    return new Promise(async function (resolve, reject) {
      const q = queue();
      q.timeout = 20000;

      let mergePriorityLevel = {
        title: 999,
        minifiedTitle: 999,
        authors: 999,
        publication: 999,
        pubTime: 999,
        pubType: 999,
        doi: 999,
        arxiv: 999,
        pages: 999,
        volume: 999,
        number: 999,
        publisher: 999,
        codes: 999,
      } as { [key: string]: number };
      const originPaperEntityDraft = new PaperEntity(false);
      originPaperEntityDraft.initialize(paperEntityDraft);

      let mustwaitN = enabledScrapers.filter(
        (scraper) => scraperProps.get(scraper)?.mustwait
      ).length;

      for (const scraper of enabledScrapers) {
        q.push(function () {
          return new Promise(async function (resolve, reject) {
            const scraperObj = SCRAPER_OBJS.get(scraper) as typeof Scraper;
            const scraperIndex = enabledScrapers.indexOf(scraper);

            await new Promise((resolve) =>
              setTimeout(resolve, gapTime * scraperIndex)
            );

            let scrapedPaperEntity: PaperEntity;
            try {
              const toBeScrapedPaperEntity = new PaperEntity(false);
              toBeScrapedPaperEntity.initialize(paperEntityDraft);
              scrapedPaperEntity = await scraperObj.scrape(
                toBeScrapedPaperEntity,
                force
              );
            } catch (error) {
              errors.push(error as Error);
              scrapedPaperEntity = paperEntityDraft;
            }
            resolve({
              scrapedPaperEntity,
              scraper,
              scraperIndex,
            });
          });
        });
      }

      q.on(
        "success",
        function (
          result: {
            scrapedPaperEntity: PaperEntity;
            scraper: string;
            scraperIndex: number;
          },
          job
        ) {
          const scrapedPaperEntity = result.scrapedPaperEntity;
          const { breakable, mustwait } = scraperProps.get(result.scraper)!;
          const scraperIndex = result.scraperIndex;
          const merged = mergeMetadata(
            originPaperEntityDraft,
            paperEntityDraft,
            scrapedPaperEntity,
            mergePriorityLevel,
            scraperIndex + priority_offset
          );
          paperEntityDraft = merged.paperEntityDraft;
          mergePriorityLevel = merged.mergePriorityLevel;

          if (mustwait) {
            mustwaitN -= 1;
          }

          if (
            breakable &&
            isMetadataCompleted(paperEntityDraft) &&
            mustwaitN === 0
          ) {
            q.end();
          }
        }
      );

      q.on("end", function (err) {
        if (err) {
          errors.push(err);
        }
        resolve({
          paperEntityDraft,
          errors,
        });
      });

      q.on("timeout", function (next, job) {
        next();
      });

      q.start(function (err) {
        if (err) {
          errors.push(err);
        }
        resolve({
          paperEntityDraft,
          errors,
        });
      });
    });
  }
}
