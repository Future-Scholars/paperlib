import { DatabaseCore, IDatabaseCore } from "@/base/database/core";
import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import { Categorizer, CategorizerType, Colors } from "@/models/categorizer";
import { OID } from "@/models/id";
import { ILogService, LogService } from "@/renderer/services/log-service";
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
   * Update a categorizer.
   * @param type - The type of categorizer.
   * @param categorizer - The categorizer.
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to create categorizers.", true, "CategorizerService")
  async create(
    type: CategorizerType,
    categorizer: Categorizer,
    parent?: Categorizer
  ) {
    const realm = await this._databaseCore.realm();
    return this._categorizerRepository.update(
      realm,
      type,
      categorizer,
      this._databaseCore.getPartition(),
      parent
    );
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
          name: object.name,
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
    if (!categorizer.name || categorizer.name?.includes("/")) {
      throw new Error("Invalid name, name cannot be empty or contain '/'");
    }

    return this._categorizerRepository.update(
      await this._databaseCore.realm(),
      type,
      categorizer,
      this._databaseCore.getPartition(),
      parentCategorizer
    );
  }
}
