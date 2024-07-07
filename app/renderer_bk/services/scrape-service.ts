import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Process } from "@/base/process-id";
import { ILogService, LogService } from "@/common/services/log-service";
import { PaperEntity } from "@/models/paper-entity";
import { HookService, IHookService } from "@/renderer/services/hook-service";
import { ProcessingKey, processing } from "@/renderer/services/uistate-service";
import { IPaperEntityCollection } from "@/repositories/db-repository/paper-entity-repository";

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
  constructor(
    @IHookService private readonly _hookService: HookService,
    @ILogService private readonly _logService: LogService
  ) {
    super("scrapeService", {});
  }

  private async _scrapeExtensionReady() {
    const extensionAPIExposed = await rendererRPCService.waitForAPI(
      Process.extension,
      "PLExtAPI",
      5000
    );

    if (!extensionAPIExposed) {
      this._logService.warn(
        "Official scrape extension is not installed yet.",
        "",
        true,
        "ScrapeService"
      );
    } else {
      let status =
        await PLExtAPI.extensionManagementService.isOfficialScrapeExtensionInstalled();

      if (status === "loaded") {
        return true;
      } else if (status === "unloaded") {
        for (let i = 0; i < 15; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          status =
            await PLExtAPI.extensionManagementService.isOfficialScrapeExtensionInstalled();

          if (status === "loaded") {
            break;
          }
        }
      }

      if (status !== "loaded") {
        this._logService.warn(
          "Official scrape extension is not installed yet.",
          "",
          true,
          "ScrapeService"
        );
      }
    }
  }

  /**
   * Scrape a data source's metadata.
   * @param payloads - data source payloads.
   * @param specificScrapers - list of metadata scrapers.
   * @param force - force scraping metadata.
   * @returns List of paper entities. */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to scrape data source.", true, "ScrapeService", [])
  async scrape(
    payloads: any[],
    specificScrapers: string[],
    force: boolean = false
  ): Promise<PaperEntity[]> {
    // 0. Wait for scraper extension to be ready.
    await this._scrapeExtensionReady();

    // Do in chunks 10
    const jobID = Math.random().toString(36).substring(7);
    const results: PaperEntity[] = [];
    for (let i = 0; i < payloads.length; i += 10) {
      if (payloads.length >= 20) {
        this._logService.progress(
          `Processing ${i} / ${payloads.length}...`,
          (i / payloads.length) * 100,
          true,
          "ScrapeService",
          jobID
        );
      }
      try {
        let payloadChunk = payloads.slice(i, i + 10);

        // 1. Entry scraper transforms data source payloads into a PaperEntity list.
        const paperEntityDrafts = await this.scrapeEntry(payloadChunk);

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

        results.push(...scrapedPaperEntityDrafts);
      } catch (e) {
        this._logService.error(
          "Failed to scrape data source.",
          `${(e as Error).message} ${(e as Error).stack}`,
          true,
          "ScrapeService"
        );
      }
    }

    if (payloads.length >= 20) {
      this._logService.progress(`Done!`, 100, true, "ScrapeService", jobID);
    }

    return results;
  }

  /**
   * Scrape all entry scrapers to transform data source payloads into a PaperEntity list.
   * @param payloads - data source payloads.
   * @returns List of paper entities. */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to scrape entry.", true, "ScrapeService", [])
  async scrapeEntry(payloads: any[]) {
    // TODO: test performance of this._hookService.hookPoint
    if (this._hookService.hasHook("beforeScrapeEntry")) {
      [payloads] = await this._hookService.modifyHookPoint(
        "beforeScrapeEntry",
        5000,
        payloads
      );
    }

    let paperEntityDrafts: PaperEntity[] = [];
    if (this._hookService.hasHook("scrapeEntry")) {
      paperEntityDrafts = (
        await this._hookService.transformhookPoint<any[], Object[]>(
          "scrapeEntry",
          600000, // 10 min
          payloads
        )
      ).map((p) => {
        return new PaperEntity(p);
      });
    }

    if (this._hookService.hasHook("afterScrapeEntry")) {
      [paperEntityDrafts] = await this._hookService.modifyHookPoint(
        "afterScrapeEntry",
        5000,
        paperEntityDrafts
      );
      paperEntityDrafts = paperEntityDrafts.map((p) => {
        return new PaperEntity(p);
      });
    }

    return paperEntityDrafts;
  }

  /**
   * Scrape all metadata scrapers to complete the metadata of PaperEntitys.
   * @param paperEntityDrafts - list of paper entities.
   * @param scrapers - list of metadata scrapers.
   * @param force - force scraping metadata.
   * @returns List of paper entities. */
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
          5000,
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
          60000,
          paperEntityDrafts,
          scrapers,
          force
        );
    }

    if (this._hookService.hasHook("afterScrapeMetadata")) {
      [scrapedPaperEntityDrafts, scrapers, force] =
        await this._hookService.modifyHookPoint(
          "afterScrapeMetadata",
          5000,
          scrapedPaperEntityDrafts,
          scrapers,
          force
        );
    }

    return scrapedPaperEntityDrafts;
  }

  /**
   * Scrape a data source's metadata.
   * @param payloads - data source payloads.
   * @returns List of paper entities' candidates. */
  @processing(ProcessingKey.General)
  @errorcatching(
    "Failed to fuzzily scrape data source.",
    true,
    "ScrapeService",
    []
  )
  async fuzzyScrape(
    paperEntities: IPaperEntityCollection
  ): Promise<Record<string, PaperEntity[]>> {
    // 0. Wait for scraper extension to be ready.
    await this._scrapeExtensionReady();

    // Do in chunks 10
    const jobID = Math.random().toString(36).substring(7);
    const results: Record<string, PaperEntity[]> = {};
    for (let i = 0; i < paperEntities.length; i += 10) {
      if (paperEntities.length >= 20) {
        this._logService.progress(
          `Processing ${i} / ${paperEntities.length}...`,
          (i / paperEntities.length) * 100,
          true,
          "ScrapeService",
          jobID
        );
      }
      try {
        let paperEntityChunk = paperEntities.slice(i, i + 10);

        const paperEntityDraftCandidates = await this._fuzzyScrape(
          paperEntityChunk
        );

        paperEntityChunk.forEach((p, index) => {
          results[`${p._id}`] = paperEntityDraftCandidates[index];
        });
      } catch (e) {
        this._logService.error(
          "Failed to fuzzily scrape data source.",
          `${(e as Error).message} ${(e as Error).stack}`,
          true,
          "ScrapeService"
        );
      }
    }

    if (paperEntities.length >= 20) {
      this._logService.progress(`Done!`, 100, true, "ScrapeService", jobID);
    }

    return results;
  }

  /**
   * Scrape all entry scrapers to transform data source payloads into a PaperEntity list.
   * @param payloads - data source payloads.
   * @returns List of paper entities. */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to scrape entry.", true, "ScrapeService", [])
  async _fuzzyScrape(
    paperEntities: IPaperEntityCollection
  ): Promise<PaperEntity[][]> {
    if (this._hookService.hasHook("beforeFuzzyScrape")) {
      [paperEntities] = await this._hookService.modifyHookPoint(
        "beforeFuzzyScrape",
        5000,
        paperEntities
      );
    }

    let paperEntityDraftCandidates: PaperEntity[][] = [];
    if (this._hookService.hasHook("fuzzyScrapeMetadata")) {
      paperEntityDraftCandidates = await this._hookService.transformhookPoint<
        any[],
        Object[]
      >(
        "fuzzyScrapeMetadata",
        600000, // 10 min
        paperEntities
      );
      paperEntityDraftCandidates.forEach((p) => {
        return p.map((p) => {
          return new PaperEntity(p);
        });
      });
    }

    if (this._hookService.hasHook("afterScrapeEntry")) {
      [paperEntityDraftCandidates] = await this._hookService.modifyHookPoint(
        "afterScrapeEntry",
        5000,
        paperEntityDraftCandidates
      );

      paperEntityDraftCandidates.forEach((p) => {
        return p.map((p) => {
          return new PaperEntity(p);
        });
      });
    }

    return paperEntityDraftCandidates;
  }
}
