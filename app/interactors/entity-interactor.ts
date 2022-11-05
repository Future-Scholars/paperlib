import { ObjectId } from "bson";
import { clipboard } from "electron";
import { readFileSync } from "fs";
import path from "path";
import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { watch } from "vue";

import {
  Categorizer,
  CategorizerType,
  Colors,
  PaperFolder,
  PaperTag,
} from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import { ThumbnailCache } from "@/models/paper-entity-cache";
import { Preference } from "@/preference/preference";
import { DBRepository } from "@/repositories/db-repository/db-repository";
import { PaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import { DownloaderRepository } from "@/repositories/downloader-repository/downloader-repository";
import { FileRepository } from "@/repositories/file-repository/file-repository";
import { ReferenceRepository } from "@/repositories/reference-repository/reference-repository";
import { ScraperRepository } from "@/repositories/scraper-repository/scraper-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { bibtex2json, bibtex2paperEntityDraft } from "@/utils/bibtex";

export class EntityInteractor {
  stateStore: MainRendererStateStore;
  preference: Preference;

  dbRepository: DBRepository;
  scraperRepository: ScraperRepository;
  fileRepository: FileRepository;
  referenceRepository: ReferenceRepository;
  downloaderRepository: DownloaderRepository;

  scheduler: ToadScheduler;

  constructor(
    stateStore: MainRendererStateStore,
    preference: Preference,
    dbRepository: DBRepository,
    scraperRepository: ScraperRepository,
    fileRepository: FileRepository,
    referenceRepository: ReferenceRepository,
    downloaderRepository: DownloaderRepository
  ) {
    this.stateStore = stateStore;
    this.preference = preference;
    this.dbRepository = dbRepository;
    this.scraperRepository = scraperRepository;
    this.fileRepository = fileRepository;
    this.referenceRepository = referenceRepository;
    this.downloaderRepository = downloaderRepository;

    this.scheduler = new ToadScheduler();

    watch(
      () => this.stateStore.viewState.realmReinited,
      () => {
        window.entityInteractor.setupRoutineScrapeScheduler();
      }
    );
  }

  // ========================
  // Read
  // ========================

  async loadPaperEntities(
    search: string,
    flag: boolean,
    tag: string,
    folder: string,
    sortBy: string,
    sortOrder: string
  ) {
    let entities;
    this.stateStore.viewState.processingQueueCount += 1;
    try {
      entities = await this.dbRepository.paperEntities(
        search,
        flag,
        tag,
        folder,
        sortBy,
        sortOrder
      );
    } catch (e) {
      console.error(e);
      this.stateStore.logState.alertLog = `Failed to load paper entities`;
      entities = [] as PaperEntityResults;
    }
    this.stateStore.viewState.processingQueueCount -= 1;
    return entities;
  }

  async loadCategorizers(
    type: CategorizerType,
    sortBy: string,
    sortOrder: string
  ) {
    return await this.dbRepository.categorizers(type, sortBy, sortOrder);
  }

  async loadThumbnail(paperEntity: PaperEntity) {
    return await this.dbRepository.thumbnail(paperEntity);
  }

  async loadCitationCount(paperEntity: PaperEntity) {
    const citationCount = await this.scraperRepository.scrapeCitationCount(paperEntity);
    return citationCount;
  }

  // ========================
  // Create
  // ========================
  async create(urlList: string[]) {
    this.stateStore.viewState.processingQueueCount += urlList.length;
    let successfulEntityDrafts: PaperEntity[] = [];
    try {
      // 1. Create from .bib files
      const bibUrls = urlList.filter((url) => path.extname(url) === ".bib");
      const paperEntityDraftsFromBib = [];
      for (const bibUrl of bibUrls) {
        const paperEntityDrafts = await this._createFromUrl(bibUrl) as PaperEntity[] || [];
        paperEntityDraftsFromBib.push(...paperEntityDrafts);
      }
      const successfulPaperEntityDraftsFromBib = await this._createPostProcess(paperEntityDraftsFromBib);

      // 2. Create from .pdf files
      const pdfUrls = urlList.filter((url) => path.extname(url) === ".pdf");
      const successfulPaperEntityDraftsFromPDF = [];
      // Scrape 5 PDFs at a time.
      for (let i = 0; i < pdfUrls.length; i += 5) {

        if (pdfUrls.length > 5) {
          this.stateStore.logState.progressLog = {
            id: "chunk-scrape",
            value: (i / pdfUrls.length) * 100,
            msg: `Scraping...`,
          };
        }

        const pdfUrlsChunk = pdfUrls.slice(i, i + 5);
        const paperEntityDraftsFromPDF = (await Promise.all(pdfUrlsChunk.map((url) => this._createFromUrl(url)))).filter((e) => e) as PaperEntity[];
        successfulPaperEntityDraftsFromPDF.push(...await this._createPostProcess(paperEntityDraftsFromPDF));
      }

      const successfulEntityDrafts = [...successfulPaperEntityDraftsFromBib, ...successfulPaperEntityDraftsFromPDF];

      this.stateStore.viewState.processingQueueCount -= urlList.length;
      if (pdfUrls.length > 5) {
        this.stateStore.logState.progressLog = {
          id: "chunk-scrape",
          value: 100,
          msg: `Scraping...`,
        };
      }
      // 3. Create cache
      await this.dbRepository.updatePaperEntitiesCacheFullText(
        successfulEntityDrafts
      );
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Add paper to library failed: ${error as string
        }`;
    }
    return successfulEntityDrafts;
  }

  async _createFromUrl(url: string): Promise<PaperEntity | PaperEntity[] | null> {
    if (path.extname(url) !== '.pdf' && path.extname(url) !== '.bib') {
      return null;
    }

    if (path.extname(url) === '.pdf') {
      let paperEntityDraft = new PaperEntity(true);
      paperEntityDraft.setValue("mainURL", url);
      paperEntityDraft = await this.scraperRepository.scrape(
        paperEntityDraft
      );
      return await this.fileRepository.move(paperEntityDraft);
    } else if (path.extname(url) === '.bib') {
      const bibtexStr = readFileSync(url.replace("file://", ""), "utf8");
      const bibtexes = bibtex2json(bibtexStr);
      const paperEntityDrafts = [];
      for (const bibtex of bibtexes) {
        let paperEntityDraft = new PaperEntity(true);
        paperEntityDraft = bibtex2paperEntityDraft(bibtex, paperEntityDraft);
        paperEntityDrafts.push(paperEntityDraft);
      }
      return paperEntityDrafts;
    } else {
      return null;
    }
  }

  async _createPostProcess(paperEntityDrafts: PaperEntity[]) {
    // DB insertion.
    const dbSuccesses = await this.dbRepository.updatePaperEntities(
      paperEntityDrafts
    );
    // - find unsuccessful entities.
    const unsuccessfulEntityDrafts = paperEntityDrafts.filter(
      (_, index) => !dbSuccesses[index]
    );
    // - find successful entities.
    const successfulEntityDrafts = paperEntityDrafts.filter(
      (_, index) => dbSuccesses[index]
    );
    // - remove files of unsuccessful entities.
    await Promise.all(
      unsuccessfulEntityDrafts.map((entityDraft) =>
        this.fileRepository.remove(entityDraft)
      )
    );

    return successfulEntityDrafts;
  }

  async createIntoCategorizer(
    urlList: string[],
    categorizer: Categorizer,
    type: CategorizerType
  ) {
    this.stateStore.logState.processLog = `Adding ${urlList.length} papers to ${categorizer.name}...`;
    this.stateStore.viewState.processingQueueCount += urlList.length;

    try {
      const paperEntityDrafts = await this.create(urlList);

      // 4. DB update.
      const toBeUpdatedPaperEntityDrafts = paperEntityDrafts.map(
        (paperEntityDraft) => {
          if ((type = "PaperTag")) {
            paperEntityDraft.setValue("tags", [
              new PaperTag("", 0, "").initialize(categorizer),
            ]);
          } else if (type === "PaperFolder") {
            paperEntityDraft.setValue("folders", [
              new PaperFolder("", 0, "").initialize(categorizer),
            ]);
          }
          return paperEntityDraft;
        }
      );
      await this.dbRepository.updatePaperEntities(toBeUpdatedPaperEntityDrafts);
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Add paper to library failed: ${error as string
        }`;
    }

    this.stateStore.viewState.processingQueueCount -= urlList.length;
  }

  async createFromWholeFolder(folder: string) {
    const files = await this.fileRepository.listPDFs(folder);
    const PDFfiles = files.filter(
      (file) => path.extname(file) === ".pdf" || path.extname(file) === ".bib"
    );

    this.create(PDFfiles);
  }

  async createFromZoteroCSV(csvFile: string) {
    if (path.extname(csvFile) === ".csv") {
      const paperEntityDrafts = await this.fileRepository.parseZoteroCSV(
        csvFile
      );
      this.update(paperEntityDrafts);
    }
  }

  // ========================
  // Delete
  // ========================
  async delete(ids: (ObjectId | string)[]) {
    this.stateStore.logState.processLog = `Deleting ${ids.length} paper(s)...`;
    this.stateStore.viewState.processingQueueCount += ids.length;
    try {
      const removeFileURLs = await this.dbRepository.deletePaperEntities(ids);

      await Promise.all(
        removeFileURLs.map((url) => this.fileRepository.removeFile(url))
      );
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Delete paper failed: ${error as string
        }`;
    }
    this.stateStore.viewState.processingQueueCount -= ids.length;
  }

  async deleteCategorizer(
    type: CategorizerType,
    name?: string,
    categorizer?: Categorizer
  ) {
    this.stateStore.viewState.processingQueueCount += 1;
    try {
      await this.dbRepository.deleteCategorizer(true, type, categorizer, name);
    } catch (e) {
      console.error(e);
      this.stateStore.logState.alertLog = `Failed to remove categorizer ${type} ${name} ${categorizer}`;
    }
    this.stateStore.viewState.processingQueueCount -= 1;
  }

  async deleteSup(paperEntity: PaperEntity, url: string) {
    this.stateStore.logState.processLog = `Removing supplementary file ${url}...`;
    this.stateStore.viewState.processingQueueCount += 1;

    try {
      await this.fileRepository.removeFile(url);
      paperEntity.supURLs = paperEntity.supURLs.filter(
        (supUrl) => supUrl !== path.basename(url)
      );
      await this.dbRepository.updatePaperEntities([paperEntity]);
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Failed to remove supplementary file ${url}`;
    }

    this.stateStore.viewState.processingQueueCount -= 1;
  }

  // ========================
  // Update
  // ========================
  async update(paperEntities: PaperEntity[], forceDelete = true, forceNotLink = false) {
    this.stateStore.logState.processLog = `Updating ${paperEntities.length} paper(s)...`;
    this.stateStore.viewState.processingQueueCount += paperEntities.length;

    let updatedPaperEntities: PaperEntity[] = [];
    try {
      const updatePromise = async (paperEntityDrafts: PaperEntity[]) => {
        const movedPaperEntityDrafts = await Promise.all(
          paperEntityDrafts.map((paperEntityDraft: PaperEntity) =>
            this.fileRepository.move(paperEntityDraft, forceDelete, forceNotLink)
          )
        );

        for (let i = 0; i < movedPaperEntityDrafts.length; i++) {
          if (movedPaperEntityDrafts[i] === null) {
            movedPaperEntityDrafts[i] = paperEntityDrafts[i];
          }
        }

        const successes = await this.dbRepository.updatePaperEntities(
          movedPaperEntityDrafts as PaperEntity[]
        );

        const successfulPaperEntityDrafts = movedPaperEntityDrafts.filter(
          (_, index) => successes[index]
        ) as PaperEntity[];

        return successfulPaperEntityDrafts;
      };

      updatedPaperEntities = await updatePromise(paperEntities);
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Update paper failed: ${error as string
        }`;
    }

    this.stateStore.viewState.processingQueueCount -= paperEntities.length;
    return updatedPaperEntities;
  }

  async scrape(paperEntities: PaperEntity[]) {
    this.stateStore.logState.processLog = `Scraping ${paperEntities.length} paper(s)...`;
    this.stateStore.viewState.processingQueueCount += paperEntities.length;

    const scrapePromise = async (paperEntityDraft: PaperEntity) => {
      return await this.scraperRepository.scrape(paperEntityDraft);
    };

    try {
      paperEntities = await Promise.all(
        paperEntities.map((paperEntityDraft) => scrapePromise(paperEntityDraft))
      );
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Scrape paper failed: ${error as string
        }`;
    }

    this.stateStore.viewState.processingQueueCount -= paperEntities.length;
    await this.update(paperEntities);
  }

  async scrapeFrom(paperEntities: PaperEntity[], scraperName: string) {
    this.stateStore.logState.processLog = `Scraping ${paperEntities.length} paper(s)...`;
    this.stateStore.viewState.processingQueueCount += paperEntities.length;

    const scrapePromise = async (paperEntityDraft: PaperEntity) => {
      return await this.scraperRepository.scrapeFrom(
        paperEntityDraft,
        scraperName
      );
    };

    try {
      paperEntities = await Promise.all(
        paperEntities.map((paperEntityDraft) => scrapePromise(paperEntityDraft))
      );
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Scrape paper failed: ${error as string
        }`;
    }

    this.stateStore.viewState.processingQueueCount -= paperEntities.length;
    await this.update(paperEntities);
  }

  async updateWithCategorizer(
    ids: (string | ObjectId)[],
    categorizer: Categorizer,
    type: CategorizerType
  ) {
    this.stateStore.logState.processLog = `Updating ${ids.length} paper(s)...`;
    this.stateStore.viewState.processingQueueCount += ids.length;

    try {
      // 1. Get Entities by IDs.
      const paperEntities = await this.dbRepository.paperEntitiesByIds(ids);

      let paperEntityDrafts = paperEntities.map((paperEntity) => {
        return new PaperEntity(false).initialize(paperEntity);
      });

      paperEntityDrafts = paperEntityDrafts.map((paperEntityDraft) => {
        if (type === "PaperTag") {
          let tagNames = paperEntityDraft.tags.map((tag) => tag.name);
          if (!tagNames.includes(categorizer.name)) {
            paperEntityDraft.tags.push(categorizer);
          }
        }
        if (type === "PaperFolder") {
          let folderNames = paperEntityDraft.folders.map(
            (folder) => folder.name
          );
          if (!folderNames.includes(categorizer.name)) {
            paperEntityDraft.folders.push(categorizer);
          }
        }

        return paperEntityDraft;
      });

      await this.dbRepository.updatePaperEntities(paperEntityDrafts);
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Add paper to ${categorizer.name
        } failed: ${error as string}`;
    }

    this.stateStore.viewState.processingQueueCount -= ids.length;
  }

  async colorizeCategorizer(
    color: Colors,
    type: CategorizerType,
    name?: string,
    categorizer?: Categorizer
  ) {
    this.stateStore.viewState.processingQueueCount += 1;
    try {
      await this.dbRepository.colorizeCategorizer(
        color,
        type,
        categorizer,
        name
      );
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Failed to colorize categorizer ${type} ${name} ${categorizer}`;
    }
    this.stateStore.viewState.processingQueueCount -= 1;
  }

  async renameCategorizer(
    oldName: string,
    newName: string,
    type: CategorizerType
  ) {
    const success = await this.dbRepository.renameCategorizer(
      oldName,
      newName,
      type
    );

    if (
      type === "PaperFolder" &&
      this.stateStore.selectionState.pluginLinkedFolder === oldName &&
      success
    ) {
      this.stateStore.selectionState.pluginLinkedFolder = newName;
      this.preference.set("pluginLinkedFolder", newName);
    }
  }

  async updateCache(paperEntities: PaperEntity[]) {
    try {
      await this.dbRepository.updatePaperEntitiesCacheFullText(paperEntities);
      for (const paperEntity of paperEntities) {
        await this.dbRepository.updatePaperEntityCacheThumbnail(paperEntity, {
          blob: new ArrayBuffer(0),
          width: 0,
          height: 0,
        });
      }
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Update cache failed: ${error as string
        }`;
    }
  }

  async updateThumbnailCache(
    paperEntity: PaperEntity,
    thumbnailCache: ThumbnailCache
  ) {
    try {
      await this.dbRepository.updatePaperEntityCacheThumbnail(
        paperEntity,
        thumbnailCache
      );
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Failed to update thumbnail cache for ${paperEntity.title}`;
    }
  }

  // ========================
  // Handle File
  // ========================
  async locateMainFile(paperEntities: PaperEntity[]) {
    this.stateStore.logState.processLog = `Locating main file for ${paperEntities.length} paper(s)...`;
    this.stateStore.viewState.processingQueueCount += paperEntities.length;

    let paperEntityDrafts = paperEntities.map((paperEntity) => {
      return new PaperEntity(false).initialize(paperEntity);
    });

    let updatedPaperEntities: PaperEntity[] = [];
    try {
      const downloadPromise = async (paperEntityDraft: PaperEntity) => {
        return await this.downloaderRepository.download(paperEntityDraft);
      };

      paperEntityDrafts = await Promise.all(
        paperEntityDrafts.map((paperEntityDraft) =>
          downloadPromise(paperEntityDraft)
        )
      );

      updatedPaperEntities = await this.update(paperEntityDrafts, false, true);
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Download paper failed: ${error as string
        }`;
    }

    this.stateStore.viewState.processingQueueCount -= paperEntities.length;
    return updatedPaperEntities;
  }

  async renameAll() {
    this.stateStore.logState.processLog = `Renaming all paper(s)...`;
    this.stateStore.viewState.processingQueueCount += 1;
    try {
      let paperEntities = await this.dbRepository.paperEntities(
        "",
        false,
        "",
        "",
        "title",
        "desc"
      );
      const paperEntityDrafts = paperEntities.map((paperEntity) => {
        return new PaperEntity(false).initialize(paperEntity);
      });

      const movedEntityDrafts = await Promise.all(
        paperEntityDrafts.map((paperEntityDraft: PaperEntity) =>
          this.fileRepository.move(paperEntityDraft, true)
        )
      );

      for (let i = 0; i < movedEntityDrafts.length; i++) {
        if (movedEntityDrafts[i] === null) {
          movedEntityDrafts[i] = paperEntityDrafts[i];
        }
      }

      await this.dbRepository.updatePaperEntities(
        movedEntityDrafts as PaperEntity[]
      );
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Rename all paper failed: ${error as string
        }`;
    }

    this.stateStore.viewState.processingQueueCount -= 1;
  }

  // ========================
  // Export
  // ========================

  async export(paperEntities: PaperEntity[], format: string) {
    let paperEntityDrafts = paperEntities.map((paperEntity) => {
      return new PaperEntity(false).initialize(paperEntity);
    });

    let copyStr = "";
    if (format === "BibTex") {
      copyStr = this.referenceRepository.exportBibTexBody(
        this.referenceRepository.toCite(paperEntityDrafts)
      );
    } else if (format === "BibTex-Key") {
      copyStr = this.referenceRepository.exportBibTexKey(
        this.referenceRepository.toCite(paperEntityDrafts)
      );
    } else if (format === "PlainText") {
      copyStr = await this.referenceRepository.exportPlainText(
        this.referenceRepository.toCite(paperEntityDrafts)
      );
    }

    clipboard.writeText(copyStr);
  }

  // ========================
  // Routine Task
  // ========================
  async routineScrape() {
    const allowRoutineMatch = this.preference.get(
      "allowRoutineMatch"
    ) as boolean;
    if (allowRoutineMatch) {
      this.stateStore.logState.processLog = "Start routine scraping...";
      this.stateStore.viewState.processingQueueCount += 1;
      try {
        this.preference.set("lastRematchTime", Math.round(Date.now() / 1000));
        const preprintPaperEntities =
          await this.dbRepository.preprintPaperEntities();

        // Scrape every 5 papers
        const n = preprintPaperEntities.length;
        this.stateStore.logState.progressLog = {
          id: "routine-scrape",
          value: 0,
          msg: `Scraping preprint...`,
        };
        for (let i = 0; i < n; i += 5) {
          const preprintPaperEntityDraftsChunk = preprintPaperEntities
            .slice(i, i + 5)
            .map((paperEntity) => {
              return new PaperEntity(false).initialize(paperEntity);
            });
          await this.scrape(preprintPaperEntityDraftsChunk);

          this.stateStore.logState.progressLog = {
            id: "routine-scrape",
            value: (i / n) * 100,
            msg: `Scraping preprint...`,
          };
        }
        this.stateStore.logState.progressLog = {
          id: "routine-scrape",
          value: 100,
          msg: `Scraping preprint...`,
        };
      } catch (error) {
        console.error(error);
        this.stateStore.logState.alertLog = `Routine scrape failed: ${error as string
          }`;
      }
      this.stateStore.viewState.processingQueueCount -= 1;
    }
  }

  setupRoutineScrapeScheduler() {
    const lastRematchTime = this.preference.get("lastRematchTime") as number;

    if (Math.round(Date.now() / 1000) - lastRematchTime > 7 * 86400) {
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

  // ========================
  // Dev Functions
  // ========================
  async addDummyData() {
    await this.dbRepository.addDummyData();
  }

  async removeAll() {
    await this.dbRepository.removeAll();
  }
}
