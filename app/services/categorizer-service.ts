import { DatabaseCore, IDatabaseCore } from "@/base/database/core";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Categorizer, CategorizerType, Colors } from "@/models/categorizer";
import {
  CategorizerRepository,
  ICategorizerRepository,
} from "@/repositories/db-repository/categorizer-repository-v2";
import { ILogService, LogService } from "@/services/log-service";
import { ProcessingKey, processing } from "@/services/state-service/processing";

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
    @ILogService private readonly _logService: LogService
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

      // TODO: make the following eventable
      // if (
      //   type === "PaperFolder" &&
      //   stateService.selectionState.pluginLinkedFolder === oldName
      // ) {
      //   stateService.selectionState.pluginLinkedFolder = newName;
      //   preferenceService.set({ pluginLinkedFolder: newName });
      // }
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
