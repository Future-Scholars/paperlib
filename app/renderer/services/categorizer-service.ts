import { DatabaseCore, IDatabaseCore } from "@/base/database/core";
import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { ILogService, LogService } from "@/common/services/log-service";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import {
  Categorizer,
  CategorizerType,
  Colors,
  PaperFolder,
  PaperTag,
} from "@/models/categorizer";
import { OID } from "@/models/id";
import { ProcessingKey, processing } from "@/renderer/services/uistate-service";
import {
  CategorizerRepository,
  ICategorizerCollection,
  ICategorizerRealmObject,
  ICategorizerRepository,
} from "@/repositories/db-repository/categorizer-repository";

export interface ICategorizerServiceState {
  tagsUpdated: number;
  foldersUpdated: number;
}

export const ICategorizerService = createDecorator("categorizerService");

export class CategorizerService extends Eventable<ICategorizerServiceState> {
  constructor(
    @IDatabaseCore private readonly _databaseCore: DatabaseCore,
    @ICategorizerRepository
    private readonly _categorizerRepository: CategorizerRepository,
    @ILogService private readonly _logService: LogService,
    @IPreferenceService private readonly _preferenceService: PreferenceService
  ) {
    super("categorizerService", {
      tagsUpdated: 0,
      foldersUpdated: 0,
    });

    this._categorizerRepository.on(
      ["tagsUpdated", "foldersUpdated"],
      (payload) => {
        this.fire({
          [payload.key]: payload.value,
        });
      }
    );

    this._databaseCore.on("dbInitialized", async () => {
      this._categorizerRepository.createRoots(
        await this._databaseCore.realm(),
        this._databaseCore.getPartition()
      );
    });
  }

  /**
   * Load categorizers.
   * @param type - The type of the categorizer.
   * @param sortBy - Sort by
   * @param sortOrder - Sort order
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to load categorizer.", true, "CategorizerService", [])
  async load(type: CategorizerType, sortBy: string, sortOrder: string) {
    return this._categorizerRepository.load(
      await this._databaseCore.realm(),
      type,
      sortBy,
      sortOrder
    );
  }

  /**
   * Load categorizers by ids.
   * @param type - The type of the categorizer.
   * @param ids - The ids of the categorizers.
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to load categorizer.", true, "CategorizerService", [])
  async loadByIds(type: CategorizerType, ids: OID[]) {
    return this._categorizerRepository.loadByIds(
      await this._databaseCore.realm(),
      type,
      ids
    );
  }

  /**
   * Create a categorizer.
   * @param type - The type of categorizer.
   * @param categorizer - The categorizer.
   * @param parentCategorizer - The parent categorizer to insert.
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to create categorizers.", true, "CategorizerService")
  async create(
    type: CategorizerType,
    categorizer: Categorizer,
    parentCategorizer?: Categorizer
  ) {
    return this.update(type, categorizer, parentCategorizer);
  }

  /**
   * Delete a categorizer.
   * @param type - The type of categorizer.
   * @param name - The name of categorizer.
   * @param categorizer - The categorizer.
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to delete categorizers.", true, "CategorizerService")
  async delete(
    type: CategorizerType,
    ids?: OID[],
    categorizers?: ICategorizerCollection
  ) {
    this._categorizerRepository.delete(
      await this._databaseCore.realm(),
      type,
      ids,
      categorizers
    );
  }

  /**
   * Colorize a categorizer.
   * @param id - The id of the categorizer.
   * @param color - The color.
   * @param type - The type of the categorizer.
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to colorize categorizers.", true, "CategorizerService")
  async colorize(id: OID, color: Colors, type: CategorizerType) {
    const realm = await this._databaseCore.realm();
    const objects = this._categorizerRepository.loadByIds(realm, type, [id]);

    if (objects.length === 0) {
      throw new Error(`Categorizer not found: ${id}`);
    }
    const object = objects[0] as ICategorizerRealmObject;
    const parents = object.linkingObjects<ICategorizerRealmObject>(
      type,
      "children"
    );
    const parent = parents.length > 0 ? parents[0] : undefined;

    this._categorizerRepository.update(
      await this._databaseCore.realm(),
      type,
      new Categorizer(
        {
          _id: id,
          name: object.name.split("/").pop(),
          color,
        },
        false
      ),
      this._databaseCore.getPartition(),
      parent
    );
  }

  /**
   * Rename a categorizer.
   * @param id - The id of the categorizer.
   * @param name - The new name of the categorizer.
   * @param type - The type of the categorizer.
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to rename categorizers.", true, "CategorizerService")
  async rename(id: OID, name: string, type: CategorizerType) {
    const realm = await this._databaseCore.realm();
    const objects = this._categorizerRepository.loadByIds(realm, type, [id]);

    if (objects.length === 0) {
      throw new Error(`Categorizer not found: ${id}`);
    }
    const object = objects[0] as ICategorizerRealmObject;
    const oldName = object.name;

    const parents = object.linkingObjects<ICategorizerRealmObject>(
      type,
      "children"
    );
    const parent = parents.length > 0 ? parents[0] : undefined;

    this.update(
      type,
      new Categorizer(
        {
          _id: id,
          name,
        },
        false
      ),
      parent
    );

    if (
      type === CategorizerType.PaperFolder &&
      this._preferenceService.get("pluginLinkedFolder") === oldName
    ) {
      this._preferenceService.set({ pluginLinkedFolder: name });
    }
  }

  /**
   * Update/Insert a categorizer.
   * @param type - The type of the categorizer.
   * @param categorizer - The categorizer.
   * @param parentCategorizer - The parent categorizer to insert.
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to update categorizers.", true, "CategorizerService")
  async update(
    type: CategorizerType,
    categorizer: Categorizer,
    parentCategorizer?: Categorizer
  ) {
    if (
      !categorizer.name ||
      categorizer.name?.includes("/") ||
      categorizer.name === "Tags" ||
      categorizer.name === "Folders"
    ) {
      throw new Error(
        "Invalid name, name cannot be empty, 'Tags', 'Folders', or contain '/'"
      );
    }

    return this._categorizerRepository.update(
      await this._databaseCore.realm(),
      type,
      categorizer,
      this._databaseCore.getPartition(),
      parentCategorizer
    );
  }

  /**
   * Migrate the local database to the cloud database. */
  @errorcatching(
    "Failed to migrate the local categorizers to the cloud database.",
    true,
    "DatabaseService"
  )
  async migrateLocaltoCloud() {
    const localConfig = await this._databaseCore.getLocalConfig(false);
    const localRealm = new Realm(localConfig);

    const rootTag = localRealm
      .objects<PaperTag>("PaperTag")
      .filtered("name == 'Tags'");
    const rootFolder = localRealm
      .objects<PaperFolder>("PaperFolder")
      .filtered("name == 'Folders'");

    const _migrate = async (
      type: CategorizerType,
      categorizer: Categorizer,
      parent?: Categorizer
    ) => {
      const migrateCategorizer = new Categorizer();
      migrateCategorizer._id = categorizer._id;
      migrateCategorizer.name = categorizer.name.split("/").pop() as string;
      migrateCategorizer.color = categorizer.color;
      migrateCategorizer.count = 0;
      await this.update(
        type,
        migrateCategorizer,
        new Categorizer({ _id: parent?._id, name: parent?.name })
      );

      categorizer.children.forEach(async (child) => {
        await _migrate(type, child, migrateCategorizer);
      });
    };

    for (const tag of rootTag[0].children) {
      await _migrate(CategorizerType.PaperTag, tag, rootTag[0]);
    }

    for (const folder of rootFolder[0].children) {
      await _migrate(CategorizerType.PaperFolder, folder, rootFolder[0]);
    }

    this._logService.info(
      `Migrated tags and folders to cloud database.`,
      "",
      true,
      "PaperService"
    );

    localRealm.close();
  }

  /**
   * Migrate the cloud database to the local database. */
  @errorcatching(
    "Failed to migrate the cloud categorizers to the local database.",
    true,
    "DatabaseService"
  )
  async migrateCloudToLocal() {
    // Get cloud config and create cloud realm first to read data
    const cloudRealm = await this._databaseCore.realm();

    const rootTags = cloudRealm
      .objects<PaperTag>("PaperTag")
      .filtered("name == 'Tags'");

    const rootFolders = cloudRealm
      .objects<PaperFolder>("PaperFolder")
      .filtered("name == 'Folders'");

    // Recursive function to extract all nested categorizers
    const extractCategorizers = (categorizer: Categorizer): Categorizer[] => {
      const result: Categorizer[] = [new Categorizer(categorizer)];
      if (categorizer.children && categorizer.children.length > 0) {
        for (const child of categorizer.children) {
          result.push(...extractCategorizers(child));
        }
      }
      return result;
    };

    // Extract tags data
    const tagsData: Categorizer[] = [];
    for (const rootTag of rootTags) {
      if (rootTag.children.length > 0) {
        for (const tag of rootTag.children) {
          tagsData.push(...extractCategorizers(new PaperTag(tag)));
        }
      }
    }

    // Extract folders data with proper nesting
    const foldersData: Categorizer[] = [];
    for (const rootFolder of rootFolders) {
      if (rootFolder.children.length > 0) {
        for (const folder of rootFolder.children) {
          foldersData.push(...extractCategorizers(new PaperFolder(folder)));
        }
      }
    }

    // Logout to ensure we get a local realm
    const localConfig = await this._databaseCore.getLocalConfig(false);
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
      type: CategorizerType,
      categorizer: Categorizer,
      partition: string,
      parentCategorizer?: Categorizer
    ) => {
      if (
        !categorizer.name ||
        categorizer.name?.includes("/") ||
        categorizer.name === "Tags" ||
        categorizer.name === "Folders"
      ) {
        throw new Error(
          "Invalid name, name cannot be empty, 'Tags', 'Folders', or contain '/'"
        );
      }

      return this._categorizerRepository.update(
        localRealm,
        type,
        categorizer,
        partition,
        parentCategorizer
      );
    };

    // Create a map to track migrated categorizers by their ID
    const migratedMap = new Map<string, Categorizer>();

    const _migrate = (
      type: CategorizerType,
      categorizer: Categorizer,
      parent?: Categorizer
    ) => {
      const migrateCategorizer = new Categorizer();
      migrateCategorizer._id = categorizer._id;
      migrateCategorizer.name = categorizer.name.split("/").pop() as string;
      migrateCategorizer.color = categorizer.color;
      migrateCategorizer.count = 0;
      
      // Create the categorizer in local database
      const updatedCategorizer = localUpdate(
        localRealm,
        type,
        migrateCategorizer,
        "", // Empty partition for local database
        parent ? new Categorizer({ _id: parent._id, name: parent.name }) : undefined
      );

      // Store the migrated categorizer for reference
      migratedMap.set(categorizer._id.toString(), updatedCategorizer);

      return updatedCategorizer;
    };

    // Create root categorizers if they don't exist
    this._categorizerRepository.createRoots(localRealm, "");

    // Sort categorizers by hierarchy (parents first)
    const sortByHierarchy = (categorizers: Categorizer[]): Categorizer[] => {
      const sorted: Categorizer[] = [];
      const processed = new Set<string>();
      
      const addCategorizer = (categorizer: Categorizer) => {
        if (processed.has(categorizer._id.toString())) return;
        
        // Find parent in the original data
        const parentPath = categorizer.name.split("/").slice(0, -1).join("/");
        if (parentPath) {
          const parent = categorizers.find(c => c.name === parentPath);
          if (parent && !processed.has(parent._id.toString())) {
            addCategorizer(parent);
          }
        }
        
        sorted.push(categorizer);
        processed.add(categorizer._id.toString());
      };
      
      categorizers.forEach(addCategorizer);
      return sorted;
    };

    // Migrate tags from cloud to local
    const sortedTags = sortByHierarchy(tagsData);
    for (const tag of sortedTags) {
      const parentPath = tag.name.split("/").slice(0, -1).join("/");
      let parentCategorizer: Categorizer | undefined;
      
      if (parentPath) {
        // Find parent in migrated categorizers
        const parentTag = tagsData.find(t => t.name === parentPath);
        if (parentTag) {
          parentCategorizer = migratedMap.get(parentTag._id.toString());
        }
      } else {
        // Root level tag
        parentCategorizer = new Categorizer({ name: "Tags" });
      }
      
      _migrate(CategorizerType.PaperTag, tag, parentCategorizer);
    }

    // Migrate folders from cloud to local with proper nesting
    const sortedFolders = sortByHierarchy(foldersData);
    for (const folder of sortedFolders) {
      const parentPath = folder.name.split("/").slice(0, -1).join("/");
      let parentCategorizer: Categorizer | undefined;
      
      if (parentPath) {
        // Find parent in migrated categorizers
        const parentFolder = foldersData.find(f => f.name === parentPath);
        if (parentFolder) {
          parentCategorizer = migratedMap.get(parentFolder._id.toString());
        }
      } else {
        // Root level folder
        parentCategorizer = new Categorizer({ name: "Folders" });
      }
      
      _migrate(CategorizerType.PaperFolder, folder, parentCategorizer);
    }

    this._logService.info(
      `Migrated tags and folders to local database.`,
      "",
      true,
      "CategorizerService"
    );

    localRealm.close();
  }

  /**
   * Migrate the cloud database to the local database. */
  @errorcatching(
    "Failed to migrate the cloud categorizers to the local database.",
    true,
    "DatabaseService"
  )
  async migrateCloudCountToLocal() {
    // Logout to ensure we get a local realm
    const localConfig = await this._databaseCore.getLocalConfig(false);
    const localRealm = new Realm(localConfig);

    localRealm.safeWrite = (callback) => {
      if (localRealm.isInTransaction) {
        return callback();
      } else {
        return localRealm.write(callback);
      }
    };

    const tags = localRealm
      .objects<PaperTag>("PaperTag");

    const folders = localRealm
      .objects<PaperFolder>("PaperFolder");

    this._categorizerRepository.updateCount(localRealm, CategorizerType.PaperTag, tags);
    this._categorizerRepository.updateCount(localRealm, CategorizerType.PaperFolder, folders);

    localRealm.close();
  }


}
