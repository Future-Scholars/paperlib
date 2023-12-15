import { existsSync, promises } from "fs";
import path from "path";
import Realm from "realm";

import { migrate } from "@/base/database/migration";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import { PaperFolder, PaperTag } from "@/models/categorizer";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import { PaperEntity } from "@/models/paper-entity";
import { PaperSmartFilter } from "@/models/smart-filter";
import { APPService, IAPPService } from "@/renderer/services/app-service";
import { FileService, IFileService } from "@/renderer/services/file-service";
import { ILogService, LogService } from "@/renderer/services/log-service";
import { ProcessingKey, processing } from "@/renderer/services/uistate-service";

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
    @IAPPService private readonly _appService: APPService,
    @IFileService private readonly _fileService: FileService,
    @IPreferenceService private readonly _preferenceService: PreferenceService,
    @ILogService private readonly _logService: LogService
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
    this._logService.info("Initializing database...", "", true, "Database");
    await this._fileService.stopWatch();

    if (this._realm || reinit) {
      this._realm?.removeAllListeners();
      this.fire("dbInitializing");

      // TODO: Check all injected object use this. nor global
      Realm.defaultPath = await this._appService.userDataPath();
      if (this._realm) {
        this._realm.close();
      }
      this._realm = undefined;
      this._app = undefined;
      this._syncSession = undefined;
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
              this._logService.error(
                "Failed to open cloud database",
                err as Error,
                true,
                "Database"
              );
            }
          }
        } else {
          this._logService.error(
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
        this._logService.error(
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

    this._realm!.paperEntityListened = false;
    this._realm!.tagsListened = false;
    this._realm!.foldersListened = false;
    this._realm!.smartfilterListened = false;
    this._realm!.feedEntityListened = false;
    this._realm!.feedListened = false;

    this.fire("dbInitialized");
    await this._fileService.startWatch();

    this._logService.info("Database initialized.", "", true, "Database");
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

    if (this._preferenceService.get("useSync")) {
      try {
        syncPassword =
          (await this._preferenceService.getPassword("realmSync")) || "";
      } catch (err) {
        this._logService.error(
          "Failed to get sync password",
          err as Error,
          true,
          "Database"
        );
      }
      if (this._preferenceService.get("syncEmail") !== "" && syncPassword) {
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

    if (!existsSync(this._preferenceService.get("appLibFolder") as string)) {
      await promises.mkdir(
        this._preferenceService.get("appLibFolder") as string,
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
        this._preferenceService.get("appLibFolder") as string,
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
        path: path.join(await this._appService.userDataPath(), "synced.realm"),
      };
      return config;
    } else {
      this._logService.warn(
        "Failed to login to cloud database",
        "",
        true,
        "Database"
      );
      this._preferenceService.set({ useSync: false });
      return this._getLocalConfig();
    }
  }

  /**
   * Login to cloud database
   * @returns - Realm user
   */
  private async _loginCloud(): Promise<Realm.User | null> {
    if (!this._app) {
      process.chdir(await this._appService.userDataPath());

      const id = this._preferenceService.get("syncAPPID") as string;
      this._app = new Realm.App({
        id: id,
      });
    }

    if (!networkTool.connected()) {
      this._logService.warn("No network connection...", "", true, "Database");
      return this._app?.currentUser ?? null;
    }

    try {
      const syncPassword =
        (await this._preferenceService.getPassword("realmSync")) || "";
      const credentials = Realm.Credentials.emailPassword(
        this._preferenceService.get("syncEmail") as string,
        syncPassword
      );

      const loginedUser = await this._app.logIn(credentials);

      this._logService.info("Logged in!", "", true, "Database");

      this._app.switchUser(loginedUser);

      this._partition = this._app.currentUser?.id || "";
      return this._app.currentUser;
    } catch (error) {
      this._preferenceService.set({ useSync: false });
      this._logService.error(
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
      await this._appService.userDataPath(),
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
