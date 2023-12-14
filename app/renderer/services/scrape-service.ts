import { chunkRun } from "@/base/chunk";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { isMetadataCompleted } from "@/base/metadata";
import {
  IPreferenceService,
  IScraperPreference,
  PreferenceService,
} from "@/common/services/preference-service";
import { PaperEntity } from "@/models/paper-entity";
import { HookService, IHookService } from "@/renderer/services/hook-service";
import { ILogService, LogService } from "@/renderer/services/log-service";
import { ProcessingKey, processing } from "@/renderer/services/uistate-service";
import { EntryScraperRepository } from "@/repositories/scraper-repository/entry-scrapers/entry-scraper-repository";
import { MetadataScraperRepository } from "@/repositories/scraper-repository/metadata-scraper/metadata-scraper-repository";

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
  // private readonly _entryScraperRepository: EntryScraperRepository;
  // private readonly _metadataScraperRepository: MetadataScraperRepository;
  // // TODO: deperacated custom scraper

  constructor(
    @IHookService private readonly _hookService: HookService,
    @IPreferenceService private readonly _preferenceService: PreferenceService,
    @ILogService private readonly _logService: LogService
  ) {
    super("scrapeService", {});
  }

  @processing(ProcessingKey.General)
  async scrape(
    payloads: any[],
    specificScrapers: string[],
    force: boolean = false
  ): Promise<PaperEntity[]> {
    // 1. Entry scraper transforms data source payloads into a PaperEntity list.
    const paperEntityDrafts = await this.scrapeEntry(payloads);

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
    // Get enabled scrapers
    let scrapers: string[] = [];
    if (specificScrapers.length > 0) {
      scrapers = specificScrapers;
    } else {
      const scraperPref = this._preferenceService.get("scrapers") as Record<
        string,
        IScraperPreference
      >;
      for (const [name, pref] of Object.entries(scraperPref)) {
        if (pref.enable) {
          scrapers.push(name);
        }
      }
    }

    const scrapedPaperEntityDrafts = await this.scrapePMS(
      paperEntityDrafts,
      scrapers,
      force
    );

    return scrapedPaperEntityDrafts;
  }

  /**
   * Scrape all entry scrapers to transform data source payloads into a PaperEntity list.
   * @param payloads - data source payloads.
   * @returns - list of paper entities. */
  async scrapeEntry(payloads: any[]) {
    // TODO: test performance of this._hookService.hookPoint
    if (this._hookService.hasHook("beforeScrapeEntry")) {
      [payloads] = await this._hookService.modifyHookPoint(
        "beforeScrapeEntry",
        payloads
      );
    }

    // // TODO: check all promise.all and chunkRun
    // const { results: _paperEntityDrafts, errors: entryScraperErrors } =
    //   await chunkRun<PaperEntity[], null>(
    //     payloads,
    //     async (payload): Promise<PaperEntity[]> => {
    //       return await this._entryScraperRepository.scrape([payload]);
    //     }
    //   );
    // let paperEntityDrafts = _paperEntityDrafts
    //   .flat()
    //   .filter((p) => p) as PaperEntity[];

    // for (const error of entryScraperErrors) {
    //   // TODO: check all logService call ID.
    //   this._logService.error(
    //     "Failed to transform data source into PaperEntity.",
    //     error,
    //     true,
    //     "ScrapeService"
    //   );
    // }

    let paperEntityDrafts: PaperEntity[] = [];
    if (this._hookService.hasHook("scrapeEntry")) {
      paperEntityDrafts = (
        await this._hookService.transformhookPoint<any[], Object[]>(
          "scrapeEntry",
          payloads
        )
      ).map((p) => {
        return new PaperEntity(false).initialize(p);
      });
    }

    if (this._hookService.hasHook("afterScrapeEntry")) {
      [paperEntityDrafts] = await this._hookService.modifyHookPoint(
        "afterScrapeEntry",
        paperEntityDrafts
      );
      paperEntityDrafts = paperEntityDrafts.map((p) => {
        return new PaperEntity().initialize(p);
      });
    }

    return paperEntityDrafts;
  }

  /**
   * Scrape all metadata scrapers to fullfill the metadata of PaperEntitys.
   * @param paperEntityDrafts - list of paper entities.
   * @param scrapers - list of metadata scrapers.
   * @param force - force scraping metadata.
   * @returns - list of paper entities. */
  async scrapePMS(
    paperEntityDrafts: PaperEntity[],
    scrapers: string[],
    force: boolean = false
  ) {
    if (this._hookService.hasHook("beforeScrapeMetadata")) {
      [paperEntityDrafts, scrapers, force] =
        await this._hookService.modifyHookPoint(
          "beforeScrapeMetadata",
          paperEntityDrafts,
          scrapers,
          force
        );
    }

    // TODO: only scrape unfullfilled metadata
    // const {
    //   results: _scrapedPaperEntityDrafts,
    //   errors: metadataScraperErrors,
    // } = await chunkRun<PaperEntity, PaperEntity>(
    //   paperEntityDrafts,
    //   async (paperEntityDraft): Promise<PaperEntity> => {
    //     const paperEntityDraftAndErrors =
    //       await this._metadataScraperRepository.scrapePMS(
    //         paperEntityDraft,
    //         scrapers,
    //         force
    //       );
    //     paperEntityDraft = paperEntityDraftAndErrors.paperEntityDraft;

    //     if (paperEntityDraftAndErrors.errors.length > 0) {
    //       this._logService.error(
    //         "Paperlib metadata service failed.",
    //         paperEntityDraftAndErrors.errors[0],
    //         true,
    //         "ScrapeService"
    //       );
    //     }

    //     if (!isMetadataCompleted(paperEntityDraft)) {
    //       // 2.2 Run some force-clientside scrapers such as Google Scholar
    //       const paperEntityDraftAndErrors =
    //         await this._metadataScraperRepository.scrapeClientside(
    //           paperEntityDraft,
    //           scrapers,
    //           force
    //         );
    //       paperEntityDraft = paperEntityDraftAndErrors.paperEntityDraft;

    //       if (paperEntityDraftAndErrors.errors.length > 0) {
    //         for (const error of paperEntityDraftAndErrors.errors) {
    //           this._logService.error(
    //             "Clientside metadata service failed.",
    //             error,
    //             true,
    //             "ScrapeService"
    //           );
    //         }
    //       }
    //     }

    //     return paperEntityDraft;
    //   },
    //   async (paperEntityDraft): Promise<PaperEntity> => {
    //     return paperEntityDraft;
    //   }
    // );

    // for (const error of metadataScraperErrors) {
    //   this._logService.error(
    //     "Failed to scrape metadata of Paper.",
    //     error,
    //     true,
    //     "ScrapeService"
    //   );
    // }
    // let scrapedPaperEntityDrafts = _scrapedPaperEntityDrafts.flat();

    let scrapedPaperEntityDrafts = paperEntityDrafts;
    if (this._hookService.hasHook("scrapeMetadata")) {
      [scrapedPaperEntityDrafts, scrapers, force] =
        await this._hookService.modifyHookPoint(
          "scrapeMetadata",
          paperEntityDrafts,
          scrapers,
          force
        );
    }

    if (this._hookService.hasHook("afterScrapeMetadata")) {
      [scrapedPaperEntityDrafts, scrapers, force] =
        await this._hookService.modifyHookPoint(
          "afterScrapeMetadata",
          scrapedPaperEntityDrafts,
          scrapers,
          force
        );
    }

    return scrapedPaperEntityDrafts;
  }
}
