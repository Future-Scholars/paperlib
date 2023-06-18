import { DatabaseCore, IDatabaseCore } from "@/base/database/core";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Colors } from "@/models/categorizer";
import { PaperSmartFilter, PaperSmartFilterType } from "@/models/smart-filter";
import {
  IPaperSmartFilterRepository,
  PaperSmartFilterRepository,
} from "@/repositories/db-repository/smartfilter-repository-v2";
import { ILogService, LogService } from "@/services/log-service";
import { ProcessingKey, processing } from "@/services/state-service/processing";

export interface ISmartFilterServiceState {
  updated: number;
}

export const ISmartFilterService = createDecorator("smartfilterService");

export class SmartFilterService extends Eventable<ISmartFilterServiceState> {
  constructor(
    @IDatabaseCore private readonly _databaseCore: DatabaseCore,
    @IPaperSmartFilterRepository
    private readonly _paperSmartFilterRepository: PaperSmartFilterRepository,
    @ILogService private readonly _logService: LogService
  ) {
    super("smartfilterService", {
      updated: 0,
    });

    this._paperSmartFilterRepository.on(["updated"], (payload) => {
      this.fire({
        [payload.key]: payload.value,
      });
    });
  }

  /**
   * Load smartfilters.
   * @param type The type of the smartfilter.
   * @param sortBy Sort: by
   * @param sortOrder Sort: order
   * @returns
   */
  @processing(ProcessingKey.General)
  async load(type: PaperSmartFilterType, sortBy: string, sortOrder: string) {
    try {
      return this._paperSmartFilterRepository.load(
        await this._databaseCore.realm(),
        type,
        sortBy,
        sortOrder
      );
    } catch (error) {
      this._logService.error(
        `Load smartfilter failed: ${type} ${sortBy} ${sortOrder}`,
        error as Error,
        true,
        "SmartFilterService"
      );
      return [];
    }
  }

  /**
   * Delete a smartfilter.
   * @param type - The type of the smartfilter.
   * @param name - The name of the smartfilter.
   * @param smartfilter - The categorizer.
   * @returns
   */
  @processing(ProcessingKey.General)
  async delete(
    type: PaperSmartFilterType,
    name?: string,
    smartfilter?: PaperSmartFilter
  ) {
    try {
      this._paperSmartFilterRepository.delete(
        await this._databaseCore.realm(),
        type,
        smartfilter,
        name
      );
    } catch (error) {
      this._logService.error(
        `Delete smartfilter failed: ${type} ${name} ${smartfilter}`,
        error as Error,
        true,
        "SmartFilterService"
      );
    }
  }

  /**
   * Colorize a smartfilter.
   * @param color - The color.
   * @param type - The type of the smartfilter.
   * @param name - The name of the smartfilter.
   * @param smartfilter - The smartfilter.
   * @returns
   */
  @processing(ProcessingKey.General)
  async colorize(
    color: Colors,
    type: PaperSmartFilterType,
    name?: string,
    smartfilter?: PaperSmartFilter
  ) {
    try {
      this._paperSmartFilterRepository.colorize(
        await this._databaseCore.realm(),
        color,
        type,
        smartfilter,
        name
      );
    } catch (error) {
      this._logService.error(
        `Failed to colorize smartfilter ${type} ${name} ${smartfilter}`,
        error as Error,
        true,
        "SmartFilterService"
      );
    }
  }

  async insert(smartfilter: PaperSmartFilter, type: PaperSmartFilterType) {
    try {
      this._paperSmartFilterRepository.insert(
        await this._databaseCore.realm(),
        smartfilter,
        type,
        this._databaseCore.getPartition()
      );
    } catch (error) {
      this._logService.error(
        `Failed to insert smartfilter ${type} ${smartfilter}`,
        error as Error,
        true,
        "SmartFilterService"
      );
    }
  }
}
