import { chunkRun } from "@/base/chunk";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { isMetadataCompleted } from "@/base/metadata";
import { PaperEntity } from "@/models/paper-entity";
import { ILogService, LogService } from "@/renderer/services/log-service";
import {
  IPreferenceService,
  IScraperPreference,
  PreferenceService,
} from "@/renderer/services/preference-service";
import { EntryScraperRepository } from "@/repositories/scraper-repository/entry-scrapers/entry-scraper-repository";
import { MetadataScraperRepository } from "@/repositories/scraper-repository/metadata-scraper/metadata-scraper-repository";

import { ProcessingKey, processing } from "./state-service/processing";

export const IScrapeService = createDecorator("scrapeService");

/**
 * ScrapeService transforms a data source, such as a local file, web page, etc., into a PaperEntity with fullfilled metadata.
 *
 * Scrapers can be categorized into two types:
 *   1. Entry scraper: transforms a data source into a PaperEntity
 *   2. Metadata scraper: fullfill the metadata of a PaperEntity into
 *
 * Scraping pipeline:
 * | ----------------
 * | 1. Entry scraper transforms a data source, such as the following object, into a PaperEntity.
 * |     payload { // processed by different entry scrapers
 * |     . url: string  // an example payload consists of a url
 * |     }
 * |     NOTE: Entry scrapers also support type of "PaperEntity", which is a bypass for extensions
 * |           to parse a data source in themselve and get the metadata from here.
 * | ----------------
 * | 2. Metadata scraper fullfills the metadata of a PaperEntity.
 * | ----------------
 */
export class ScrapeService extends Eventable<{}> {
  private readonly _entryScraperRepository: EntryScraperRepository;
  private readonly _metadataScraperRepository: MetadataScraperRepository;
  // TODO: deperacated custom scraper

  constructor(
    @IPreferenceService private readonly _preferenceService: PreferenceService,
    @ILogService private readonly _logService: LogService
  ) {
    super("scrapeService", {});

    this._entryScraperRepository = new EntryScraperRepository();
    this._metadataScraperRepository = new MetadataScraperRepository();
  }

  @processing(ProcessingKey.General)
  async scrape(
    payloads: any[],
    specificScrapers: string[],
    force: boolean = false
  ): Promise<PaperEntity[]> {
    // 1. Entry scraper transforms data source payloads into a PaperEntity list.
    // TODO: check all promise.all and chunkRun
    const { results: _paperEntityDrafts, errors: entryScraperErrors } =
      await chunkRun<PaperEntity[], null>(
        payloads,
        async (payload): Promise<PaperEntity[]> => {
          return await this._entryScraperRepository.scrape([payload]);
        }
      );
    const paperEntityDrafts = _paperEntityDrafts
      .flat()
      .filter((p) => p) as PaperEntity[];
    for (const error of entryScraperErrors) {
      // TODO: check all logService call ID.
      this._logService.error(
        "Failed to transform data source into PaperEntity.",
        error,
        true,
        "ScrapeService"
      );
    }

    if (paperEntityDrafts.length === 0) {
      this._logService.warn(
        "The data source yields no PaperEntity.",
        "",
        true,
        "ScrapeService"
      );
      return [];
    }

    // TODO merge duplicated paperEntityDrafts

    // 2. Metadata scraper fullfills the metadata of PaperEntitys.
    // 2.0 Get enabled scrapers
    const scraperPref = this._preferenceService.get("scrapers") as Record<
      string,
      IScraperPreference
    >;
    let scrapers: string[] = [];
    for (const [name, pref] of Object.entries(scraperPref)) {
      if (pref.enable) {
        scrapers.push(name);
      }
    }

    scrapers = specificScrapers.length > 0 ? specificScrapers : scrapers;

    // TODO: only scrape unfullfilled metadata
    const {
      results: _scrapedPaperEntityDrafts,
      errors: metadataScraperErrors,
    } = await chunkRun<PaperEntity, PaperEntity>(
      paperEntityDrafts,
      async (paperEntityDraft): Promise<PaperEntity> => {
        const paperEntityDraftAndErrors =
          await this._metadataScraperRepository.scrapePMS(
            paperEntityDraft,
            scrapers,
            force
          );
        paperEntityDraft = paperEntityDraftAndErrors.paperEntityDraft;

        if (paperEntityDraftAndErrors.errors.length > 0) {
          this._logService.error(
            "Paperlib metadata service failed.",
            paperEntityDraftAndErrors.errors[0],
            true,
            "ScrapeService"
          );
        }

        if (!isMetadataCompleted(paperEntityDraft)) {
          // 2.2 Run some force-clientside scrapers such as Google Scholar
          const paperEntityDraftAndErrors =
            await this._metadataScraperRepository.scrapeClientside(
              paperEntityDraft,
              scrapers,
              force
            );
          paperEntityDraft = paperEntityDraftAndErrors.paperEntityDraft;

          if (paperEntityDraftAndErrors.errors.length > 0) {
            for (const error of paperEntityDraftAndErrors.errors) {
              this._logService.error(
                "Clientside metadata service failed.",
                error,
                true,
                "ScrapeService"
              );
            }
          }
        }

        return paperEntityDraft;
      },
      async (paperEntityDraft): Promise<PaperEntity> => {
        return paperEntityDraft;
      }
    );
    const scrapedPaperEntityDrafts = _scrapedPaperEntityDrafts.flat();

    for (const error of metadataScraperErrors) {
      this._logService.error(
        "Failed to scrape metadata of Paper.",
        error,
        true,
        "ScrapeService"
      );
    }

    return scrapedPaperEntityDrafts;
  }
}
