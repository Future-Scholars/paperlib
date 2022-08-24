import { clipboard, ipcRenderer } from "electron";
import path from "path";
import { ToadScheduler, SimpleIntervalJob, Task } from "toad-scheduler";
import { readFileSync } from "fs";

import { SharedState } from "../utils/appstate";
import { Preference } from "../utils/preference";
import { bibtex2entityDraft, bibtex2json } from "../utils/bibtex";

import { DBRepository } from "../repositories/db-repository/db-repository";
import { ScraperRepository } from "../repositories/scraper-repository/scraper-repository";
import { FileRepository } from "../repositories/file-repository/file-repository";
import { CacheRepository } from "../repositories/cache-repository/cache-repository";
import { ReferenceRepository } from "../repositories/reference-repository/reference-repository";
import { DownloaderRepository } from "../repositories/downloader-repository/downloader-repository";

import { Categorizers } from "../models/PaperCategorizer";
import { PaperEntityDraft } from "../models/PaperEntityDraft";

export class EntityInteractor {
  sharedState: SharedState;
  preference: Preference;

  dbRepository: DBRepository;
  fileRepository: FileRepository;
  scraperRepository: ScraperRepository;
  cacheRepository: CacheRepository;
  referenceRepository: ReferenceRepository;
  downloaderRepository: DownloaderRepository;

  scheduler: ToadScheduler;

  constructor(
    sharedState: SharedState,
    preference: Preference,
    dbRepository: DBRepository,
    fileRepository: FileRepository,
    scraperRepository: ScraperRepository,
    cacheRepository: CacheRepository,
    referenceRepository: ReferenceRepository,
    downloaderRepository: DownloaderRepository
  ) {
    this.sharedState = sharedState;
    this.preference = preference;

    this.dbRepository = dbRepository;
    this.fileRepository = fileRepository;
    this.scraperRepository = scraperRepository;
    this.cacheRepository = cacheRepository;
    this.referenceRepository = referenceRepository;
    this.downloaderRepository = downloaderRepository;

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

  async loadCategorizers(
    categorizerType: Categorizers,
    sortBy: string,
    sortOrder: string
  ) {
    return await this.dbRepository.categorizers(
      categorizerType,
      sortBy,
      sortOrder
    );
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
      const pdfUrls = urlList.filter((url) => path.extname(url) === ".pdf");
      const bibUrls = urlList.filter((url) => path.extname(url) === ".bib");

      // 1.1 PDF Metadata scraping.
      const pdfScrapingPromise = async (url: string) => {
        let entityDraft = new PaperEntityDraft(true);
        entityDraft.setValue("mainURL", url);
        entityDraft = await this.scraperRepository.scrape(entityDraft);
        return entityDraft;
      };

      let entityDraftsFromPDFs = await Promise.all(
        pdfUrls.map((url) => pdfScrapingPromise(url))
      );

      // 1.2 BibTeX scraping.
      const bibScrapingPromise = async (url: string) => {
        const bibtexStr = readFileSync(url.replace("file://", ""), "utf8");
        const bibtexes = bibtex2json(bibtexStr);
        const entityDrafts = [];
        for (const bibtex of bibtexes) {
          let entityDraft = new PaperEntityDraft(true);
          entityDraft = bibtex2entityDraft(bibtex, entityDraft);
          entityDrafts.push(entityDraft);
        }

        return entityDrafts;
      };

      let entityDraftsFromBibTexes = (
        await Promise.all(bibUrls.map((url) => bibScrapingPromise(url)))
      ).flat();

      // 2. File moving.
      entityDraftsFromPDFs = (await Promise.all(
        entityDraftsFromPDFs.map((entityDraft) =>
          this.fileRepository.move(entityDraft)
        )
      )) as PaperEntityDraft[];
      entityDraftsFromPDFs = entityDraftsFromPDFs.filter(
        (entityDraft) => entityDraft !== null
      );

      // 3. Merge PDF and BibTeX scraping results.
      const entityDrafts = entityDraftsFromPDFs.concat(
        entityDraftsFromBibTexes
      );

      // 4. DB insertion.
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
        `Add paper to library failed: ${error as string}`
      );
    }

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) -
        urlList.length
    );
  }

  async addToCategorizer(
    urlList: string[],
    categorizerName: string,
    categorizerType: Categorizers
  ) {
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

      // 4. DB update.
      const successfulEntityDrafts = entityDrafts
        .filter((_entityDraft, index) => dbSuccesses[index])
        .map((entityDraft) => {
          if (categorizerType === "PaperTag") {
            entityDraft.setValue("tags", categorizerName);
          }
          if (categorizerType === "PaperFolder") {
            entityDraft.setValue("folders", categorizerName);
          }
          return entityDraft;
        });

      await this.dbRepository.update(successfulEntityDrafts);
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Add categorizer failed: ${error as string}`
      );
    }

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) -
        urlList.length
    );
  }

  async addWholeFolder(folder: string) {
    const files = await this.fileRepository.listPDFs(folder);
    const PDFfiles = files.filter((file) => path.extname(file) === ".pdf");

    this.add(PDFfiles);
  }

  async addFromZoteroCSV(csvFile: string) {
    if (path.extname(csvFile) === ".csv") {
      const paperEntityDrafts = await this.fileRepository.parseZoteroCSV(
        csvFile
      );
      this.update(JSON.stringify(paperEntityDrafts));
    }
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
        `Delete paper failed: ${error as string}`
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
        `Delete supplementary failed: ${error as string}`
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
      (this.sharedState.viewState.processingQueueCount.get() as number) + 1
    );

    const scrapePromise = async (entityDraft: PaperEntityDraft) => {
      return await this.scraperRepository.scrape(entityDraft);
    };

    entityDrafts = await Promise.all(
      entityDrafts.map((entityDraft) => scrapePromise(entityDraft))
    );

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.get() as number) - 1
    );
    await this.update(JSON.stringify(entityDrafts));
  }

  async scrapeFrom(entitiesStr: string, scraperName: string) {
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
      return await this.scraperRepository.scrapeFrom(entityDraft, scraperName);
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

    try {
      const updatePromise = async (entityDrafts: PaperEntityDraft[]) => {
        const movedEntityDrafts = await Promise.all(
          entityDrafts.map((entityDraft: PaperEntityDraft) =>
            this.fileRepository.move(entityDraft, true)
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
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Update paper failed: ${error as string}`
      );
    }

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.get() as number) -
        entityDrafts.length
    );
  }

  async updateWithCategorizer(
    ids: string[],
    categorizerName: string,
    categorizerType: Categorizers
  ) {
    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.get() as number) +
        ids.length
    );

    try {
      // 1. Get Entities by IDs.
      const entities = await this.dbRepository.entitiesByIds(ids);

      let entityDrafts = entities.map((entity) => {
        const draft = new PaperEntityDraft();
        draft.initialize(entity);
        return draft;
      });

      entityDrafts = entityDrafts.map((entityDraft) => {
        if (categorizerType === "PaperTag") {
          let tags = entityDraft.tags.split(";").map((tag) => tag.trim());
          if (!tags.includes(categorizerName)) {
            tags.push(categorizerName);
          }
          entityDraft.setValue("tags", tags.join("; "));
        }
        if (categorizerType === "PaperFolder") {
          let folders = entityDraft.folders
            .split(";")
            .map((folder) => folder.trim());
          if (!folders.includes(categorizerName)) {
            folders.push(categorizerName);
          }
          entityDraft.setValue("folders", folders.join("; "));
        }
        return entityDraft;
      });
      await this.dbRepository.update(entityDrafts);
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Update paper failed: ${error as string}`
      );
    }

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) -
        ids.length
    );
  }

  async renameAll() {
    let entities = await this.dbRepository.entities(
      null,
      false,
      "",
      "",
      "title",
      "desc"
    );
    const entityDrafts = entities.map((entityDraft) => {
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
          this.fileRepository.move(entityDraft, true)
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

  colorizeCategorizers(
    categorizerName: string,
    categorizerType: Categorizers,
    color: string
  ) {
    void this.dbRepository.colorizeCategorizers(
      categorizerName,
      categorizerType,
      color
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
  async locateMainFile(entitiesStr: string) {
    let entityDrafts = JSON.parse(entitiesStr) as PaperEntityDraft[];

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.get() as number) +
        entityDrafts.length
    );

    try {
      const downloadPromise = async (entityDraft: PaperEntityDraft) => {
        return await this.downloaderRepository.download(entityDraft);
      };

      entityDrafts = await Promise.all(
        entityDrafts.map((entityDraft) => downloadPromise(entityDraft))
      );

      this.update(JSON.stringify(entityDrafts));
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Download paper failed: ${error as string}`
      );
    }

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.get() as number) -
        entityDrafts.length
    );
  }

  // ============================================================

  export(entitiesStr: string, format: string) {
    let entityDrafts = JSON.parse(entitiesStr) as PaperEntityDraft[];
    entityDrafts = entityDrafts.map((entityDraft) => {
      const draft = new PaperEntityDraft();
      draft.initialize(entityDraft);
      return draft;
    });

    // const text = this.referenceRepository.export(entityDrafts, format);
    // clipboard.writeText(text);
  }

  // ============================================================
  async initDB() {
    this.sharedState.set("selectionState.selectedIndex", "[]");
    this.sharedState.set("selectionState.selectedCategorizer", "");
    await this.dbRepository.initRealm(true);
    this.sharedState.set("viewState.realmReinited", Date.now());
  }
}
