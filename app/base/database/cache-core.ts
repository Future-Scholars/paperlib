import { existsSync, promises } from "fs";
import path from "path";
import Realm from "realm";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import { PaperEntityCache } from "@/models/paper-entity-cache";
import { APPService, IAPPService } from "@/renderer/services/app-service";
import { ILogService, LogService } from "@/renderer/services/log-service";
import { processing } from "@/renderer/services/state-service/processing";
import { ProcessingKey } from "@/renderer/services/state-service/state/processing";

export const DATABASE_SCHEMA_VERSION = 2;

enum ConfigType {
  Local,
}

export interface ICacheDatabaseCoreState {
  dbInitializing: number;
  dbInitialized: number;
}

export const ICacheDatabaseCore = createDecorator("cacheDatabaseCore");

export class CacheDatabaseCore extends Eventable<ICacheDatabaseCoreState> {
  private _realm?: Realm;
  private _app?: Realm.App;

  constructor(
    @IAPPService private readonly _appService: APPService,
    @IPreferenceService private readonly _preferenceService: PreferenceService,
    @ILogService private readonly _logService: LogService
  ) {
    super("cacheDatabaseCore", {
      dbInitializing: 0,
      dbInitialized: 0,
    });
  }

  async realm(): Promise<Realm> {
    if (!this._realm) {
      await this.initRealm(true);
    }
    return this._realm as Realm;
  }

  /**
   *  Initialize realm database
   * @param reinit - if true, will reinit database
   * @returns - Realm instance
   */
  @processing(ProcessingKey.General)
  async initRealm(reinit = false): Promise<Realm> {
    this._logService.info(
      "Initializing cache database...",
      "",
      true,
      "Database"
    );

    if (this._realm || reinit) {
      this.fire("dbInitializing");

      // TODO: Check all injected with this
      Realm.defaultPath = await this._appService.userDataPath();
      if (this._realm) {
        this._realm.close();
      }
      this._realm = undefined;
      this._app = undefined;
    }

    const { config, type } = await this.getConfig();

    if (type === ConfigType.Local) {
      try {
        this._realm = new Realm(config);
      } catch (err) {
        this._logService.error(
          "Failed to open local cache database",
          err as Error,
          true,
          "Database"
        );
      }
    } else {
      // Always local for cache
    }

    this._realm!.safeWrite = (callback) => {
      if (this._realm!.isInTransaction) {
        return callback();
      } else {
        return this._realm!.write(callback);
      }
    };

    this.fire("dbInitialized");

    this._logService.info("Cache database initialized.", "", true, "Database");
    return this._realm!;
  }

  /**
   * Get realm configuration for the local/cloud database
   * @returns - Realm configuration
   */
  async getConfig(): Promise<{
    config: Realm.Configuration;
    type: ConfigType;
  }> {
    return {
      config: await this._getLocalConfig(),
      type: ConfigType.Local,
    };
  }

  /**
   * Get realm configuration for the local database
   * @param logout - if true, will logout from cloud
   * @returns - Realm configuration
   */
  private async _getLocalConfig(): Promise<Realm.Configuration> {
    if (
      existsSync(
        path.join(
          this._preferenceService.get("appLibFolder") as string,
          "cache.realm"
        )
      )
    ) {
      const userDataPath = await this._appService.userDataPath();
      try {
        if (path.join(userDataPath, "cache.realm")) {
          await promises.unlink(path.join(userDataPath, "cache.realm"));
        }
        if (path.join(userDataPath, "cache.realm.lock")) {
          await promises.unlink(path.join(userDataPath, "cache.realm.lock"));
        }
        if (path.join(userDataPath, "cache.realm.management")) {
          await promises.unlink(
            path.join(userDataPath, "cache.realm.management")
          );
        }
      } catch (err) {
        this._logService.error(
          "Failed to unlink old cache database",
          err as Error,
          false,
          "Database"
        );
      }
      try {
        await promises.rename(
          path.join(
            this._preferenceService.get("appLibFolder") as string,
            "cache.realm"
          ),
          path.join(userDataPath, "cache.realm")
        );
      } catch (err) {
        this._logService.error(
          "Failed to rename old cache database",
          err as Error,
          false,
          "Database"
        );
      }

      try {
        await promises.rename(
          path.join(
            this._preferenceService.get("appLibFolder") as string,
            "cache.realm.lock"
          ),
          path.join(userDataPath, "cache.realm.lock")
        );
      } catch (err) {
        console.error(err);
      }

      try {
        await promises.rename(
          path.join(
            this._preferenceService.get("appLibFolder") as string,
            "cache.realm.management"
          ),
          path.join(userDataPath, "cache.realm.management")
        );
      } catch (err) {
        console.error(err);
      }
    }

    const config = {
      schema: [PaperEntityCache.schema],
      schemaVersion: DATABASE_SCHEMA_VERSION,
      path: path.join(await this._appService.userDataPath(), "cache.realm"),
    };
    return config;
  }
}
