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
  ICategorizerObject,
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
   * Update a categorizer.
   * @param type - The type of categorizer.
   * @param categorizer - The categorizer.
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to create categorizers.", true, "CategorizerService")
  async create(type: CategorizerType, categorizer: Categorizer) {
    const realm = await this._databaseCore.realm();
    return this._categorizerRepository.update(
      realm,
      type,
      categorizer,
      this._databaseCore.getPartition()
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
      true,
      type,
      ids,
      categorizers
    );
  }

  /**
   * Colorize a categorizer.
   * @param color - The color.
   * @param type - The type of the categorizer.
   * @param name - The name of the categorizer.
   * @param categorizer - The categorizer.
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to colorize categorizers.", true, "CategorizerService")
  async colorize(
    color: Colors,
    type: CategorizerType,
    id?: OID,
    categorizer?: ICategorizerObject
  ) {
    this._categorizerRepository.colorize(
      await this._databaseCore.realm(),
      color,
      type,
      id,
      categorizer
    );
  }

  /**
   * Rename a categorizer.
   * @param oldName - The old name.
   * @param newName - The new name.
   * @param type - The type of the categorizer.
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to rename categorizers.", true, "CategorizerService")
  async rename(oldName: string, newName: string, type: CategorizerType) {
    this._categorizerRepository.rename(
      await this._databaseCore.realm(),
      oldName,
      newName,
      type
    );

    if (
      type === CategorizerType.PaperFolder &&
      this._preferenceService.get("pluginLinkedFolder") === oldName
    ) {
      this._preferenceService.set({ pluginLinkedFolder: newName });
    }
  }
}
