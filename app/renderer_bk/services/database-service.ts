import { DatabaseCore, IDatabaseCore } from "@/base/database/core";
import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import {
  ProcessingKey,
  processing,
} from "@/renderer/services//uistate-service";

export interface IDatabaseServiceState {
  dbInitializing: number;
  dbInitialized: number;
}

export const IDatabaseService = createDecorator("databaseService");

/**
 * Service for database operations except data access and modification.
 */
export class DatabaseService extends Eventable<IDatabaseServiceState> {
  constructor(@IDatabaseCore private readonly _databaseCore: DatabaseCore) {
    super("databaseService", {
      dbInitializing: 0,
      dbInitialized: 0,
    });

    this._databaseCore.on(["dbInitializing", "dbInitialized"], (payload) => {
      this.fire({ [payload.key]: payload.value });
    });
  }

  /**
   * Initialize the database.
   * @param reinit - Whether to reinitialize the database. */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to initialize the database.", true, "DatabaseService")
  async initialize(reinit: boolean = true) {
    await this._databaseCore.initRealm(reinit);
  }

  /**
   * Pause the synchronization of the database. */
  @errorcatching(
    "Failed to pause the synchronization.",
    true,
    "DatabaseService"
  )
  pauseSync() {
    this._databaseCore.pauseSync();
  }

  /**
   * Resume the synchronization of the database. */
  @errorcatching(
    "Failed to resume the synchronization.",
    true,
    "DatabaseService"
  )
  resumeSync() {
    this._databaseCore.resumeSync();
  }

  /**
   * Delete the synchronization cache. */
  async deleteSyncCache() {
    await this._databaseCore.deleteSyncCache();
  }
}
