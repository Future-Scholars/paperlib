import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { PaperEntity } from "@/models/paper-entity";
import { HookService, IHookService } from "@/renderer/services/hook-service";
import { ILogService, LogService } from "@/renderer/services/log-service";
import { ProcessingKey, processing } from "@/renderer/services/uistate-service";

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
  // TODO: deperacated custom scraper, we alert this in 2.2.9 version

  constructor(
    @IHookService private readonly _hookService: HookService,
    @ILogService private readonly _logService: LogService
  ) {
    super("scrapeService", {});
  }

  /**
   * Scrape a data source's metadata.
   * @param payloads - data source payloads.
   * @param specificScrapers - list of metadata scrapers.
   * @param force - force scraping metadata.
   * @returns - list of paper entities. */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to scrape data source.", true, "ScrapeService", [])
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

    // ENHANCE: merge duplicated paperEntityDrafts?

    // 2. Metadata scraper fullfills the metadata of PaperEntitys.
    const scrapedPaperEntityDrafts = await this.scrapeMetadata(
      paperEntityDrafts,
      specificScrapers,
      force
    );

    return scrapedPaperEntityDrafts;
  }

  /**
   * Scrape all entry scrapers to transform data source payloads into a PaperEntity list.
   * @param payloads - data source payloads.
   * @returns - list of paper entities. */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to scrape entry.", true, "ScrapeService", [])
  async scrapeEntry(payloads: any[]) {
    // TODO: test performance of this._hookService.hookPoint
    if (this._hookService.hasHook("beforeScrapeEntry")) {
      [payloads] = await this._hookService.modifyHookPoint(
        "beforeScrapeEntry",
        payloads
      );
    }

    let paperEntityDrafts: PaperEntity[] = [];
    if (this._hookService.hasHook("scrapeEntry")) {
      paperEntityDrafts = (
        await this._hookService.transformhookPoint<any[], Object[]>(
          "scrapeEntry",
          payloads
        )
      ).map((p) => {
        return new PaperEntity(p);
      });
    }

    if (this._hookService.hasHook("afterScrapeEntry")) {
      [paperEntityDrafts] = await this._hookService.modifyHookPoint(
        "afterScrapeEntry",
        paperEntityDrafts
      );
      paperEntityDrafts = paperEntityDrafts.map((p) => {
        return new PaperEntity(p);
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
  @processing(ProcessingKey.General)
  @errorcatching("Failed to scrape metadata.", true, "ScrapeService", [])
  async scrapeMetadata(
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
