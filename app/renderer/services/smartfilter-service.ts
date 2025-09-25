import { DatabaseCore, IDatabaseCore } from "@/base/database/core";
import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { ILogService, LogService } from "@/common/services/log-service";
import { Colors } from "@/models/categorizer";
import { OID } from "@/models/id";
import { PaperSmartFilter, PaperSmartFilterType } from "@/models/smart-filter";
import { ProcessingKey, processing } from "@/renderer/services/uistate-service";
import {
  IPaperSmartFilterCollection,
  IPaperSmartFilterRealmObject,
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

    this._databaseCore.on("dbInitialized", async () => {
      this._paperSmartFilterRepository.createRoots(
        await this._databaseCore.realm(),
        this._databaseCore.getPartition()
      );
    });
  }

  /**
   * Load smartfilters.
   * @param type - The type of the smartfilter
   * @param sortBy - Sort by
   * @param sortOrder - Sort order
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to load smartfilter.", true, "SmartFilterService", [])
  async load(
    type: PaperSmartFilterType,
    sortBy: string,
    sortOrder: string
  ): Promise<IPaperSmartFilterCollection> {
    return this._paperSmartFilterRepository.load(
      await this._databaseCore.realm(),
      type,
      sortBy,
      sortOrder
    );
  }

  /**
   * Load smartfilters by ids.
   * @param ids - The ids of the smartfilters
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching(
    "Failed to load smartfilters bt ids.",
    true,
    "SmartFilterService",
    []
  )
  async loadByIds(ids: OID[]) {
    if (this._databaseCore.getState("dbInitializing")) {
      return [];
    }
    return this._paperSmartFilterRepository.loadByIds(
      await this._databaseCore.realm(),
      PaperSmartFilterType.smartfilter,
      ids
    );
  }

  /**
   * Delete a smartfilter.
   * @param type - The type of the smartfilter
   * @param ids - The ids of the smartfilters
   * @param smartfilters - The smartfilters
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
   * @param id - The id of the smartfilter.
   * @param color - The color.
   * @param type - The type of the smartfilter.
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to colorize smartfilter.", true, "SmartfilterService")
  async colorize(id: OID, color: Colors, type: PaperSmartFilterType) {
    const realm = await this._databaseCore.realm();
    const objects = this._paperSmartFilterRepository.loadByIds(realm, type, [
      id,
    ]);

    if (objects.length === 0) {
      throw new Error(`Smartfilter not found: ${id}`);
    }
    const object = objects[0] as IPaperSmartFilterRealmObject;
    const parents = object.linkingObjects<IPaperSmartFilterRealmObject>(
      type,
      "children"
    );
    const parent = parents.length > 0 ? parents[0] : undefined;

    this._paperSmartFilterRepository.update(
      await this._databaseCore.realm(),
      type,
      new PaperSmartFilter(
        {
          _id: id,
          name: object.name.split("/").pop(),
          filter: object.filter,
          color,
        },
        false
      ),
      this._databaseCore.getPartition(),
      parent
    );
  }

  /**
   * Rename a smartfilter.
   * @param id - The id of the smartfilter.
   * @param name - The new name of the smartfilter.
   * @param type - The type of the smartfilter.
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to rename smartfilters.", true, "SmartfilterService")
  async rename(id: OID, name: string, type: PaperSmartFilterType) {
    const realm = await this._databaseCore.realm();
    const objects = this._paperSmartFilterRepository.loadByIds(realm, type, [
      id,
    ]);

    if (objects.length === 0) {
      throw new Error(`Smartfilter not found: ${id}`);
    }
    const object = objects[0] as IPaperSmartFilterRealmObject;
    const oldName = object.name;

    const parents = object.linkingObjects<IPaperSmartFilterRealmObject>(
      type,
      "children"
    );
    const parent = parents.length > 0 ? parents[0] : undefined;

    this.update(
      type,
      new PaperSmartFilter(
        {
          _id: id,
          name,
        },
        false
      ),
      parent
    );
  }

  /**
   * Update/Insert a smartfilter.
   * @param type - The type of the smartfilter
   * @param smartfilter - The smartfilter
   * @param parentSmartfilter - The parent smartfilter
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to update smartfilter.", true, "SmartFilterService")
  async update(
    type: PaperSmartFilterType,
    smartfilter: PaperSmartFilter,
    parentSmartfilter?: PaperSmartFilter
  ) {
    if (
      !smartfilter.name ||
      smartfilter.name?.includes("/") ||
      smartfilter.name === "SmartFilters"
    ) {
      throw new Error(
        "Invalid name, name cannot be empty, 'SmartFilters', or contain '/'"
      );
    }

    return this._paperSmartFilterRepository.update(
      await this._databaseCore.realm(),
      type,
      smartfilter,
      this._databaseCore.getPartition(),
      parentSmartfilter
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

    const rootSmartFilter = localRealm
      .objects<PaperSmartFilter>(PaperSmartFilter.schema.name)
      .filtered("name == 'SmartFilters'");

    const _migrate = async (
      type: PaperSmartFilterType,
      smartfilter: PaperSmartFilter,
      parent?: PaperSmartFilter
    ) => {
      const migrateSmartFilter = new PaperSmartFilter();
      migrateSmartFilter._id = smartfilter._id;
      migrateSmartFilter.name = smartfilter.name.split("/").pop() as string;
      migrateSmartFilter.color = smartfilter.color;
      migrateSmartFilter.filter = smartfilter.filter;
      await this.update(
        type,
        migrateSmartFilter,
        new PaperSmartFilter({ _id: parent?._id, name: parent?.name })
      );

      smartfilter.children.forEach(async (child) => {
        await _migrate(type, child, migrateSmartFilter);
      });
    };

    for (const smartfilter of rootSmartFilter[0].children) {
      await _migrate(
        PaperSmartFilterType.smartfilter,
        smartfilter,
        rootSmartFilter[0]
      );
    }

    this._logService.info(
      `Migrated smartfilters to cloud database.`,
      "",
      true,
      "SmartFilterService"
    );

    localRealm.close();
  }

  /**
   * Migrate the cloud database to the local database. */
  @errorcatching(
    "Failed to migrate the cloud smartfilters to the local database.",
    true,
    "DatabaseService"
  )
  async migrateCloudToLocal() {
    // Get cloud config and create cloud realm first to read data
    const cloudRealm = await this._databaseCore.realm();

    const rootSmartFilters = cloudRealm
      .objects<PaperSmartFilter>(PaperSmartFilter.schema.name)
      .filtered("name == 'SmartFilters'");

    // Recursive function to extract all nested smartfilters
    const extractSmartFilters = (smartfilter: PaperSmartFilter): PaperSmartFilter[] => {
      const result: PaperSmartFilter[] = [new PaperSmartFilter(smartfilter)];
      if (smartfilter.children && smartfilter.children.length > 0) {
        for (const child of smartfilter.children) {
          result.push(...extractSmartFilters(child));
        }
      }
      return result;
    };

    // Extract smartfilters data with proper nesting
    const smartFiltersData: PaperSmartFilter[] = [];
    for (const rootSmartFilter of rootSmartFilters) {
      if (rootSmartFilter.children.length > 0) {
        for (const smartfilter of rootSmartFilter.children) {
          smartFiltersData.push(...extractSmartFilters(new PaperSmartFilter(smartfilter)));
        }
      }
    }

    // Logout to ensure we get a local realm
    const localConfig = await this._databaseCore.getLocalConfig();
    const localRealm = new Realm(localConfig);

    localRealm.safeWrite = (callback) => {
      if (localRealm.isInTransaction) {
        return callback();
      } else {
        return localRealm.write(callback);
      }
    };

    // Local update function that works with the provided local realm
    const localUpdate = (
      localRealm: Realm,
      type: PaperSmartFilterType,
      smartfilter: PaperSmartFilter,
      partition: string,
      parentSmartfilter?: PaperSmartFilter
    ) => {
      if (
        !smartfilter.name ||
        smartfilter.name?.includes("/") ||
        smartfilter.name === "SmartFilters"
      ) {
        throw new Error(
          "Invalid name, name cannot be empty, 'SmartFilters', or contain '/'"
        );
      }

      return this._paperSmartFilterRepository.update(
        localRealm,
        type,
        smartfilter,
        partition,
        parentSmartfilter
      );
    };

    // Create a map to track migrated smartfilters by their ID
    const migratedMap = new Map<string, PaperSmartFilter>();

    const _migrate = (
      type: PaperSmartFilterType,
      smartfilter: PaperSmartFilter,
      parent?: PaperSmartFilter
    ) => {
      const migrateSmartFilter = new PaperSmartFilter();
      migrateSmartFilter._id = smartfilter._id;
      migrateSmartFilter.name = smartfilter.name.split("/").pop() as string;
      migrateSmartFilter.color = smartfilter.color;
      migrateSmartFilter.filter = smartfilter.filter;
      
      // Create the smartfilter in local database
      const updatedSmartFilter = localUpdate(
        localRealm,
        type,
        migrateSmartFilter,
        "", // Empty partition for local database
        parent ? new PaperSmartFilter({ _id: parent._id, name: parent.name }) : undefined
      );

      // Store the migrated smartfilter for reference
      migratedMap.set(smartfilter._id.toString(), updatedSmartFilter);

      return updatedSmartFilter;
    };

    // Create root smartfilters if they don't exist
    this._paperSmartFilterRepository.createRoots(localRealm, "");

    // Sort smartfilters by hierarchy (parents first)
    const sortByHierarchy = (smartfilters: PaperSmartFilter[]): PaperSmartFilter[] => {
      const sorted: PaperSmartFilter[] = [];
      const processed = new Set<string>();
      
      const addSmartFilter = (smartfilter: PaperSmartFilter) => {
        if (processed.has(smartfilter._id.toString())) return;
        
        // Find parent in the original data
        const parentPath = smartfilter.name.split("/").slice(0, -1).join("/");
        if (parentPath) {
          const parent = smartfilters.find(sf => sf.name === parentPath);
          if (parent && !processed.has(parent._id.toString())) {
            addSmartFilter(parent);
          }
        }
        
        sorted.push(smartfilter);
        processed.add(smartfilter._id.toString());
      };
      
      smartfilters.forEach(addSmartFilter);
      return sorted;
    };

    // Migrate smartfilters from cloud to local with proper nesting
    const sortedSmartFilters = sortByHierarchy(smartFiltersData);
    for (const smartfilter of sortedSmartFilters) {
      const parentPath = smartfilter.name.split("/").slice(0, -1).join("/");
      let parentSmartfilter: PaperSmartFilter | undefined;
      
      if (parentPath) {
        // Find parent in migrated smartfilters
        const parentSF = smartFiltersData.find(sf => sf.name === parentPath);
        if (parentSF) {
          parentSmartfilter = migratedMap.get(parentSF._id.toString());
        }
      } else {
        // Root level smartfilter
        parentSmartfilter = new PaperSmartFilter({ name: "SmartFilters" });
      }
      
      _migrate(PaperSmartFilterType.smartfilter, smartfilter, parentSmartfilter);
    }

    this._logService.info(
      `Migrated smartfilters to local database.`,
      "",
      true,
      "SmartFilterService"
    );

    localRealm.close();
  }
}
