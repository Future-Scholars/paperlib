import { existsSync, promises } from "fs";
import path from "path";
import Realm from "realm";

import { migrate } from "@/base/database/migration";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { PaperFolder, PaperTag } from "@/models/categorizer";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import { PaperEntity } from "@/models/paper-entity";
import { PaperSmartFilter } from "@/models/smart-filter";
import { APPService, IAPPService } from "@/services/app-service";
import { ILogService, LogService } from "@/services/log-service";
import {
  IPreferenceService,
  PreferenceService,
} from "@/services/preference-service";
import { processing } from "@/services/state-service/processing";
import { ProcessingKey } from "@/services/state-service/state/processing";

export const DATABASE_SCHEMA_VERSION = 9;

enum ConfigType {
  Cloud,
  Local,
}

export interface IDatabaseCoreState {
  dbInitializing: number;
  dbInitialized: number;
}

export const IDatabaseCore = createDecorator("databaseCore");

export class DatabaseCore extends Eventable<IDatabaseCoreState> {
  private _realm?: Realm;
  private _app?: Realm.App;
  private _syncSession?: Realm.App.Sync.Session | null;
  private _partition?: string;

  constructor(
    @IAPPService private readonly appService: APPService,
    @IPreferenceService private readonly preferenceService: PreferenceService,
    @ILogService private readonly logService: LogService
  ) {
    super("databaseCore", {
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
    this.logService.info("Initializing database...", "", true, "Database");

    // Stop watch file to release lock
    // TODO: move this, should be here?
    await window.appInteractor.fileRepository.stopWatch();

    if (this._realm || reinit) {
      this.fire("dbInitializing");

      // TODO: Check all injected with this
      Realm.defaultPath = await this.appService.userDataPath();
      if (this._realm) {
        this._realm.close();
      }
      this._realm = undefined;
      this._app = undefined;
      this._syncSession = undefined;

      // TODO: listen this
      // this.paperEntityRepository.removeListeners();
      // this.categorizerRepository.removeListeners();
      // this.smartfilterRepository.removeListeners();
      // this.feedRepository.removeListeners();
      // this.feedEntityRepository.removeListeners();
    }

    const { config, type } = await this.getConfig();

    if (type === ConfigType.Cloud) {
      try {
        this._realm = new Realm(config);
        this._syncSession = this._realm.syncSession;
      } catch (err) {
        if (
          (err as Error).message.includes("Unexpected future history schema")
        ) {
          if (existsSync(config.path || "")) {
            await promises.unlink(config.path!);
            try {
              this._realm = new Realm(config);
              this._syncSession = this._realm.syncSession;
            } catch (err) {
              this.logService.error(
                "Failed to open cloud database",
                err as Error,
                true,
                "Database"
              );
            }
          }
        } else {
          window.logger.error(
            "Failed to open cloud database",
            err as Error,
            true,
            "Database"
          );
        }
      }
    } else {
      try {
        this._realm = new Realm(config);
      } catch (err) {
        this.logService.error(
          "Failed to open local database",
          err as Error,
          true,
          "Database"
        );
      }
    }

    this._realm!.safeWrite = (callback) => {
      if (this._realm!.isInTransaction) {
        return callback();
      } else {
        return this._realm!.write(callback);
      }
    };

    this.fire("dbInitialized");
    // Start watch file
    // TODO: move this
    window.appInteractor.fileRepository.startWatch();

    this.logService.info("Database initialized.", "", true, "Database");
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
    let syncPassword: string | undefined;

    if (this.preferenceService.get("useSync")) {
      try {
        syncPassword = (await window.appInteractor.getPassword(
          "realmSync"
        )) as string;
      } catch (err) {
        this.logService.error(
          "Failed to get sync password",
          err as Error,
          true,
          "Database"
        );
      }
      if (this.preferenceService.get("syncEmail") !== "" && syncPassword) {
        return {
          config: await this._getCloudConfig(),
          type: ConfigType.Cloud,
        };
      } else {
        return {
          config: await this._getLocalConfig(),
          type: ConfigType.Local,
        };
      }
    } else {
      return {
        config: await this._getLocalConfig(),
        type: ConfigType.Local,
      };
    }
  }

  /**
   * Get realm configuration for the local database
   * @param logout - if true, will logout from cloud
   * @returns - Realm configuration
   */
  private async _getLocalConfig(logout = true): Promise<Realm.Configuration> {
    if (logout) {
      await this._logoutCloud();
    }

    if (
      !existsSync(window.appInteractor.getPreference("appLibFolder") as string)
    ) {
      await promises.mkdir(
        window.appInteractor.getPreference("appLibFolder") as string,
        {
          recursive: true,
        }
      );
    }

    const config = {
      schema: [
        PaperEntity.schema,
        PaperTag.schema,
        PaperFolder.schema,
        PaperSmartFilter.schema,
        Feed.schema,
        FeedEntity.schema,
      ],
      schemaVersion: DATABASE_SCHEMA_VERSION,
      path: path.join(
        this.preferenceService.get("appLibFolder") as string,
        "default.realm"
      ),
      migration: migrate,
    };
    return config;
  }

  /**
   * Get realm configuration for the cloud database
   * @returns - Realm configuration
   */
  private async _getCloudConfig(): Promise<Realm.Configuration> {
    const cloudUser = await this._loginCloud();

    if (cloudUser) {
      const config = {
        schema: [
          PaperEntity.schema,
          PaperTag.schema,
          PaperFolder.schema,
          PaperSmartFilter.schema,
          Feed.schema,
          FeedEntity.schema,
        ],
        schemaVersion: DATABASE_SCHEMA_VERSION,
        sync: {
          user: cloudUser,
          partitionValue: cloudUser.id,
        },
        path: path.join(await appService.userDataPath(), "synced.realm"),
      };
      return config;
    } else {
      this.logService.warn(
        "Failed to login to cloud database",
        "",
        true,
        "Database"
      );
      preferenceService.set({ useSync: false });
      return this._getLocalConfig();
    }
  }

  /**
   * Login to cloud database
   * @returns - Realm user
   */
  private async _loginCloud(): Promise<Realm.User | null> {
    if (!this._app) {
      process.chdir(await this.appService.userDataPath());

      const id = preferenceService.get("syncAPPID") as string;
      this._app = new Realm.App({
        id: id,
      });
    }

    if (!window.networkTool.connected()) {
      this.logService.warn("No network connection...", "", true, "Database");
      return this._app?.currentUser ?? null;
    }

    try {
      const syncPassword = await window.appInteractor.getPassword("realmSync");
      const credentials = Realm.Credentials.emailPassword(
        window.appInteractor.getPreference("syncEmail") as string,
        syncPassword as string
      );

      const loginedUser = await this._app.logIn(credentials);

      this.logService.info("Logged in!", "", true, "Database");

      this._app.switchUser(loginedUser);

      this._partition = this._app.currentUser?.id || "";
      return this._app.currentUser;
    } catch (error) {
      preferenceService.set({ useSync: false });
      window.logger.error(
        "Failed to login to cloud database",
        error as Error,
        true,
        "Database"
      );

      return null;
    }
  }

  /**
   * Logout from cloud database
   * @returns
   */
  private async _logoutCloud() {
    if (this._app) {
      for (const [_, user] of Object.entries(this._app.allUsers)) {
        await this._app.removeUser(user);
      }
    }
    const syncDBPath = path.join(
      await this.appService.userDataPath(),
      "synced.realm"
    );
    if (existsSync(syncDBPath)) {
      await promises.unlink(syncDBPath);
    }
  }

  /**
   * Get partition value
   * @returns - Partition value
   */
  getPartition(): string {
    return this._partition || "";
  }

  /**
   * Pause cloud database sync
   * @returns
   */
  pauseSync() {
    if (this._syncSession) {
      this._syncSession.pause();
    }
  }

  /**
   * Resume cloud database sync
   * @returns
   */
  resumeSync() {
    if (this._syncSession) {
      this._syncSession.resume();
    }
  }
}
