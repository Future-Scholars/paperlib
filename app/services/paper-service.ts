import { ObjectId } from "bson";
import path from "path";

import { chunkRun } from "@/base/chunk";
import { DatabaseCore, IDatabaseCore } from "@/base/database/core";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { PaperEntity } from "@/models/paper-entity";
import {
  CategorizerRepository,
  ICategorizerRepository,
} from "@/repositories/db-repository/categorizer-repository-v2";
import {
  IPaperEntityRepository,
  PaperEntityRepository,
} from "@/repositories/db-repository/paper-repository";
import { ILogService, LogService } from "@/services/log-service";
import { IScrapeService, ScrapeService } from "@/services/scrape-service";
import { ProcessingKey, processing } from "@/services/state-service/processing";
import { formatString } from "@/utils/string";

import { FileService, IFileService } from "./file-service";

export interface IPaperServiceState {
  count: number;
  updated: number;
  tagsUpdated: number;
  foldersUpdated: number;
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
    @IFileService private readonly _fileService: FileService,
    @ILogService private readonly _logService: LogService
  ) {
    super("paperService", {
      count: 0,
      updated: 0,
      tagsUpdated: 0,
      foldersUpdated: 0,
    });

    this._paperEntityRepository = new PaperEntityRepository();
    this._paperEntityRepository.on(["count", "updated"], (payload) => {
      this.fire({
        [payload.key]: payload.value,
      });
    });

    this._categorizerRepository = new CategorizerRepository();
    this._categorizerRepository.on(
      ["tagsUpdated", "foldersUpdated"],
      (payload) => {
        this.fire({
          [payload.key]: payload.value,
        });
      }
    );
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
    try {
      return this._paperEntityRepository.load(
        await this._databaseCore.realm(),
        filter,
        sortBy,
        sortOrder
      );
    } catch (error) {
      this._logService.error(
        "Cannot load paper entities",
        error as Error,
        true,
        "Database"
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
        "Cannot load paper entity by id",
        error as Error,
        true,
        "Database"
      );
    }
  }

  /**
   * Update paper entity.
   * @param paperEntity - paper entity
   * @param paperTag - paper tags
   * @param paperFolder - paper folders
   * @param existingPaperEntity - existing paper entity
   * @returns - flag
   */
  @processing(ProcessingKey.General)
  async update(
    paperEntityDrafts: PaperEntity[],
    forceDelete = true,
    forceNotLink = false
  ): Promise<void> {
    // TODO: why we need forceDelete and forceNotLink?

    this._logService.info(
      `Updating ${paperEntityDrafts.length} paper(s)...`,
      "",
      true,
      "PaperService"
    );

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
    // filter paper entities with files that are not moved (still absolute path)
    fileMovedPaperEntityDrafts = fileMovedPaperEntityDrafts.filter(
      (paperEntityDraft) => {
        return (
          paperEntityDraft.mainURL && !path.isAbsolute(paperEntityDraft.mainURL)
        );
      }
    );
    fileMovedPaperEntityDrafts = fileMovedPaperEntityDrafts.map(
      (paperEntityDraft) => {
        paperEntityDraft.supURLs = paperEntityDraft.supURLs.filter((url) => {
          return path && !path.isAbsolute(url);
        });
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
        fileMovedPaperEntityDraft.mainURL !== dbUpdatedPaperEntityDraft.mainURL
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

    // 3. Create cache
    // TODO: create cache service, in that service, we should check md5 to see if we need to update cache
    // await this.dbRepository.updatePaperEntitiesCacheFullText(
    //   successfulEntityDrafts
    // );
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
        "Database"
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
        "Entity"
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
        url;
      });
      const scrapedPaperEntityDrafts = await this._scrapeService.scrape(
        payloads,
        [],
        false
      );

      // 2. Update.
      await this.update(scrapedPaperEntityDrafts);
    } catch (error) {
      this._logService.error(
        "Failed to Add papers to library",
        error as Error,
        true,
        "Paper"
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
    } catch (error) {
      this._logService.error(
        "Failed to scrape metadata!",
        error as Error,
        true,
        "PaperService"
      );
    }

    await this.update(paperEntities);
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
}
