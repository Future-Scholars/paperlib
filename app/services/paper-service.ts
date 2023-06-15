import { ObjectId } from "bson";

import { DatabaseCore, IDatabaseCore } from "@/base/database/core";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { PaperFolder, PaperTag } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import { PaperEntityRepository } from "@/repositories/db-repository/paper-repository";
import { ILogService, LogService } from "@/services/log-service";
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

export class PaperService extends Eventable<IPaperServiceState> {
  private readonly _paperEntityRepository: PaperEntityRepository;
  constructor(
    @IDatabaseCore private readonly _databaseCore: DatabaseCore,
    @ILogService private readonly _logService: LogService
  ) {
    super("paperService", {
      count: 0,
      updated: 0,
    });
    this._paperEntityRepository = new PaperEntityRepository();

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
  // ========================
  // Read
  // ========================
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
      return [];
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
    paperEntity: PaperEntity,
    paperTag: PaperTag[],
    paperFolder: PaperFolder[],
    existingPaperEntity: PaperEntity | null
  ) {
    try {
      return this._paperEntityRepository.update(
        await this._databaseCore.realm(),
        paperEntity,
        paperTag,
        paperFolder,
        existingPaperEntity,
        this._databaseCore.getPartition()
      );
    } catch (error) {
      this._logService.error(
        "Cannot update paper entity",
        error as Error,
        true,
        "Database"
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
}
