import { ObjectId } from "bson";
import path from "path";

import { chunkRun } from "@/base/chunk";
import { DatabaseCore, IDatabaseCore } from "@/base/database/core";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import {
  Categorizer,
  CategorizerType,
  PaperFolder,
  PaperTag,
} from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import {
  CategorizerRepository,
  ICategorizerRepository,
} from "@/repositories/db-repository/categorizer-repository-v2";
import {
  IPaperEntityRepository,
  PaperEntityRepository,
} from "@/repositories/db-repository/paper-repository";
import { CacheService, ICacheService } from "@/services/cache-service";
import { FileService, IFileService } from "@/services/file-service";
import { ILogService, LogService } from "@/services/log-service";
import { IScrapeService, ScrapeService } from "@/services/scrape-service";
import { ProcessingKey, processing } from "@/services/state-service/processing";
import { formatString } from "@/utils/string";

export interface IPaperServiceState {
  count: number;
  updated: number;
}

export interface IPaperFilterOptions {
  search?: string;
  searchMode?: "general" | "fulltext" | "advanced";
  flaged?: boolean;
  tag?: string;
  folder?: string;
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
    @ICategorizerRepository
    private readonly _categorizerRepository: CategorizerRepository,
    @IScrapeService private readonly _scrapeService: ScrapeService,
    @ICacheService private readonly _cacheService: CacheService,
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
  }

  constructFilter(filterOptions: IPaperFilterOptions) {
    let filter = "";

    if (filterOptions.search) {
      let formatedSearch = formatString({
        str: filterOptions.search,
        removeNewline: true,
        trimWhite: true,
      });

      if (!filterOptions.searchMode || filterOptions.searchMode === "general") {
        const fuzzyFormatedSearch = `*${formatedSearch
          .trim()
          .split(" ")
          .join("*")}*`;
        filter += `(title LIKE[c] \"${fuzzyFormatedSearch}\" OR authors LIKE[c] \"${fuzzyFormatedSearch}\" OR publication LIKE[c] \"${fuzzyFormatedSearch}\" OR note LIKE[c] \"${fuzzyFormatedSearch}\") AND `;
      } else if (filterOptions.searchMode === "advanced") {
        // Replace comparison operators for 'addTime'
        const compareDateMatch = formatedSearch.match(
          /(<|<=|>|>=)\s*\[\d+ DAYS\]/g
        );
        if (compareDateMatch) {
          for (const match of compareDateMatch) {
            if (formatedSearch.includes("<")) {
              formatedSearch = formatedSearch.replaceAll(
                match,
                match.replaceAll("<", ">")
              );
            } else if (formatedSearch.includes(">")) {
              formatedSearch = formatedSearch.replaceAll(
                match,
                match.replaceAll(">", "<")
              );
            }
          }
        }

        // Replace Date string
        const dateRegex = /\[\d+ DAYS\]/g;
        const dateMatch = formatedSearch.match(dateRegex);
        if (dateMatch) {
          const date = new Date();
          // replace with date like: 2021-02-20@17:30:15:00
          date.setDate(date.getDate() - parseInt(dateMatch[0].slice(1, -6)));
          formatedSearch = formatedSearch.replace(
            dateRegex,
            date.toISOString().slice(0, -5).replace("T", "@")
          );
        }
        filter += `${formatedSearch} `;
        return filter;
      }
    }

    if (filterOptions.flaged) {
      filter += "flag == true AND ";
    }
    if (filterOptions.tag) {
      filter += `(ANY tags.name == \"${filterOptions.tag}\") AND `;
    }
    if (filterOptions.folder) {
      filter += `(ANY folders.name == \"${filterOptions.folder}\") AND `;
    }

    if (filter.length > 0) {
      filter = filter.slice(0, -5);
    }

    return filter;
  }

  // TODO: can we use a decorator to do error log?
  /**
   * Load paper entities with filter and sort.
   * @param filter - filter string
   * @param sortBy - Sort: by
   * @param sortOrder - Sort: order
   * @returns - paper entities
   */
  @processing(ProcessingKey.General)
  async load(filter: string, sortBy: string, sortOrder: "asce" | "desc") {
    // TODO: fulltext filter
    try {
      return this._paperEntityRepository.load(
        await this._databaseCore.realm(),
        filter,
        sortBy,
        sortOrder
      );
    } catch (error) {
      this._logService.error(
        "Failed to load paper entities",
        error as Error,
        true,
        "PaperService"
      );
      return [] as PaperEntity[];
    }
  }

  /**
   * Load paper entities by ids.
   * @param ids - paper entity ids
   * @returns - paper entities
   */
  @processing(ProcessingKey.General)
  async loadByIds(ids: (string | ObjectId)[]) {
    try {
      return this._paperEntityRepository.loadByIds(
        await this._databaseCore.realm(),
        ids
      );
    } catch (error) {
      this._logService.error(
        "Failed to load paper entity by id",
        error as Error,
        true,
        "PaperService"
      );
      return [];
    }
  }

  /**
   * Update paper entities.
   * @param paperEntityDrafts - paper entity drafts
   * @param forceDelete - force delete
   * @param forceNotLink - force not link
   * @returns
   */
  @processing(ProcessingKey.General)
  async update(
    paperEntityDrafts: PaperEntity[],
    forceDelete = false,
    forceNotLink = true
  ): Promise<PaperEntity[]> {
    // TODO: why we need forceDelete and forceNotLink?

    this._logService.info(
      `Updating ${paperEntityDrafts.length} paper(s)...`,
      "",
      true,
      "PaperService"
    );

    // TODO: all exposed methods should be in try catch block
    try {
      // ========================================================
      // #region 1. Move files to the app lib folder
      let { results: fileMovedPaperEntityDrafts, errors } = await chunkRun<
        PaperEntity,
        PaperEntity
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
          "Failed to move file",
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
      const dbUpdatedPaperEntityDrafts = realm.safeWrite(
        (): (PaperEntity | null)[] => {
          const updatedPaperEntityDrafts: (PaperEntity | null)[] = [];

          for (const paperEntity of fileMovedPaperEntityDrafts) {
            let existingPaperEntity: PaperEntity | null = null;
            try {
              if (paperEntity._id) {
                const existingObjs = this._paperEntityRepository.loadByIds(
                  realm,
                  [paperEntity._id]
                );
                if (existingObjs.length > 0) {
                  existingPaperEntity = existingObjs[0];
                }
              }
            } catch (error) {}

            try {
              const tags = this._categorizerRepository.update(
                realm,
                existingPaperEntity ? existingPaperEntity.tags : [],
                paperEntity.tags,
                "PaperTag",
                this._databaseCore.getPartition()
              );
              const folders = this._categorizerRepository.update(
                realm,
                existingPaperEntity ? existingPaperEntity.folders : [],
                paperEntity.folders,
                "PaperFolder",
                this._databaseCore.getPartition()
              );

              const success = this._paperEntityRepository.update(
                realm,
                paperEntity,
                tags,
                folders,
                existingPaperEntity,
                this._databaseCore.getPartition()
              );
              updatedPaperEntityDrafts.push(
                success ? paperEntity : existingPaperEntity
              );
            } catch (error) {
              this._logService.error(
                "Cannot update paper entity",
                error as Error,
                true,
                "Database"
              );
              updatedPaperEntityDrafts.push(existingPaperEntity);
            }
          }

          return updatedPaperEntityDrafts;
        }
      );

      // handle files of failed updated paper entities
      for (const i in dbUpdatedPaperEntityDrafts) {
        const fileMovedPaperEntityDraft = fileMovedPaperEntityDrafts[i];
        const dbUpdatedPaperEntityDraft = dbUpdatedPaperEntityDrafts[i];

        if (dbUpdatedPaperEntityDraft === null) {
          this._fileService.remove(fileMovedPaperEntityDraft);
        } else if (
          fileMovedPaperEntityDraft.mainURL !==
          dbUpdatedPaperEntityDraft.mainURL
        ) {
          this._fileService.moveFile(
            fileMovedPaperEntityDraft.mainURL,
            dbUpdatedPaperEntityDraft.mainURL,
            forceDelete,
            forceNotLink
          );
        }
      }
      // #endregion ========================================================

      // ========================================================
      // #region 3. Create cache
      const successfulEntityDrafts = dbUpdatedPaperEntityDrafts.filter(
        (paperEntityDraft) => {
          return paperEntityDraft !== null;
        }
      ) as PaperEntity[];

      // Don't wait this
      this._cacheService.updateFullTextCache(successfulEntityDrafts);

      return successfulEntityDrafts;
    } catch (error) {
      this._logService.error(
        "Cannot update paper entity",
        error as Error,
        true,
        "PaperService"
      );
      return [];
    }
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
    try {
      // 1. Get Entities by IDs.
      const paperEntities = await this.loadByIds(ids);

      let paperEntityDrafts = paperEntities.map((paperEntity: PaperEntity) => {
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

      await this.update(paperEntityDrafts);
    } catch (error) {
      this._logService.error(
        `Failed to add paper to ${categorizer.name}`,
        error as Error,
        true,
        "PaperService"
      );
    }
  }

  /**
   * Delete paper entity.
   * @param ids - paper entity ids
   * @param paperEntity - paper entity
   * @returns - flag
   */
  @processing(ProcessingKey.General)
  async delete(ids?: (ObjectId | string)[], paperEntity?: PaperEntity) {
    this._logService.info(
      `Deleting ${ids?.length + " " || ""}paper(s)...`,
      "",
      false,
      "Entity"
    );
    try {
      return this._paperEntityRepository.delete(
        await this._databaseCore.realm(),
        ids,
        paperEntity
      );
    } catch (error) {
      this._logService.error(
        "Cannot delete paper entity",
        error as Error,
        true,
        "PaperService"
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
    this._logService.info(
      `Removing supplementary file...`,
      `${url}`,
      true,
      "Entity"
    );
    try {
      await this._fileService.removeFile(url);
      paperEntity.supURLs = paperEntity.supURLs.filter(
        (supUrl) => supUrl !== path.basename(url)
      );
      await this.update([paperEntity]);
    } catch (error) {
      this._logService.error(
        `Remove supplementary file failed: ${url}`,
        error as Error,
        true,
        "PaperService"
      );
    }
  }

  /**
   * Create paper entity from URLs.
   * @param urlList - The list of URLs.
   * @returns
   */
  @processing(ProcessingKey.General)
  async create(urlList: string[]) {
    try {
      // 1. Scrape
      const payloads = urlList.map((url) => {
        return { url };
      });
      const scrapedPaperEntityDrafts = await this._scrapeService.scrape(
        payloads,
        [],
        false
      );

      // 2. Update.
      return await this.update(scrapedPaperEntityDrafts);
    } catch (error) {
      this._logService.error(
        "Failed to Add papers to library",
        error as Error,
        true,
        "PaperService"
      );
      return [];
    }
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
    try {
      const paperEntityDrafts = await this.create(urlList);

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
      await this.update(toBeUpdatedPaperEntityDrafts);
    } catch (error) {
      this._logService.error(
        "Add paper to library failed",
        error as Error,
        true,
        "PaperService"
      );
    }
  }

  /**
   * Scrape paper entities.
   * @param paperEntities - The list of paper entities.
   * @returns
   */
  @processing(ProcessingKey.General)
  async scrape(paperEntities: PaperEntity[], specificScrapers?: string[]) {
    this._logService.info(
      `Scraping ${paperEntities.length} paper(s)...`,
      "",
      true,
      "PaperService"
    );

    try {
      // 1. Scrape
      const scrapedPaperEntityDrafts = await this._scrapeService.scrape(
        paperEntities,
        specificScrapers || [],
        specificScrapers ? true : false
      );

      await this.update(scrapedPaperEntityDrafts);
    } catch (error) {
      this._logService.error(
        "Failed to scrape metadata!",
        error as Error,
        true,
        "PaperService"
      );
    }
  }

  /**
   * Rename all paper entities.
   * @returns
   */
  @processing(ProcessingKey.General)
  async renameAll() {
    this._logService.info(`Renaming all paper(s)...`, "", true, "PaperService");
    try {
      let paperEntities = await this.load("", "title", "desc");
      const paperEntityDrafts = paperEntities.map(
        (paperEntity: PaperEntity) => {
          return new PaperEntity(false).initialize(paperEntity);
        }
      );

      const movedEntityDrafts = await Promise.all(
        paperEntityDrafts.map((paperEntityDraft: PaperEntity) =>
          this._fileService.move(paperEntityDraft, true, false)
        )
      );

      for (let i = 0; i < movedEntityDrafts.length; i++) {
        if (movedEntityDrafts[i] === null) {
          movedEntityDrafts[i] = paperEntityDrafts[i];
        }
      }

      await this.update(movedEntityDrafts);
    } catch (error) {
      this._logService.error(
        "Rename all paper failed",
        error as Error,
        true,
        "PaperService"
      );
    }
  }

  // ======================= //
  // DEV functions
  // ======================= //

  addDummyData() {}

  removeAll() {}
}
