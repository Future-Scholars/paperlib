import { ObjectId } from "bson";
import { clipboard } from "electron";
import { readFileSync } from "fs";
import path from "path";

import { createDecorator } from "@/base/injection/injection";
import {
  Categorizer,
  CategorizerType,
  Colors,
  PaperFolder,
  PaperTag,
} from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import { ThumbnailCache } from "@/models/paper-entity-cache";
import { PaperSmartFilter, PaperSmartFilterType } from "@/models/smart-filter";
import {
  DBRepository,
  IDBRepository,
} from "@/repositories/db-repository/db-repository";
import { IPaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import {
  DownloaderRepository,
  IDownloaderRepository,
} from "@/repositories/downloader-repository/downloader-repository";
import {
  FileRepository,
  IFileRepository,
} from "@/repositories/file-repository/file-repository";
import {
  IReferenceRepository,
  ReferenceRepository,
} from "@/repositories/reference-repository/reference-repository";
import {
  IScraperRepository,
  ScraperRepository,
} from "@/repositories/scraper-repository/scraper-repository";
import { ILogService, LogService } from "@/services/log-service";
import {
  IPreferenceService,
  PreferenceService,
} from "@/services/preference-service";
import { ProcessingKey, processing } from "@/services/state-service/processing";
import {
  IStateService,
  StateService,
} from "@/services/state-service/state-service";
import { bibtex2json, bibtex2paperEntityDraft } from "@/utils/bibtex";

export const ISechedulerService = createDecorator("ISchedulerService");

export class PaperService {
  constructor(
    @IDBRepository private readonly dbRepository: DBRepository,
    @IScraperRepository private readonly scraperRepository: ScraperRepository,
    @IFileRepository private readonly fileRepository: FileRepository,
    @IDownloaderRepository
    private readonly downloaderRepository: DownloaderRepository,
    @IReferenceRepository
    private readonly referenceRepository: ReferenceRepository,
    @IStateService private readonly stateService: StateService,
    @IPreferenceService private readonly preferenceService: PreferenceService,
    @ILogService private readonly logService: LogService
  ) {}

  // ========================
  // Read
  // ========================
  /**
   * Load paper entities with filters and sort.
   * @param search Filter: searching string
   * @param flag Filter: by flag
   * @param tag Filter: by tag
   * @param folder Filter: by folder
   * @param sortBy Sort: by
   * @param sortOrder Sort: order
   * @returns
   */
  @processing(ProcessingKey.General)
  async loadPaperEntities(
    search: string,
    flag: boolean,
    tag: string,
    folder: string,
    sortBy: string,
    sortOrder: string
  ): Promise<IPaperEntityResults> {
    // TODO: move filter construction to this service from the repository.
    let entities: IPaperEntityResults;
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
      this.logService.error(
        `Failed to load paper entities`,
        `${e}`,
        true,
        "EntityService"
      );

      entities = [];
    }
    return entities;
  }

  /**
   * Load categorizers.
   * @param type The type of the categorizer.
   * @param sortBy Sort: by
   * @param sortOrder Sort: order
   * @returns
   */
  @processing(ProcessingKey.General)
  async loadCategorizers(
    type: CategorizerType,
    sortBy: string,
    sortOrder: string
  ) {
    return await this.dbRepository.categorizers(type, sortBy, sortOrder);
  }

  /**
   * Load smart filters.
   * @param type The type of the smart filter.
   * @param sortBy Sort: by
   * @param sortOrder Sort: order
   * @returns
   */
  @processing(ProcessingKey.General)
  async loadPaperSmartFilters(
    type: PaperSmartFilterType,
    sortBy: string,
    sortOrder: string
  ) {
    return await this.dbRepository.smartfilters(type, sortBy, sortOrder);
  }

  // TODO: move to other service.
  async loadThumbnail(paperEntity: PaperEntity) {
    return await this.dbRepository.thumbnail(paperEntity);
  }

  // TODO: create a seperate plugin to achieve this.
  async loadCitationCount(paperEntity: PaperEntity) {
    const citationCount = await this.scraperRepository.scrapeCitationCount(
      paperEntity
    );
    return citationCount;
  }

  // ========================
  // Create
  // ========================
  /**
   * Create paper entity from URLs.
   * @param urlList - The list of URLs.
   * @returns
   */
  @processing(ProcessingKey.General)
  async create(urlList: string[]) {
    let successfulEntityDrafts: PaperEntity[] = [];
    try {
      // 1. Create from .bib files
      const bibUrls = urlList.filter((url) => path.extname(url) === ".bib");
      const paperEntityDraftsFromBib: PaperEntity[] = [];
      for (const bibUrl of bibUrls) {
        const paperEntityDrafts =
          ((await this._createFromUrl(bibUrl)) as PaperEntity[]) || [];
        paperEntityDraftsFromBib.push(...paperEntityDrafts);
      }
      const successfulPaperEntityDraftsFromBib = await this._createPostProcess(
        paperEntityDraftsFromBib
      );

      // 2. Create from .pdf files
      const pdfUrls = urlList.filter((url) => path.extname(url) === ".pdf");
      const successfulPaperEntityDraftsFromPDF: PaperEntity[] = [];
      // Scrape 5 PDFs at a time.
      for (let i = 0; i < pdfUrls.length; i += 5) {
        if (pdfUrls.length > 5) {
          this.logService.progress(
            "Scraping Metadata...",
            (i / pdfUrls.length) * 100,
            true,
            "Scrape"
          );
        }

        const pdfUrlsChunk = pdfUrls.slice(i, i + 5);
        const paperEntityDraftsFromPDF = (
          await Promise.all(pdfUrlsChunk.map((url) => this._createFromUrl(url)))
        ).filter((e) => e) as PaperEntity[];
        successfulPaperEntityDraftsFromPDF.push(
          ...(await this._createPostProcess(paperEntityDraftsFromPDF))
        );
      }

      const successfulEntityDrafts = [
        ...successfulPaperEntityDraftsFromBib,
        ...successfulPaperEntityDraftsFromPDF,
      ];

      if (pdfUrls.length > 5) {
        this.logService.progress("Scraping Metadata...", 100, true, "Scrape");
      }
      // 3. Create cache
      await this.dbRepository.updatePaperEntitiesCacheFullText(
        successfulEntityDrafts
      );
    } catch (error) {
      this.logService.error(
        "Add paper to library failed",
        error as Error,
        true,
        "Entity"
      );
    }
    return successfulEntityDrafts;
  }

  /**
   * Create paper entity from a URL.
   * @param url - The URL.
   * @returns
   */
  private async _createFromUrl(
    url: string
  ): Promise<PaperEntity | PaperEntity[] | null> {
    if (path.extname(url) !== ".pdf" && path.extname(url) !== ".bib") {
      return null;
    }

    if (path.extname(url) === ".pdf") {
      let paperEntityDraft = new PaperEntity(true);
      paperEntityDraft.setValue("mainURL", url);
      return await this.scraperRepository.scrape(paperEntityDraft);
    } else if (path.extname(url) === ".bib") {
      const bibtexStr = readFileSync(url.replace("file://", ""), "utf8");
      // TODO: move bibtex2json to base folder.
      const bibtexes = bibtex2json(bibtexStr);
      const paperEntityDrafts: PaperEntity[] = [];
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

  /**
   * Post process after creating paper entity.
   * @param paperEntityDrafts - The list of paper entity drafts.
   * @returns
   */
  private async _createPostProcess(paperEntityDrafts: PaperEntity[]) {
    // - move files of entities.
    const fileMovedPaperEntityDrafts: PaperEntity[] = [];
    for (const paperEntityDraft of paperEntityDrafts) {
      const fileMovedPaperEntityDraft = await this.fileRepository.move(
        paperEntityDraft
      );
      if (fileMovedPaperEntityDraft) {
        fileMovedPaperEntityDrafts.push(fileMovedPaperEntityDraft);
      } else {
        if (paperEntityDraft.mainURL !== "") {
          this.logService.warn(
            "Failed to move files",
            `${paperEntityDraft.title} -> ${paperEntityDraft.mainURL}`,
            true,
            "Entity"
          );
          paperEntityDraft.mainURL = "";
        }
        fileMovedPaperEntityDrafts.push(paperEntityDraft);
      }
    }

    // DB insertion.
    const dbSuccesses = await this.dbRepository.updatePaperEntities(
      fileMovedPaperEntityDrafts
    );

    // find unsuccessful entities.
    const unsuccessfulEntityDrafts = paperEntityDrafts.filter(
      (_, index) => !dbSuccesses[index]
    );

    // find successful entities.
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

  /**
   * Create paper entity from a URL with a given categorizer.
   * @param urlList - The list of URLs.
   * @param categorizer - The categorizer.
   * @param type - The type of categorizer.
   * @returns
   */
  @processing(ProcessingKey.General)
  async createIntoCategorizer(
    urlList: string[],
    categorizer: Categorizer,
    type: CategorizerType
  ) {
    this.logService.info(
      `Adding ${urlList.length} papers to ${categorizer.name}...`,
      "",
      true,
      "Entity"
    );

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
      this.logService.error(
        "Add paper to library failed",
        error as Error,
        true,
        "Entity"
      );
    }
  }

  /**
   * Create paper entity from a folder.
   * @param folder - The folder.
   * @returns
   */
  async createFromWholeFolder(folder: string) {
    const files = await this.fileRepository.listPDFs(folder);
    const PDFfiles = files.filter(
      (file) => path.extname(file) === ".pdf" || path.extname(file) === ".bib"
    );

    this.create(PDFfiles);
  }

  /**
   * Create paper entity from a Zotero CSV file.
   * @param csvFile - The CSV file.
   * @returns
   */
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
  /**
   * Delete paper entity.
   * @param ids - The list of paper entity IDs.
   * @returns
   */
  @processing(ProcessingKey.General)
  async delete(ids: (ObjectId | string)[]) {
    this.logService.info(
      `Deleting ${ids.length} paper(s)...`,
      "",
      true,
      "Entity"
    );
    try {
      const removeFileURLs = await this.dbRepository.deletePaperEntities(ids);

      await Promise.all(
        removeFileURLs.map((url) => this.fileRepository.removeFile(url))
      );
    } catch (error) {
      this.logService.error(
        "Delete paper failed",
        error as Error,
        true,
        "Entity"
      );
    }
  }

  // TODO: Should we create a individual service for categorizer?
  /**
   * Delete a categorizer.
   * @param type - The type of categorizer.
   * @param name - The name of categorizer.
   * @param categorizer - The categorizer.
   * @returns
   */
  @processing(ProcessingKey.General)
  async deleteCategorizer(
    type: CategorizerType,
    name?: string,
    categorizer?: Categorizer
  ) {
    try {
      await this.dbRepository.deleteCategorizer(true, type, categorizer, name);
    } catch (e) {
      this.logService.error(
        `Delete categorizer failed: ${type} ${name} ${categorizer}`,
        e as Error,
        true,
        "Entity"
      );
    }
  }

  /**
   * Delete a suplementary file.
   * @param paperEntity - The paper entity.
   * @param url - The URL of the supplementary file.
   * @returns
   */
  @processing(ProcessingKey.General)
  async deleteSup(paperEntity: PaperEntity, url: string) {
    this.logService.info(
      `Removing supplementary file...`,
      `${url}`,
      true,
      "Entity"
    );
    try {
      await this.fileRepository.removeFile(url);
      paperEntity.supURLs = paperEntity.supURLs.filter(
        (supUrl) => supUrl !== path.basename(url)
      );
      await this.dbRepository.updatePaperEntities([paperEntity]);
    } catch (error) {
      this.logService.error(
        `Remove supplementary file failed: ${url}`,
        error as Error,
        true,
        "Entity"
      );
    }
  }

  // ========================
  // Update
  // ========================
  /**
   * Update paper entities.
   * @param paperEntities - The list of paper entities.
   * @param forceDelete - Whether to force delete the original file.
   * @param forceNotLink - Whether to force not link the original file.
   * @returns
   */
  @processing(ProcessingKey.General)
  async update(
    paperEntities: PaperEntity[],
    forceDelete = true,
    forceNotLink = false
  ) {
    // TODO: why we need forceDelete and forceNotLink?
    this.logService.info(
      `Updating ${paperEntities.length} paper(s)...`,
      "",
      true,
      "Entity"
    );

    let updatedPaperEntities: PaperEntity[] = [];
    try {
      const updatePromise = async (paperEntityDrafts: PaperEntity[]) => {
        const movedPaperEntityDrafts = await Promise.all(
          paperEntityDrafts.map((paperEntityDraft: PaperEntity) =>
            this.fileRepository.move(
              paperEntityDraft,
              forceDelete,
              forceNotLink
            )
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
      this.logService.error(
        "Update paper failed",
        error as Error,
        true,
        "Entity"
      );
    }

    return updatedPaperEntities;
  }

  /**
   * Scrape paper entities.
   * @param paperEntities - The list of paper entities.
   * @returns
   */
  @processing(ProcessingKey.General)
  async scrape(paperEntities: PaperEntity[]) {
    this.logService.info(
      `Scraping ${paperEntities.length} paper(s)...`,
      "",
      true,
      "Entity"
    );

    try {
      paperEntities = await Promise.all(
        paperEntities.map((paperEntityDraft) =>
          this.scraperRepository.scrape(paperEntityDraft)
        )
      );
    } catch (error) {
      this.logService.error(
        "Scrape paper failed",
        error as Error,
        true,
        "Entity"
      );
    }

    await this.update(paperEntities);
  }

  /**
   * Scrape paper entities from a specific scraper.
   * @param paperEntities - The list of paper entities.
   * @param scraperName - The name of the scraper.
   * @returns
   */
  @processing(ProcessingKey.General)
  async scrapeFrom(paperEntities: PaperEntity[], scraperName: string) {
    // TODO: merge this with function scrape
    this.logService.info(
      `Scraping ${paperEntities.length} paper(s)...`,
      "",
      true,
      "Entity"
    );

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
      this.logService.error(
        "Scrape paper failed",
        error as Error,
        true,
        "Entity"
      );
    }

    await this.update(paperEntities);
  }

  /**
   * Update paper entities with a categorizer.
   * @param ids - The list of paper IDs.
   * @param categorizer - The categorizer.
   * @param type - The type of the categorizer.
   * @returns
   */
  @processing(ProcessingKey.General)
  async updateWithCategorizer(
    ids: (string | ObjectId)[],
    categorizer: Categorizer,
    type: CategorizerType
  ) {
    this.logService.info(
      `Updating ${ids.length} paper(s)...`,
      "",
      true,
      "Entity"
    );

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
      this.logService.error(
        `Add paper to ${categorizer.name} failed`,
        error as Error,
        true,
        "Entity"
      );
    }
  }

  /**
   * Colorize a categorizer.
   * @param color - The color.
   * @param type - The type of the categorizer.
   * @param name - The name of the categorizer.
   * @param categorizer - The categorizer.
   * @returns
   */
  @processing(ProcessingKey.General)
  async colorizeCategorizer(
    color: Colors,
    type: CategorizerType,
    name?: string,
    categorizer?: Categorizer
  ) {
    try {
      await this.dbRepository.colorizeCategorizer(
        color,
        type,
        categorizer,
        name
      );
    } catch (error) {
      this.logService.error(
        `Failed to colorize categorizer ${type} ${name} ${categorizer}`,
        error as Error,
        true,
        "Entity"
      );
    }
  }

  /**
   * Rename a categorizer.
   * @param oldName - The old name.
   * @param newName - The new name.
   * @param type - The type of the categorizer.
   * @returns
   */
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
      this.stateService.selectionState.pluginLinkedFolder === oldName &&
      success
    ) {
      this.stateService.selectionState.pluginLinkedFolder = newName;
      this.preferenceService.set({ pluginLinkedFolder: newName });
    }
  }

  /**
   * Create a new smart filter.
   * @param name - The name of the smart filter.
   * @param type - The type of the smart filter.
   * @returns
   */
  @processing(ProcessingKey.General)
  async insertPaperSmartFilter(
    smartfilter: PaperSmartFilter,
    type: PaperSmartFilterType
  ) {
    this.logService.info(
      `Inserting smart filter ${smartfilter.name}...`,
      "",
      true,
      "Entity"
    );

    try {
      await this.dbRepository.insertPaperSmartFilter(type, smartfilter);
    } catch (error) {
      this.logService.error(
        `Insert smart filter failed: ${type} ${smartfilter}`,
        error as Error,
        true,
        "Entity"
      );
    }
  }

  /**
   * Colorize a smart filter.
   * @param color - The color.
   * @param type - The type of the smart filter.
   * @param name - The name of the smart filter.
   * @param smartfilter - The smart filter.
   * @returns
   */
  @processing(ProcessingKey.General)
  async colorizePaperSmartFilter(
    color: Colors,
    type: PaperSmartFilterType,
    name?: string,
    smartfilter?: PaperSmartFilter
  ) {
    try {
      await this.dbRepository.colorizePaperSmartFilter(
        color,
        type,
        smartfilter,
        name
      );
    } catch (error) {
      this.logService.error(
        `Failed to colorize smart filter ${type} ${name} ${smartfilter}`,
        error as Error,
        true,
        "Entity"
      );
    }
  }

  /**
   * Update entity cache.
   * @param paperEntities - The paper entities.
   * @returns
   */
  async updateCache(paperEntities: PaperEntity[]) {
    // TODO: move to an individual cache service.
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
      this.logService.error(
        `Update cache failed`,
        error as Error,
        true,
        "Entity"
      );
    }
  }

  /**
   * Update entity thumbnail cache.
   * @param paperEntity - The paper entity.
   * @param thumbnailCache - The thumbnail cache.
   * @returns
   */
  async updateThumbnailCache(
    paperEntity: PaperEntity,
    thumbnailCache: ThumbnailCache
  ) {
    // TODO: move to an individual cache service.
    try {
      await this.dbRepository.updatePaperEntityCacheThumbnail(
        paperEntity,
        thumbnailCache
      );
    } catch (error) {
      this.logService.error(
        `Update thumbnail cache failed`,
        error as Error,
        true,
        "Entity"
      );
    }
  }

  /**
   * Locate the main file of a paper entity.
   * @param paperEntities - The paper entities.
   * @returns
   */
  @processing(ProcessingKey.General)
  async locateMainFile(paperEntities: PaperEntity[]) {
    this.logService.info(
      `Locating main file for ${paperEntities.length} paper(s)...`,
      "",
      true,
      "Entity"
    );

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
      this.logService.error(
        "Download paper failed",
        error as Error,
        true,
        "Entity"
      );
    }

    return updatedPaperEntities;
  }

  /**
   * Rename all paper entities.
   * @returns
   */
  @processing(ProcessingKey.General)
  async renameAll() {
    this.logService.info(`Renaming all paper(s)...`, "", true, "Entity");
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
      this.logService.error(
        "Rename all paper failed",
        error as Error,
        true,
        "Entity"
      );
    }
  }

  // ========================
  // Export
  // ========================

  /**
   * Export paper entities.
   * @param paperEntities - The paper entities.
   * @param format - The format.
   * @returns
   */
  async export(paperEntities: PaperEntity[], format: string) {
    let paperEntityDrafts = paperEntities.map((paperEntity) => {
      return new PaperEntity(false).initialize(paperEntity);
    });

    let copyStr = "";
    if (format === "BibTex") {
      // TODO: referenceRepository should be a service.
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

  // TODO: routine task

  // ========================
  // Dev Functions
  // ========================
  async addDummyData() {
    // TODO: disable in production
    await this.dbRepository.addDummyData();
  }

  async removeAll() {
    await this.dbRepository.removeAll();
  }
}
