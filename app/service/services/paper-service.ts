import { chunkRun } from "@/base/chunk";
import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { PaperFilterOptions } from "@/base/filter";
import { createDecorator } from "@/base/injection/injection";
import { ILogService, LogService } from "@/common/services/log-service";
import { ProcessingKey, processing } from "@/common/utils/processing";
import {
  Categorizer,
  CategorizerType,
  PaperFolder,
  PaperTag,
} from "@/models/categorizer";
import { Entity, IEntityCollection, IEntityObject } from "@/models/entity";
import { OID } from "@/models/id";
import { DatabaseCore, IDatabaseCore } from "@/service/services/database/core";

import { uid } from "@/base/misc";
import { getDefaultSupplementaryFileURL, getProtocol } from "@/base/url";
import { ISupplementary, Supplementary } from "@/models/supplementary";
import {
  IPaperEntityRepository,
  PaperEntityRepository,
} from "../repositories/db-repository/paper-entity-repository";
import { CacheService, ICacheService } from "./cache-service";
import { FileService, IFileService } from "./file-service";
import { ISchedulerService, SchedulerService } from "./scheduler-service";
import { IScrapeService, ScrapeService } from "./scrape-service";

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
  ): Promise<IEntityCollection> {
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
      return [];
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
   * @param fromSync - Is from sync, default is false
   * @returns Updated paper entities
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to update paper entities.", true, "PaperService", [])
  async update(
    paperEntityDrafts: IEntityCollection,
    updateCache: boolean = true,
    isUpdate = false,
    fromSync: boolean = false
  ): Promise<IEntityCollection> {
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
    // #region 0. Add sync logs
    if (!fromSync) {
      await PLAPILocal.syncService.addSyncLog("paper", "update", {
        paperEntityDrafts,
        updateCache,
        isUpdate,
      });
    }

    // #endregion =================================================

    // ========================================================
    // #region 1. Move files to the app lib folder
    let { results: fileMovedPaperEntityDrafts, errors } = await chunkRun<
      IEntityObject,
      IEntityObject,
      IEntityObject
    >(
      paperEntityDrafts,
      async (paperEntityDraft) => {
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

    // #endregion ========================================================

    // ========================================================
    // #region 2. Update database
    const realm = await this._databaseCore.realm();
    const updatedPaperEntityDrafts: (Entity | null)[] = [];

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
            "Failed to add the paper.",
            `May be duplicated: ${paperEntity.title}`,
            true,
            "PaperService"
          );
        }
      } catch (error) {
        success = false;
        this._logService.error(
          "Failed to update paper entity.",
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
        getDefaultSupplementaryFileURL(fileMovedPaperEntityDraft) !==
        getDefaultSupplementaryFileURL(updatedPaperEntityDraft)
      ) {
        this._fileService.moveFile(
          getDefaultSupplementaryFileURL(fileMovedPaperEntityDraft)!,
          getDefaultSupplementaryFileURL(updatedPaperEntityDraft)!
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
    ) as IEntityCollection;

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

    let paperEntityDrafts = paperEntities.map((paperEntity: Entity) => {
      return new Entity(paperEntity);
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
   * @param sups - The supplementary objects.
   * @param defaultSup - The default supplementary file ID.
   * @returns The updated paper entities.
   */
  @processing(ProcessingKey.General)
  @errorcatching(
    "Failed to update paper entitiy's main file.",
    true,
    "PaperService",
    []
  )
  async updateSups(
    paperEntity: Entity,
    sups: ISupplementary[],
    defaultSup?: string
  ) {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }

    for (let sup of sups) {
      sup = new Supplementary(sup);

      if (sup._id === defaultSup) {
        paperEntity.defaultSup = sup._id;
      }
      paperEntity.supplementaries[sup._id] = sup as Supplementary;
    }
    paperEntity = await this._fileService.move(paperEntity);

    const updatedPaperEntities = await this.update([paperEntity], false, true);
    if (
      defaultSup &&
      getProtocol(paperEntity.supplementaries[defaultSup].url) === "file"
    ) {
      await this._cacheService.updateCache([paperEntity]);
    }

    return updatedPaperEntities;
  }

  /**
   * Delete paper entities.
   * @param ids - Paper entity ids
   * @param paperEntities - Paper entities
   * @param fromSync - Is from sync, default is false
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to delete paper entities.", true, "PaperService")
  async delete(
    ids?: OID[],
    paperEntities?: Entity[],
    fromSync: boolean = false
  ) {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }
    this._logService.info(
      `Deleting ${ids?.length + " " || ""}paper(s)...`,
      "",
      false,
      "Entity"
    );

    if (!fromSync) {
      // FIXME: write log only if using sync.
      await PLAPILocal.syncService.addSyncLog("paper", "delete", {
        ids,
        paperEntities,
      });
    }

    const toBeDeletedFiles = this._paperEntityRepository.delete(
      await this._databaseCore.realm(),
      ids,
      paperEntities
    );

    await Promise.all(
      toBeDeletedFiles.map((url) => {
        if (url) {
          return this._fileService.removeFile(url);
        } else {
          return Promise.resolve();
        }
      })
    );

    const cacheIds = ids || paperEntities?.map((entity) => entity._id);
    if (cacheIds) await this._cacheService.delete(cacheIds);
  }

  /**
   * Delete suplementaries.
   * @param paperEntity - The paper entity.
   * @param sups - The list of supplementary objects.
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to delete supplementary file.", true, "PaperService")
  async deleteSups(paperEntity: Entity, supIds: string[]) {
    this._logService.info(`Removing supplementaries...`, "", true, "Entity");

    const toBeDeletedFiles = supIds
      .map((supId) => {
        const sup = paperEntity.supplementaries[supId];
        if (sup && getProtocol(sup.url) === "file") {
          return sup.url;
        } else {
          return null;
        }
      })
      .filter((url) => url !== null);

    await Promise.all(
      toBeDeletedFiles.map((url) => this._fileService.removeFile(url))
    );
    paperEntity.supplementaries = Object.fromEntries(
      Object.entries(paperEntity.supplementaries).filter(
        ([key]) => !supIds.includes(key)
      )
    );

    if (paperEntity.defaultSup && supIds.includes(paperEntity.defaultSup)) {
      if (Object.keys(paperEntity.supplementaries).length > 0) {
        paperEntity.defaultSup = Object.keys(paperEntity.supplementaries)[0];
      } else {
        paperEntity.defaultSup = undefined;
      }
    }

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
    // FIXME: fix this bypass for debug
    // const scrapedPaperEntityDrafts = await this._scrapeService.scrape(
    //   payloads,
    //   [],
    //   false
    // );

    const scrapedPaperEntityDrafts = urlList.map((url) => {
      const paperEntityDraft = new Entity({
        title: `Paper from file ${url}`,
        year: "2025",
        booktitle: "Test booktitle",
        type: "inproceedings",
      });
      const supId = uid();
      paperEntityDraft.supplementaries = {
        [supId]: new Supplementary({
          _id: supId,
          url: url,
        }),
      };
      paperEntityDraft.defaultSup = supId;
      return paperEntityDraft;
    });

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
  async scrape(paperEntities: IEntityCollection, specificScrapers?: string[]) {
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
        return new Entity(paperEntity);
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
    if (
      (await PLMainAPI.preferenceService.get("allowRoutineMatch")) as boolean
    ) {
      if (
        Math.round(Date.now() / 1000) -
          ((await PLMainAPI.preferenceService.get(
            "lastRematchTime"
          )) as number) <
        7 * 86400 - 10
      ) {
        return;
      }
      await this.scrapePreprint();
      await PLMainAPI.preferenceService.set({
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
    const paperEntityDrafts = paperEntities.map((paperEntity: Entity) => {
      return new Entity(paperEntity);
    });

    const movedEntityDrafts = await Promise.all(
      paperEntityDrafts.map((paperEntityDraft: Entity) =>
        this._fileService.move(paperEntityDraft)
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
    // TODO: implement this
    // const localConfig = await this._databaseCore.getLocalConfig(false);
    // const localRealm = new Realm(localConfig);
    // const entities = localRealm.objects<PaperEntity>("PaperEntity");
    // await this.update(
    //   entities.map((entity) => new PaperEntity(entity)),
    //   false,
    //   true
    // );
    // this._logService.info(
    //   `Migrated ${entities.length} paper(s) to cloud database.`,
    //   "",
    //   true,
    //   "PaperService"
    // );
    // localRealm.close();
  }
}
