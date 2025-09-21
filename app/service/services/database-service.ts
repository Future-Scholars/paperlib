import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { ProcessingKey, processing } from "@/common/utils/processing";
import { DatabaseCore, IDatabaseCore } from "@/service/services/database/core";
import { SQLiteMigrationService } from "@/service/services/database/sqlite/migration-service";
import { ILogService, LogService } from "@/common/services/log-service";

export interface IDatabaseServiceState {
  dbInitializing: number;
  dbInitialized: number;
}

export const IDatabaseService = createDecorator("databaseService");

/**
 * Service for database operations except data access and modification.
 */
export class DatabaseService extends Eventable<IDatabaseServiceState> {
  private _sqliteMigrationService: SQLiteMigrationService;

  constructor(
    @IDatabaseCore private readonly _databaseCore: DatabaseCore,
    @ILogService private readonly _logService: LogService
  ) {
    super("databaseService", {
      dbInitializing: 0,
      dbInitialized: 0,
    });

    this._sqliteMigrationService = new SQLiteMigrationService(this._logService);

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
    // First, run SQLite migrations if needed
    try {
      const needsMigration = await this._sqliteMigrationService.needsMigration();
      if (needsMigration) {
        this._logService.info(
          "SQLite migrations needed, running migrations before Realm initialization...",
          "",
          false,
          "DatabaseService"
        );
        await this._sqliteMigrationService.migrateToLatest();
      } else {
        this._logService.info(
          "No SQLite migrations needed",
          "",
          false,
          "DatabaseService"
        );
      }
    } catch (error) {
      this._logService.error(
        "SQLite migration failed, continuing with Realm initialization",
        error as Error,
        true,
        "DatabaseService"
      );
      // Don't throw here - let Realm initialization continue
      // This allows the app to work even if SQLite migrations fail
    }

    // Then initialize the Realm database
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

  /**
   * Get pending SQLite migrations
   */
  async getPendingSQLiteMigrations(): Promise<string[]> {
    return await this._sqliteMigrationService.getPendingMigrations();
  }

  /**
   * Check if SQLite migrations are needed
   */
  async needsSQLiteMigration(): Promise<boolean> {
    return await this._sqliteMigrationService.needsMigration();
  }

  /**
   * Run SQLite migrations manually
   */
  async runSQLiteMigrations(): Promise<void> {
    await this._sqliteMigrationService.migrateToLatest();
  }

  /**
   * Rollback SQLite migrations
   */
  async rollbackSQLiteMigrations(targetMigration?: string): Promise<void> {
    await this._sqliteMigrationService.migrateDown(targetMigration);
  }
}
