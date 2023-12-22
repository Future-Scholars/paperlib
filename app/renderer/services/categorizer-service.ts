import { DatabaseCore, IDatabaseCore } from "@/base/database/core";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
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
import { ILogService, LogService } from "@/renderer/services/log-service";
import { ProcessingKey, processing } from "@/renderer/services/uistate-service";
import {
  CategorizerRepository,
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
   * @param type The type of the categorizer.
   * @param sortBy Sort: by
   * @param sortOrder Sort: order
   * @returns
   */
  @processing(ProcessingKey.General)
  async load(type: CategorizerType, sortBy: string, sortOrder: string) {
    try {
      return this._categorizerRepository.load(
        await this._databaseCore.realm(),
        type,
        sortBy,
        sortOrder
      );
    } catch (error) {
      this._logService.error(
        `Load categorizer failed: ${type} ${sortBy} ${sortOrder}`,
        error as Error,
        true,
        "CategoryService"
      );
      return [];
    }
  }

  async create(type: CategorizerType, name: string, color?: Colors) {
    try {
      const realm = await this._databaseCore.realm();

      if (type === CategorizerType.PaperTag) {
        const newTag = new PaperTag(name, -1, color);
        const tags = this._categorizerRepository.update(
          realm,
          [],
          [newTag],
          CategorizerType.PaperTag,
          this._databaseCore.getPartition()
        );
      } else {
        const newFolder = new PaperFolder(name, -1, color);
        const folders = this._categorizerRepository.update(
          realm,
          [],
          [newFolder],
          CategorizerType.PaperFolder,
          this._databaseCore.getPartition()
        );
      }
    } catch (error) {
      this._logService.error(
        `Create categorizer failed: ${type} ${name}`,
        error as Error,
        true,
        "CategorizerService"
      );
    }
  }

  /**
   * Delete a categorizer.
   * @param type - The type of categorizer.
   * @param name - The name of categorizer.
   * @param categorizer - The categorizer.
   * @returns
   */
  @processing(ProcessingKey.General)
  async delete(
    type: CategorizerType,
    name?: string,
    categorizer?: Categorizer
  ) {
    try {
      this._categorizerRepository.delete(
        await this._databaseCore.realm(),
        true,
        type,
        categorizer,
        name
      );
    } catch (error) {
      this._logService.error(
        `Delete categorizer failed: ${type} ${name} ${categorizer}`,
        error as Error,
        true,
        "CategoryService"
      );
    }
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
  async colorize(
    color: Colors,
    type: CategorizerType,
    name?: string,
    categorizer?: Categorizer
  ) {
    try {
      this._categorizerRepository.colorize(
        await this._databaseCore.realm(),
        color,
        type,
        categorizer,
        name
      );
    } catch (error) {
      this._logService.error(
        `Failed to colorize categorizer ${type} ${name} ${categorizer}`,
        error as Error,
        true,
        "CategoryService"
      );
    }
  }

  /**
   * Rename a categorizer.
   * @param oldName - The old name.
   * @param newName - The new name.
   * @param type - The type of the categorizer.
   * @returns
   */
  async rename(oldName: string, newName: string, type: CategorizerType) {
    try {
      this._categorizerRepository.rename(
        await this._databaseCore.realm(),
        oldName,
        newName,
        type
      );

      if (
        type === "PaperFolder" &&
        this._preferenceService.get("pluginLinkedFolder") === oldName
      ) {
        this._preferenceService.set({ pluginLinkedFolder: newName });
      }
    } catch (error) {
      this._logService.error(
        `Failed to rename categorizer ${oldName} to ${newName}`,
        error as Error,
        true,
        "CategoryService"
      );
    }
  }
}
