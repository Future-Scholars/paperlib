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
}
