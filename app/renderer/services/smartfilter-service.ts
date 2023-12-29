import { DatabaseCore, IDatabaseCore } from "@/base/database/core";
import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Colors } from "@/models/categorizer";
import { OID } from "@/models/id";
import { PaperSmartFilter, PaperSmartFilterType } from "@/models/smart-filter";
import { ILogService, LogService } from "@/renderer/services/log-service";
import { ProcessingKey, processing } from "@/renderer/services/uistate-service";
import {
  IPaperSmartFilterCollection,
  IPaperSmartFilterRepository,
  PaperSmartFilterRepository,
} from "@/repositories/db-repository/smartfilter-repository";

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
  @errorcatching("Failed to load smartfilter.", true, "SmartFilterService", [])
  async load(type: PaperSmartFilterType, sortBy: string, sortOrder: string) {
    return this._paperSmartFilterRepository.load(
      await this._databaseCore.realm(),
      type,
      sortBy,
      sortOrder
    );
  }

  /**
   * Delete a smartfilter.
   * @param type - The type of the smartfilter.
   * @param ids - The ids of the smartfilters.
   * @param smartfilters - The smartfilters.
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to delete smartfilter.", true, "SmartFilterService")
  async delete(
    type: PaperSmartFilterType,
    ids?: OID[],
    smartfilters?: IPaperSmartFilterCollection
  ) {
    this._paperSmartFilterRepository.delete(
      await this._databaseCore.realm(),
      type,
      ids,
      smartfilters
    );
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
  @errorcatching("Failed to colorize smartfilter.", true, "SmartFilterService")
  async colorize(
    color: Colors,
    type: PaperSmartFilterType,
    id?: OID,
    smartfilter?: PaperSmartFilter
  ) {
    this._paperSmartFilterRepository.colorize(
      await this._databaseCore.realm(),
      color,
      type,
      id,
      smartfilter
    );
  }

  /**
   * Insert a smartfilter.
   * @param smartfilter - The smartfilter.
   * @param type - The type of the smartfilter.
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to insert smartfilter.", true, "SmartFilterService")
  async insert(smartfilter: PaperSmartFilter, type: PaperSmartFilterType) {
    this._paperSmartFilterRepository.insert(
      await this._databaseCore.realm(),
      smartfilter,
      type,
      this._databaseCore.getPartition()
    );
  }

  /**
   * Migrate the local database to the cloud database. */
  @errorcatching(
    "Failed to migrate the local smartfilters to the cloud database.",
    true,
    "DatabaseService"
  )
  async migrateLocaltoCloud() {
    const localConfig = await this._databaseCore.getLocalConfig(false);
    const localRealm = new Realm(localConfig);

    const entities = localRealm.objects<PaperSmartFilter>(
      "PaperPaperSmartFilter"
    );
    for (const entity of entities) {
      await this.insert(new PaperSmartFilter(entity), "PaperPaperSmartFilter");
    }

    this._logService.info(
      `Migrated ${entities.length} smartfilter(s) to cloud database.`,
      "",
      true,
      "SmartFilterService"
    );
  }
}
