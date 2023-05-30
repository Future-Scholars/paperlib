import got from "got";
import queue from "queue";
import { watch } from "vue";

import { PaperEntity } from "@/models/paper-entity";
import { Preference, ScraperPreference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { isMetadataCompleted, mergeMetadata } from "@/utils/metadata";

import { AdsabsScraper } from "./scrapers/adsabs";
import { ArXivScraper } from "./scrapers/arxiv";
import {
  ChemRxivFuzzyScraper,
  ChemRxivPreciseScraper,
} from "./scrapers/chemrxiv";
import { CitationCountScraper } from "./scrapers/citation-count";
import { CrossRefScraper } from "./scrapers/crossref";
import { CustomScraper } from "./scrapers/custom";
import { DBLPScraper } from "./scrapers/dblp";
import { DOIScraper } from "./scrapers/doi";
import { GoogleScholarScraper } from "./scrapers/google-scholar";
import { IEEEScraper } from "./scrapers/ieee";
import { OpenreviewScraper } from "./scrapers/openreview";
import { PaperlibMetadataServiceScraper } from "./scrapers/paperlib-metadata";
import { PwCScraper } from "./scrapers/paperwithcode";
import { PDFScraper } from "./scrapers/pdf";
import { PubMedScraper } from "./scrapers/pubmed";
import { ScopusScraper } from "./scrapers/scopus";
import { Scraper } from "./scrapers/scraper";
import { SemanticScholarScraper } from "./scrapers/semanticscholar";
import { SPIEScraper } from "./scrapers/spie";
import { SpringerScraper } from "./scrapers/springer";

// ========== Scraper Repository ============ //
//
// ------------------------------- (File Inner Scrapers)
// | PDF scraper
// -------------------------------
//    v
//    v
// ------------------------------- (PaperlibMetadataService first)
// | PaperlibMetadataServiceScraper  (default)
// -------------------------------
//    v
//    v
// ------------------------------- (Local Scrapers, if PaperlibMetadataService failed)
// |
// | PreciseScrapers (by some ids, e.g. DOI, arXiv, ChemRxiv)
// |  v
// | FuzzyScrapers (by title, e.g. DBLP, Semantic Scholar)
// |  v
// | AdditionalScrapers (e.g., paper with code)
// |
// -------------------------------
//   v
//   v
// ------------------------------- (Custom Scrapers)
// | ...
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
  ["ieee", { breakable: true, mustwait: false }],
]);

const ADDITIONAL_SCRAPERS = new Map([
  ["pwc", { breakable: false, mustwait: true }],
]);

const BUILTIN_SCRAPERS = new Map([
  ...PRECISE_SCRAPERS,
  ...FUZZY_SCRAPERS,
  ...ADDITIONAL_SCRAPERS,
]);

const SCRAPER_OBJS = new Map<string, typeof Scraper>([
  ["pdf", PDFScraper],
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
]);

const CLIENTSIDE_SCRAPER_OBJS = new Map<string, typeof Scraper | CustomScraper>(
  [["googlescholar", GoogleScholarScraper]]
);

export class ScraperRepository {
  stateStore: MainRendererStateStore;
  preference: Preference;

  // Enabled scrapers
  fileScraperList: Array<string>;
  builtinScraperList: Array<string>;
  clientsideScraperList: Array<string>;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;

    // TODO: currently only support pdf.
    // Should make scraper repo support multiple files processing before enable bibtex.
    this.fileScraperList = ["pdf", "bibtex"];
    this.builtinScraperList = [];
    this.clientsideScraperList = [];

    this.initScrapers();

    void got("https://api.paperlib.app/version");

    watch(
      () => this.stateStore.viewState.scraperReinited,
      () => {
        this.initScrapers();
      }
    );
  }

  async initScrapers() {
    this.builtinScraperList = [];
    this.clientsideScraperList = [];

    const scraperPrefs = this.preference.get("scrapers") as Record<
      string,
      ScraperPreference
    >;

    const sortedScraperPrefs = [];
    for (const [name, scraperPref] of Object.entries(scraperPrefs)) {
      if (scraperPref.enable) {
        sortedScraperPrefs.push(scraperPref);
      }
    }
    sortedScraperPrefs.sort((a, b) => b.priority - a.priority);

    for (const scraperPref of sortedScraperPrefs) {
      if (scraperPref.enable) {
        if (BUILTIN_SCRAPERS.has(scraperPref.name)) {
          this.builtinScraperList.push(scraperPref.name);
        } else if (scraperPref.custom) {
          this.clientsideScraperList.push(scraperPref.name);
          const customScraperObj = new CustomScraper(scraperPref.name);
          CLIENTSIDE_SCRAPER_OBJS.set(scraperPref.name, customScraperObj);
        } else if (scraperPref.name === "googlescholar") {
          this.clientsideScraperList.push(scraperPref.name);
        }
      }
    }
  }

  async scrape(
    paperEntityDraft: PaperEntity,
    specificScraperList: Array<string> = [],
    force: boolean = false
  ): Promise<PaperEntity> {
    // 0. Get enabeled scraper list
    const enabeledFileScraperList =
      specificScraperList.length > 0
        ? specificScraperList.filter((name) =>
            this.fileScraperList.includes(name)
          )
        : this.fileScraperList;

    const enabeledBuiltinScraperList =
      specificScraperList.length > 0
        ? specificScraperList.filter((name) =>
            this.builtinScraperList.includes(name)
          )
        : this.builtinScraperList;

    const enabeledClientsideScraperList =
      specificScraperList.length > 0
        ? specificScraperList.filter((name) =>
            this.clientsideScraperList.includes(name)
          )
        : this.clientsideScraperList;

    // 1. Scrape from file inner metadata
    window.logger.info(
      "Scraping metadata from file(s) ...",
      "",
      true,
      "Scraper"
    );
    paperEntityDraft = await this._scrapeFile(
      paperEntityDraft,
      enabeledFileScraperList,
      force
    );

    // 2. Scrape from default Paperlib metadata service
    window.logger.info("Paperlib Metadata service ...", "", true, "Scraper");
    let paperlibMetadataServiceSuccess = false;
    try {
      paperEntityDraft = await PaperlibMetadataServiceScraper.scrape(
        paperEntityDraft,
        ["cache"].concat(enabeledBuiltinScraperList),
        force
      );
      paperlibMetadataServiceSuccess = true;
    } catch (error) {
      console.error(error);
      paperlibMetadataServiceSuccess = false;
      window.logger.error(
        "Paperlib Metadata service error",
        error as Error,
        true,
        "Scraper"
      );
    }

    // 3. Scrape from client-side scrapers as backup if Paperlib metadata failed.
    if (!paperlibMetadataServiceSuccess) {
      paperEntityDraft = await this._scrapePrecise(
        paperEntityDraft,
        enabeledBuiltinScraperList,
        force
      );

      if (!isMetadataCompleted(paperEntityDraft)) {
        paperEntityDraft = await this._scrapeFuzzy(
          paperEntityDraft,
          enabeledBuiltinScraperList,
          force
        );
      }
      paperEntityDraft = await this._scrapeAdditional(
        paperEntityDraft,
        enabeledBuiltinScraperList,
        force
      );
    }

    // // 4. Scrape from custom scrapers and other client-side scrapers
    paperEntityDraft = await this._scrapeClientside(
      paperEntityDraft,
      enabeledClientsideScraperList
    );

    return paperEntityDraft;
  }

  async _scrapeFile(
    paperEntityDraft: PaperEntity,
    scrapers: string[],
    force: boolean = false
  ): Promise<PaperEntity> {
    for (const scraper of scrapers) {
      if (SCRAPER_OBJS.has(scraper)) {
        paperEntityDraft = await (
          SCRAPER_OBJS.get(scraper) as typeof Scraper
        ).scrape(paperEntityDraft, force);
      }
    }
    return paperEntityDraft;
  }

  async _scrapePrecise(
    paperEntityDraft: PaperEntity,
    scrapers: string[],
    force: boolean = false
  ): Promise<PaperEntity> {
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
  ): Promise<PaperEntity> {
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
  ): Promise<PaperEntity> {
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
  ): Promise<PaperEntity> {
    for (const scraperName of scrapers) {
      const scraper = CLIENTSIDE_SCRAPER_OBJS.get(scraperName);
      if (scraper) {
        paperEntityDraft = await scraper.scrape(paperEntityDraft, force);
      }
    }

    return paperEntityDraft;
  }

  async _scrapePipeline(
    paperEntityDraft: PaperEntity,
    enabledScrapers: string[],
    scraperProps: Map<string, { breakable: boolean; mustwait: boolean }>,
    gapTime = 0,
    priority_offset = 0,
    force: boolean = false
  ): Promise<PaperEntity> {
    const stateStore = this.stateStore;
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
              window.logger.info(
                `Scraping metadata from [${scraper}] ...`,
                "",
                true,
                "Scraper"
              );
              const toBeScrapedPaperEntity = new PaperEntity(false);
              toBeScrapedPaperEntity.initialize(paperEntityDraft);
              scrapedPaperEntity = await scraperObj.scrape(
                toBeScrapedPaperEntity,
                force
              );
            } catch (error) {
              if (error) {
                window.logger.error(
                  `Scraper [${scraper}] error`,
                  `${error}`,
                  true,
                  "Scraper"
                );
              }
              scrapedPaperEntity = paperEntityDraft;
            }
            resolve({ scrapedPaperEntity, scraper, scraperIndex });
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
          console.error(err);
        }
        resolve(paperEntityDraft);
      });

      q.on("timeout", function (next, job) {
        next();
      });

      q.start(function (err) {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(paperEntityDraft);
        }
      });
    });
  }

  async scrapeFrom(
    paperEntityDraft: PaperEntity,
    scraperName: string
  ): Promise<PaperEntity> {
    const scraperList = [scraperName];
    return this.scrape(paperEntityDraft, scraperList, true);
  }

  async scrapeCitationCount(
    paperEntityDraft: PaperEntity
  ): Promise<
    Record<
      "semanticscholarId" | "citationCount" | "influentialCitationCount",
      string
    >
  > {
    try {
      const citationCount = await CitationCountScraper.scrape(paperEntityDraft);
      return citationCount as Record<string, string>;
    } catch (error) {
      return {
        semanticscholarId: "",
        citationCount: "N/A",
        influentialCitationCount: "N/A",
      };
    }
  }
}
