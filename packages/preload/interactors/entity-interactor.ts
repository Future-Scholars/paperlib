import { clipboard } from "electron";
import path from "path";
import { ToadScheduler, SimpleIntervalJob, Task } from "toad-scheduler";

import { SharedState } from "../utils/appstate";
import { Preference } from "../utils/preference";

import { DBRepository } from "../repositories/db-repository/db-repository";
import { ScraperRepository } from "../repositories/scraper-repository/scraper-repository";
import { FileRepository } from "../repositories/file-repository/file-repository";
import { CacheRepository } from "../repositories/cache-repository/cache-repository";
import { ExporterRepository } from "../repositories/exporter-repository/exporter-repository";

import { Categorizers } from "../models/PaperCategorizer";
import { PaperEntityDraft } from "../models/PaperEntityDraft";

export class EntityInteractor {
  sharedState: SharedState;
  preference: Preference;

  dbRepository: DBRepository;
  fileRepository: FileRepository;
  scraperRepository: ScraperRepository;
  cacheRepository: CacheRepository;
  exporterRepository: ExporterRepository;

  scheduler: ToadScheduler;

  constructor(
    sharedState: SharedState,
    preference: Preference,
    dbRepository: DBRepository,
    fileRepository: FileRepository,
    scraperRepository: ScraperRepository,
    cacheRepository: CacheRepository,
    exporterRepository: ExporterRepository
  ) {
    this.sharedState = sharedState;
    this.preference = preference;

    this.dbRepository = dbRepository;
    this.fileRepository = fileRepository;
    this.scraperRepository = scraperRepository;
    this.cacheRepository = cacheRepository;
    this.exporterRepository = exporterRepository;

    this.scheduler = new ToadScheduler();
    this.setupRoutineScrapeScheduler();
  }

  // ============================================================
  // Read
  async loadEntities(
    search: string,
    flag: boolean,
    tag: string,
    folder: string,
    sortBy: string,
    sortOrder: string
  ) {
    let entities = await this.dbRepository.entities(
      search,
      flag,
      tag,
      folder,
      sortBy,
      sortOrder
    );
    if (this.sharedState.viewState.searchMode.get() === "fulltext" && search) {
      entities = await this.cacheRepository.fullTextFilter(search, entities);
    }

    return entities;
  }

  async loadCategorizers(categorizerType: Categorizers) {
    return await this.dbRepository.categorizers(categorizerType);
  }

  // ============================================================
  // Create
  async add(urlList: string[]) {
    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) +
        urlList.length
    );

    try {
      // 1. Metadata scraping.
      const scrapingPromise = async (url: string) => {
        let entityDraft = new PaperEntityDraft(true);
        entityDraft.setValue("mainURL", url);
        entityDraft = await this.scraperRepository.scrape(entityDraft);
        return entityDraft;
      };

      let entityDrafts = await Promise.all(
        urlList.map((url) => scrapingPromise(url))
      );

      // 2. File moving.
      entityDrafts = (await Promise.all(
        entityDrafts.map((entityDraft) => this.fileRepository.move(entityDraft))
      )) as PaperEntityDraft[];
      entityDrafts = entityDrafts.filter((entityDraft) => entityDraft !== null);

      // 3. DB insertion.
      const dbSuccesses = await this.dbRepository.update(entityDrafts);
      // - find unsuccessful entities.
      const unsuccessfulEntityDrafts = entityDrafts.filter(
        (_entityDraft, index) => !dbSuccesses[index]
      );
      // - remove files of unsuccessful entities.
      await Promise.all(
        unsuccessfulEntityDrafts.map((entityDraft) =>
          this.fileRepository.remove(entityDraft)
        )
      );
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Add failed: ${error as string}`
      );
    }

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) -
        urlList.length
    );
  }

  // ============================================================
  // Delete
  async delete(ids: string[]) {
    try {
      const removeFileURLs = await this.dbRepository.remove(ids);
      await Promise.all(
        removeFileURLs.map((url) => this.fileRepository.removeFile(url))
      );
      void this.cacheRepository.remove(ids);
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Delete failed: ${error as string}`
      );
    }
  }

  deleteCategorizer(categorizerName: string, categorizerType: Categorizers) {
    void this.dbRepository.deleteCategorizers(categorizerName, categorizerType);
  }

  deleteSup(entityStr: string, url: string) {
    const entity = JSON.parse(entityStr) as PaperEntityDraft;

    try {
      void this.fileRepository.removeFile(url);
      entity.supURLs = entity.supURLs.filter(
        (supUrl) => supUrl !== path.basename(url)
      );
      void this.dbRepository.update([entity]);
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Delete failed: ${error as string}`
      );
    }
  }

  // ============================================================
  // Update
  async scrape(entitiesStr: string) {
    let entityDrafts = JSON.parse(entitiesStr) as PaperEntityDraft[];
    entityDrafts = entityDrafts.map((entityDraft) => {
      const draft = new PaperEntityDraft();
      draft.initialize(entityDraft);
      return draft;
    });

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.get() as number) +
        entityDrafts.length
    );

    const scrapePromise = async (entityDraft: PaperEntityDraft) => {
      return await this.scraperRepository.scrape(entityDraft);
    };

    entityDrafts = await Promise.all(
      entityDrafts.map((entityDraft) => scrapePromise(entityDraft))
    );

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.get() as number) -
        entityDrafts.length
    );
    await this.update(JSON.stringify(entityDrafts));
  }

  async update(entitiesStr: string) {
    let entityDrafts = JSON.parse(entitiesStr) as PaperEntityDraft[];
    entityDrafts = entityDrafts.map((entityDraft) => {
      const draft = new PaperEntityDraft();
      draft.initialize(entityDraft);
      return draft;
    });

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.get() as number) +
        entityDrafts.length
    );

    const updatePromise = async (entityDrafts: PaperEntityDraft[]) => {
      const movedEntityDrafts = await Promise.all(
        entityDrafts.map((entityDraft: PaperEntityDraft) =>
          this.fileRepository.move(entityDraft)
        )
      );

      for (let i = 0; i < movedEntityDrafts.length; i++) {
        if (movedEntityDrafts[i] === null) {
          movedEntityDrafts[i] = entityDrafts[i];
        }
      }

      await this.dbRepository.update(movedEntityDrafts as PaperEntityDraft[]);
    };

    await updatePromise(entityDrafts);

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.get() as number) -
        entityDrafts.length
    );
  }

  async routineScrape() {
    const allowRoutineMatch = this.preference.get(
      "allowRoutineMatch"
    ) as boolean;
    if (allowRoutineMatch) {
      this.sharedState.set(
        "viewState.processInformation",
        "Start routine scraping..."
      );
      this.preference.set("lastRematchTime", Math.round(Date.now() / 1000));
      const entities = await this.dbRepository.preprintEntities();
      void this.scrape(JSON.stringify(entities));
    }
  }

  setupRoutineScrapeScheduler() {
    const lastRematchTime = this.preference.get("lastRematchTime") as number;

    if (Math.round(Date.now() / 1000) - lastRematchTime > 86400 * 7) {
      void this.routineScrape();
    }

    if (this.scheduler == null) {
      this.scheduler = new ToadScheduler();
    } else {
      this.scheduler.stop();
      this.scheduler.removeById("routineScrape");
    }

    const task = new Task("routineScrape", () => {
      void this.routineScrape();
    });

    const job = new SimpleIntervalJob(
      { seconds: 7 * 86400, runImmediately: false },
      task,
      "routineScrape"
    );

    this.scheduler.addSimpleIntervalJob(job);
  }

  // ============================================================

  export(entitiesStr: string, format: string) {
    let entityDrafts = JSON.parse(entitiesStr) as PaperEntityDraft[];
    entityDrafts = entityDrafts.map((entityDraft) => {
      const draft = new PaperEntityDraft();
      draft.initialize(entityDraft);
      return draft;
    });

    const text = this.exporterRepository.export(entityDrafts, format);
    clipboard.writeText(text);
  }

  // ============================================================
  async initDB() {
    this.sharedState.set("selectionState.selectedIndex", "[]");
    this.sharedState.set("selectionState.selectedCategorizer", "");
    await this.dbRepository.initRealm(true);
    this.sharedState.set("viewState.realmReinited", Date.now());
  }
}
