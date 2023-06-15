import { ObjectId } from "bson";

import { DatabaseCore, IDatabaseCore } from "@/base/database/core";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { PaperFolder, PaperTag } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import { PaperEntityRepository } from "@/repositories/db-repository/paper-repository";
import { ILogService, LogService } from "@/services/log-service";
import { formatString } from "@/utils/string";

export interface IDatabaseServiceState {
  dbInitializing: number;
  dbInitialized: number;
  paperEntityCount: number;
  paperEntityUpdated: number;
}

export interface IPaperEntityFilterOptions {
  search?: string;
  searchMode?: "general" | "fulltext" | "advanced";
  flaged?: boolean;
  tag?: string;
  folder?: string;
}

export const IDatabaseService = createDecorator("databaseService");

export class DatabaseService extends Eventable<IDatabaseServiceState> {
  private readonly _paperEntityRepository: PaperEntityRepository;

  constructor(
    @IDatabaseCore private readonly _databaseCore: DatabaseCore,
    @ILogService private readonly _logService: LogService
  ) {
    super("databaseService", {
      dbInitializing: 0,
      dbInitialized: 0,
      paperEntityCount: 0,
      paperEntityUpdated: 0,
    });

    this._paperEntityRepository = new PaperEntityRepository();

    this._databaseCore.on(["dbInitializing", "dbInitialized"], (payload) => {
      this.fire({ [payload.key]: payload.value });
    });
    this._paperEntityRepository.on(["count", "updated"], (payload) => {
      this.fire({
        [`paperEntity${payload.key[0].toUpperCase() + payload.key.slice(1)}`]:
          payload.value,
      });
    });
  }

  /**
   * Initialize the database.
   * @param reinit - Whether to reinitialize the database. */
  async initialize(reinit: boolean = true) {
    await this._databaseCore.initRealm(reinit);
  }

  /**
   * Pause the synchronization of the database. */
  pauseSync() {
    this._databaseCore.pauseSync();
  }

  /**
   * Resume the synchronization of the database. */
  resumeSync() {
    this._databaseCore.resumeSync();
  }

  /**
   * Migrate the local database to the cloud database. */
  migrateLocaltoCloud() {
    // TODO: implement
  }

  /**
   * Papeer Entity Repository API exposed to the outside. */
  // TODO: can we use a decorator to do error log?
  paperEntity = {
    constructFilter: (filterOptions: IPaperEntityFilterOptions) => {
      let filter = "";

      if (filterOptions.search) {
        let formatedSearch = formatString({
          str: filterOptions.search,
          removeNewline: true,
          trimWhite: true,
        });

        if (
          !filterOptions.searchMode ||
          filterOptions.searchMode === "general"
        ) {
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
    },

    load: async (
      filter: string,
      sortBy: string,
      sortOrder: "asce" | "desc"
    ) => {
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
        return [];
      }
    },

    loadByIds: async (ids: (string | ObjectId)[]) => {
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
    },

    update: async (
      paperEntity: PaperEntity,
      paperTag: PaperTag[],
      paperFolder: PaperFolder[],
      existingPaperEntity: PaperEntity | null,
      partition: string
    ) => {
      try {
        return this._paperEntityRepository.update(
          await this._databaseCore.realm(),
          paperEntity,
          paperTag,
          paperFolder,
          existingPaperEntity,
          partition
        );
      } catch (error) {
        this._logService.error(
          "Cannot update paper entity",
          error as Error,
          true,
          "Database"
        );
      }
    },

    delete: async (paperEntity?: PaperEntity, ids?: (ObjectId | string)[]) => {
      try {
        return this._paperEntityRepository.delete(
          await this._databaseCore.realm(),
          paperEntity,
          ids
        );
      } catch (error) {
        this._logService.error(
          "Cannot delete paper entity",
          error as Error,
          true,
          "Database"
        );
      }
    },
  };
}
