import path from "path";

import { chunkRun } from "@/base/chunk";
import { DatabaseCore, IDatabaseCore } from "@/base/database/core";
import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { formatString } from "@/base/string";
import { ILogService, LogService } from "@/common/services/log-service";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import {
  Categorizer,
  CategorizerType,
  PaperFolder,
  PaperTag,
} from "@/models/categorizer";
import { OID } from "@/models/id";
import { PaperEntity } from "@/models/paper-entity";
import { CacheService, ICacheService } from "@/renderer/services/cache-service";
import { FileService, IFileService } from "@/renderer/services/file-service";
import {
  ISchedulerService,
  SchedulerService,
} from "@/renderer/services/scheduler-service";
import {
  IScrapeService,
  ScrapeService,
} from "@/renderer/services/scrape-service";
import { ProcessingKey, processing } from "@/renderer/services/uistate-service";
import {
  IPaperEntityCollection,
  IPaperEntityObject,
  IPaperEntityRepository,
  PaperEntityRepository,
} from "@/repositories/db-repository/paper-entity-repository";

export interface IPaperFilterOptions {
  search?: string;
  searchMode?: "general" | "fulltext" | "advanced";
  flaged?: boolean;
  tag?: string;
  folder?: string;
  limit?: number;
}

export class PaperFilterOptions implements IPaperFilterOptions {
  public filters: string[] = [];
  public search?: string;
  public searchMode?: "general" | "fulltext" | "advanced";
  public flaged?: boolean;
  public tag?: string;
  public folder?: string;
  public limit?: number;

  constructor(options?: Partial<IPaperFilterOptions>) {
    if (options) {
      this.update(options);
    }
  }

  update(options: Partial<IPaperFilterOptions>) {
    for (const key in options) {
      this[key] = options[key];
    }

    this.filters = [];

    if (this.search) {
      let formatedSearch = formatString({
        str: this.search,
        removeNewline: true,
        trimWhite: true,
      });

      if (!this.searchMode || this.searchMode === "general") {
        const fuzzyFormatedSearch = `*${formatedSearch
          .trim()
          .split(" ")
          .join("*")}*`;
        this.filters.push(
          `(title LIKE[c] \"${fuzzyFormatedSearch}\" OR authors LIKE[c] \"${fuzzyFormatedSearch}\" OR publication LIKE[c] \"${fuzzyFormatedSearch}\" OR note LIKE[c] \"${fuzzyFormatedSearch}\")`
        );
      } else if (this.searchMode === "advanced") {
        formatedSearch = PaperFilterOptions.parseDateFilter(formatedSearch);
        this.filters.push(formatedSearch);
      } else if (this.searchMode === "fulltext") {
        this.filters.push(`(fulltext contains[c] \"${formatedSearch}\")`);
      }
    }

    if (this.flaged) {
      this.filters.push(`(flag == true)`);
    }
    if (this.tag) {
      this.filters.push(`(ANY tags.name == \"${this.tag}\")`);
    }
    if (this.folder) {
      this.filters.push(`(ANY folders.name == \"${this.folder}\")`);
    }
  }

  static checkIsDateFilter(dateFilter: string) {
    return dateFilter.match(/(<|<=|>|>=)\s*\[\d+ DAYS\]/g);
  }

  static parseDateFilter(dateFilter: string) {
    const compareDateMatch = dateFilter.match(/(<|<=|>|>=)\s*\[\d+ DAYS\]/g);
    if (compareDateMatch) {
      for (const match of compareDateMatch) {
        if (dateFilter.includes("<")) {
          dateFilter = dateFilter.replaceAll(match, match.replaceAll("<", ">"));
        } else if (dateFilter.includes(">")) {
          dateFilter = dateFilter.replaceAll(match, match.replaceAll(">", "<"));
        }
      }
    }

    // Replace Date string
    const dateRegex = /\[\d+ DAYS\]/g;
    const dateMatch = dateFilter.match(dateRegex);
    if (dateMatch) {
      const date = new Date();
      // replace with date like: 2021-02-20@17:30:15:00
      date.setDate(date.getDate() - parseInt(dateMatch[0].slice(1, -6)));
      dateFilter = dateFilter.replace(
        dateRegex,
        date.toISOString().slice(0, -5).replace("T", "@")
      );
    }

    return dateFilter;
  }

  toString() {
    const filterStr = this.filters.join(" AND ");
    if (this.limit) {
      return `${filterStr} LIMIT(${this.limit})`;
    } else {
      return filterStr;
    }
  }
}

export interface IPaperServiceState {
  count: number;
  updated: number;
}

export const IPaperService = createDecorator("paperService");

/**
 * Service for paper entity operations.
 */
export class PaperService extends Eventable<IPaperServiceState> {
  constructor(
    @IDatabaseCore private readonly _databaseCore: DatabaseCore,
    @IPaperEntityRepository
    private readonly _paperEntityRepository: PaperEntityRepository,
    @IScrapeService private readonly _scrapeService: ScrapeService,
    @ICacheService private readonly _cacheService: CacheService,
    @ISchedulerService private readonly _schedulerService: SchedulerService,
    @IFileService private readonly _fileService: FileService,
    @IPreferenceService private readonly _preferenceService: PreferenceService,
    @ILogService private readonly _logService: LogService
  ) {
    super("paperService", {
      count: 0,
      updated: 0,
    });

    this._paperEntityRepository.on(["count", "updated"], (payload) => {
      this.fire({
        [payload.key]: payload.value,
      });
    });

    this._databaseCore.already("dbInitialized", () => {
      this._schedulerService.createTask(
        "paperServiceScrapePreprint",
        () => {
          this._routineScrapePreprint();
        },
        7 * 86400,
        undefined,
        true,
        false,
        60000
      );
    });
  }

  /**
   * Load paper entities with filter and sort.
   * @param querySentence - Query sentence, string or PaperFilterOptions
   * @param sortBy - Sort by
   * @param sortOrder - Sort order
   * @param fulltextQuerySentence - Fulltext query sentence
   * @returns Paper entities
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to load paper entities.", true, "PaperService", [])
  async load(
    querySentence: string,
    sortBy: string = "addTime",
    sortOrder: "asce" | "desc",
    fulltextQuerySentence?: string
  ): Promise<IPaperEntityCollection> {
    if (this._databaseCore.getState("dbInitializing")) {
      return [];
    }

    if (fulltextQuerySentence) {
      const allPaperEntities = this._paperEntityRepository.load(
        await this._databaseCore.realm(),
        querySentence,
        sortBy,
        sortOrder
      );

      return this._cacheService.fullTextFilter(
        fulltextQuerySentence,
        allPaperEntities
      );
    } else {
      if (PaperFilterOptions.checkIsDateFilter(querySentence)) {
        querySentence = PaperFilterOptions.parseDateFilter(querySentence);
      }

      return this._paperEntityRepository.load(
        await this._databaseCore.realm(),
        querySentence,
        sortBy,
        sortOrder
      );
    }
  }

  /**
   * Load paper entities by IDs.
   * @param ids - Paper entity ids
   * @returns Paper entities
   */
  @processing(ProcessingKey.General)
  @errorcatching(
    "Failed to load paper entities by Ids.",
    true,
    "PaperService",
    []
  )
  async loadByIds(ids: OID[]) {
    if (this._databaseCore.getState("dbInitializing")) {
      return [];
    }
    return this._paperEntityRepository.loadByIds(
      await this._databaseCore.realm(),
      ids
    );
  }

  /**
   * Update paper entities.
   * @param paperEntityDrafts - paper entity drafts
   * @param updateCache - Update cache, default is true
   * @param isUpdate - Is update, default is false, if false, it is insert. This is for preventing insert duplicated papers.
   * @returns Updated paper entities
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to update paper entities.", true, "PaperService", [])
  async update(
    paperEntityDrafts: IPaperEntityCollection,
    updateCache: boolean = true,
    isUpdate = false
  ): Promise<IPaperEntityCollection> {
    if (this._databaseCore.getState("dbInitializing")) {
      return [];
    }
    this._logService.info(
      `Updating ${paperEntityDrafts.length} paper(s)...`,
      "",
      false,
      "PaperService"
    );

    // ========================================================
    // #region 1. Move files to the app lib folder
    let { results: fileMovedPaperEntityDrafts, errors } = await chunkRun<
      IPaperEntityObject,
      IPaperEntityObject,
      IPaperEntityObject
    >(
      paperEntityDrafts,
      async (paperEntityDraft) => {
        if (
          !(await this._fileService.access(paperEntityDraft.mainURL, false)) &&
          paperEntityDraft.mainURL
        ) {
          PLAPI.logService.warn(
            `File doesn't exist anymore.`,
            `${paperEntityDraft.mainURL}`,
            true,
            "PaperService"
          );
          paperEntityDraft.mainURL = "";
        }

        return await this._fileService.move(paperEntityDraft);
      },
      async (paperEntityDraft) => {
        return paperEntityDraft;
      }
    );
    errors.forEach((error) => {
      this._logService.error(
        "Failed to move file.",
        error as Error,
        true,
        "PaperService"
      );
    });

    // filter paper entities with files that are not moved (still absolute path)
    fileMovedPaperEntityDrafts = fileMovedPaperEntityDrafts.map(
      (paperEntityDraft) => {
        if (
          paperEntityDraft.mainURL &&
          path.isAbsolute(paperEntityDraft.mainURL)
        ) {
          paperEntityDraft.mainURL = "";
        }

        paperEntityDraft.supURLs = paperEntityDraft.supURLs.filter((url) => {
          return path && !path.isAbsolute(url);
        });
        return paperEntityDraft;
      }
    );
    // #endregion ========================================================

    // ========================================================
    // #region 2. Update database
    const realm = await this._databaseCore.realm();
    const updatedPaperEntityDrafts: (PaperEntity | null)[] = [];

    for (const paperEntity of fileMovedPaperEntityDrafts) {
      let success: boolean;
      try {
        success = this._paperEntityRepository.update(
          realm,
          paperEntity,
          this._databaseCore.getPartition(),
          isUpdate
        );

        if (!success && !isUpdate) {
          this._logService.warn(
            "Faild to add the paper.",
            `May be duplicated: ${paperEntity.title}`,
            true,
            "PaperService"
          );
        }
      } catch (error) {
        success = false;
        this._logService.error(
          "Faild to update paper entity.",
          error as Error,
          true,
          "PaperService"
        );
      }

      updatedPaperEntityDrafts.push(success ? paperEntity : null);
    }

    // handle files of failed updated paper entities
    for (const i in updatedPaperEntityDrafts) {
      const fileMovedPaperEntityDraft = fileMovedPaperEntityDrafts[i];
      const updatedPaperEntityDraft = updatedPaperEntityDrafts[i];

      if (updatedPaperEntityDraft === null) {
        this._fileService.remove(fileMovedPaperEntityDraft);
      } else if (
        fileMovedPaperEntityDraft.mainURL !== updatedPaperEntityDraft.mainURL
      ) {
        this._fileService.moveFile(
          fileMovedPaperEntityDraft.mainURL,
          updatedPaperEntityDraft.mainURL
        );
      }
    }
    // #endregion ========================================================

    // ========================================================
    // #region 3. Create cache
    const successfulEntityDrafts = updatedPaperEntityDrafts.filter(
      (paperEntityDraft) => {
        return paperEntityDraft !== null;
      }
    ) as IPaperEntityCollection;

    // Don't wait this
    if (updateCache) {
      this._cacheService.updateFullTextCache(successfulEntityDrafts);
    }

    return successfulEntityDrafts;
  }

  /**
   * Update paper entities with a categorizer.
   * @param ids - The list of paper IDs.
   * @param categorizer - The categorizer.
   * @param type - The type of the categorizer.
   */
  @processing(ProcessingKey.General)
  @errorcatching(
    "Failed to update paper entities with categorizer.",
    true,
    "PaperService",
    []
  )
  async updateWithCategorizer(
    ids: OID[],
    categorizer: Categorizer,
    type: CategorizerType
  ) {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }
    // 1. Get Entities by IDs.
    const paperEntities = await this.loadByIds(ids);

    let paperEntityDrafts = paperEntities.map((paperEntity: PaperEntity) => {
      return new PaperEntity(paperEntity);
    });

    paperEntityDrafts = paperEntityDrafts.map((paperEntityDraft) => {
      if (type === CategorizerType.PaperTag) {
        paperEntityDraft.tags = paperEntityDraft.tags
          .filter((tag) => `${tag._id}` !== `${categorizer._id}`)
          .filter((tag) => tag.name !== categorizer.name);

        paperEntityDraft.tags.push(new PaperTag(categorizer));
      } else if (type === CategorizerType.PaperFolder) {
        paperEntityDraft.folders = paperEntityDraft.folders
          .filter((folder) => `${folder._id}` !== `${categorizer._id}`)
          .filter((folder) => folder.name !== categorizer.name);

        paperEntityDraft.folders.push(new PaperFolder(categorizer));
      }

      return paperEntityDraft;
    });

    await this.update(paperEntityDrafts, false, true);
  }

  /**
   * Update the main file of a paper entity.
   * @param paperEntity - The paper entity.
   * @param url - The URL of the main file.
   * @returns The updated paper entity.
   */
  @processing(ProcessingKey.General)
  @errorcatching(
    "Failed to update paper entitiy's main file.",
    true,
    "PaperService",
    []
  )
  async updateMainURL(paperEntity: PaperEntity, url: string) {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }

    if (paperEntity.mainURL) {
      await this._fileService.removeFile(paperEntity.mainURL);
    }
    paperEntity.mainURL = url;
    paperEntity = await this._fileService.move(paperEntity, true, false);

    const updatedPaperEntities = await this.update([paperEntity], false, true);
    await this._cacheService.updateCache([paperEntity]);

    return updatedPaperEntities[0];
  }

  /**
   * Update the supplementary files of a paper entity.
   * @param paperEntity - The paper entity.
   * @param urls - The URLs of the supplementary files.
   */
  @processing(ProcessingKey.General)
  @errorcatching(
    "Failed to update paper entity's supplementary files.",
    true,
    "PaperService"
  )
  async updateSupURLs(paperEntity: PaperEntity, urls: string[]) {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }

    paperEntity.supURLs.push(...urls);
    paperEntity = await this._fileService.move(paperEntity, false, true);

    await this.update([paperEntity], false, true);
  }

  /**
   * Delete paper entities.
   * @param ids - Paper entity ids
   * @param paperEntity - Paper entities
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to delete paper entities.", true, "PaperService")
  async delete(ids?: OID[], paperEntities?: PaperEntity[]) {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }
    this._logService.info(
      `Deleting ${ids?.length + " " || ""}paper(s)...`,
      "",
      false,
      "Entity"
    );
    const toBeDeletedFiles = this._paperEntityRepository.delete(
      await this._databaseCore.realm(),
      ids,
      paperEntities
    );

    await Promise.all(
      toBeDeletedFiles.map((url) => {
        if (url) {
          return this._fileService.removeFile(url);
        }
      })
    );

    const cacheIds = ids || paperEntities?.map((entity) => entity._id);
    if (cacheIds) await this._cacheService.delete(cacheIds);
  }

  /**
   * Delete a suplementary file.
   * @param paperEntity - The paper entity.
   * @param url - The URL of the supplementary file.
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to delete supplementary file.", true, "PaperService")
  async deleteSup(paperEntity: PaperEntity, url: string) {
    this._logService.info(
      `Removing supplementary file...`,
      `${url}`,
      true,
      "Entity"
    );
    const realURL = url.split(":::").pop() as string;
    await this._fileService.removeFile(realURL);
    paperEntity.supURLs = paperEntity.supURLs.filter(
      (supUrl) => !url.endsWith(supUrl)
    );

    await this.update([paperEntity], false, true);
  }

  /**
   * Set a custom display name of a supplementary file.
   */
  @processing(ProcessingKey.General)
  @errorcatching(
    "Failed to set custom display name of a supplementary file.",
    true,
    "PaperService"
  )
  async setSupDisplayName(paperEntity: PaperEntity, url: string, name: string) {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }

    paperEntity.supURLs = paperEntity.supURLs.map((supURL) => {
      if (supURL === url) {
        const realSupURL = supURL.split(":::").pop();
        return `${name}:::${realSupURL}`;
      } else {
        return supURL;
      }
    });

    await this.update([paperEntity], false, true);
  }

  /**
   * Create paper entity from file URLs.
   * @param urlList - The list of URLs.
   * @returns The list of paper entity drafts.
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to create paper entities.", true, "PaperService", [])
  async create(urlList: string[]) {
    // 1. Scrape
    const payloads = urlList.map((url) => {
      return { type: "file", value: url };
    });
    const scrapedPaperEntityDrafts = await this._scrapeService.scrape(
      payloads,
      [],
      false
    );

    // 2. Update.
    return await this.update(scrapedPaperEntityDrafts, true, false);
  }

  /**
   * Create paper entity from a URL with a given categorizer.
   * @param urlList - The list of URLs.
   * @param categorizer - The categorizer.
   * @param type - The type of categorizer.
   * @returns The list of paper entity drafts.
   */
  @processing(ProcessingKey.General)
  @errorcatching(
    "Failed to create paper entities with categorizer.",
    true,
    "PaperService",
    []
  )
  async createIntoCategorizer(
    urlList: string[],
    categorizer: Categorizer,
    type: CategorizerType
  ) {
    if (this._databaseCore.getState("dbInitializing")) {
      return [];
    }
    const paperEntityDrafts = await this.create(urlList);

    const toBeUpdatedPaperEntityDrafts = paperEntityDrafts.map(
      (paperEntityDraft) => {
        if (type === CategorizerType.PaperTag) {
          paperEntityDraft.tags.push(new PaperTag(categorizer));
        } else if (type === CategorizerType.PaperFolder) {
          paperEntityDraft.folders.push(new PaperFolder(categorizer));
        }
        return paperEntityDraft;
      }
    );
    return await this.update(toBeUpdatedPaperEntityDrafts, false, true);
  }

  /**
   * Scrape paper entities.
   * @param paperEntities - The list of paper entities.
   * @param specificScrapers - The list of specific scrapers.
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to scrape metadata.", true, "PaperService")
  async scrape(
    paperEntities: IPaperEntityCollection,
    specificScrapers?: string[]
  ) {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }
    this._logService.info(
      `Scraping ${paperEntities.length} paper(s)...`,
      "",
      true,
      "PaperService"
    );

    const scrapedPaperEntityDrafts = await this._scrapeService.scrape(
      paperEntities.map((paperEntity) => {
        return {
          type: "PaperEntity",
          value: paperEntity,
        };
      }),
      specificScrapers || [],
      specificScrapers ? true : false
    );

    await this.update(scrapedPaperEntityDrafts, false, true);
  }

  /**
   * Scrape preprint paper entities.
   */
  @processing(ProcessingKey.General)
  @errorcatching(
    "Failed to scrape metadata of preprints.",
    true,
    "PaperService"
  )
  async scrapePreprint() {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }
    this._logService.info(
      `Scraping metadata of preprint paper(s)...`,
      "",
      true,
      "PaperService"
    );
    const preprintPaperEntities = this._paperEntityRepository.load(
      await this._databaseCore.realm(),
      '(publication contains[c] "arXiv") OR (publication contains[c] "openreview") OR publication == ""',
      "addTime",
      "desc"
    );
    await this.scrape(
      preprintPaperEntities.map((paperEntity) => {
        return new PaperEntity(paperEntity);
      })
    );
  }

  /**
   * Scrape preprint paper entities.
   */
  @processing(ProcessingKey.General)
  @errorcatching(
    "Failed to scrape metadata of preprints.",
    true,
    "PaperService"
  )
  async _routineScrapePreprint() {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }
    if (this._preferenceService.get("allowRoutineMatch") as boolean) {
      if (
        Math.round(Date.now() / 1000) -
          (this._preferenceService.get("lastRematchTime") as number) <
        7 * 86400 - 10
      ) {
        return;
      }
      await this.scrapePreprint();
      this._preferenceService.set({
        lastRematchTime: Math.round(Date.now() / 1000),
      });
    }
  }

  /**
   * Rename all paper entities.
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to rename all paper entities.", true, "PaperService")
  async renameAll() {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }
    this._logService.info(`Renaming all paper(s)...`, "", true, "PaperService");
    let paperEntities = await this.load("", "title", "desc");
    const paperEntityDrafts = paperEntities.map((paperEntity: PaperEntity) => {
      return new PaperEntity(paperEntity);
    });

    const movedEntityDrafts = await Promise.all(
      paperEntityDrafts.map((paperEntityDraft: PaperEntity) =>
        this._fileService.move(paperEntityDraft, true, true)
      )
    );

    for (let i = 0; i < movedEntityDrafts.length; i++) {
      if (movedEntityDrafts[i] === null) {
        movedEntityDrafts[i] = paperEntityDrafts[i];
      }
    }

    await this.update(movedEntityDrafts, false, true);
  }

  /**
   * Migrate the local database to the cloud database. */
  @errorcatching(
    "Failed to migrate the local paper entities to the cloud database.",
    true,
    "DatabaseService"
  )
  async migrateLocaltoCloud() {
    const localConfig = await this._databaseCore.getLocalConfig(false);
    const localRealm = new Realm(localConfig);

    const entities = localRealm.objects<PaperEntity>("PaperEntity");

    await this.update(
      entities.map((entity) => new PaperEntity(entity)),
      false,
      true
    );

    this._logService.info(
      `Migrated ${entities.length} paper(s) to cloud database.`,
      "",
      true,
      "PaperService"
    );

    localRealm.close();
  }
}
