import Realm from "realm";

import { MainRendererStateStore } from "@/state/renderer/appstate";
import { CategorizerRepository } from "./categorizer-repository";
import {
  Categorizer,
  CategorizerType,
  Colors,
  PaperFolder,
  PaperTag,
} from "@/models/categorizer";
import { migrate } from "./db-migration";
import { PaperEntity } from "@/models/paper-entity";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import { existsSync, promises } from "fs";
import path from "path";
import { PaperEntityRepository } from "./paper-entity-repository";

export class DBRepository {
  stateStore: MainRendererStateStore;

  _realm?: Realm;
  _schemaVersion: number;

  app?: Realm.App;
  cloudConfig?: Realm.Configuration;
  localConfig?: Realm.Configuration;

  syncSession?: Realm.App.Sync.Session | null;

  paperEntityRepository: PaperEntityRepository;
  categorizerRepository: CategorizerRepository;

  constructor(stateStore: MainRendererStateStore) {
    this.stateStore = stateStore;

    this.paperEntityRepository = new PaperEntityRepository(this.stateStore);
    this.categorizerRepository = new CategorizerRepository(this.stateStore);

    this._schemaVersion = 9;
  }

  async realm(): Promise<Realm> {
    if (!this._realm) {
      await this.initRealm(true);
    }
    return this._realm as Realm;
  }

  // ========================
  // Initialize
  // ========================
  async initRealm(reinit = false): Promise<Realm> {
    this.stateStore.viewState.processingQueueCount += 1;
    this.stateStore.logState.processLog = "Database Initializing...";

    if (this._realm || reinit) {
      if (this._realm) {
        this._realm.close();
      }
      this._realm = undefined;
      this.app = undefined;
      this.cloudConfig = undefined;
      this.syncSession = undefined;
      this.localConfig = undefined;

      this.paperEntityRepository.removeListeners();
      this.categorizerRepository.removeListeners();
      // TODO: Uncomment this
      // this.feedsListenerInited = false;
      // this.feedEntitiesListenerInited = false;
    }

    if (this._realm) {
      return this._realm;
    }

    await this.getConfig();

    if (this.cloudConfig) {
      try {
        this._realm = new Realm(this.cloudConfig);
        this.syncSession = this._realm.syncSession;
      } catch (err) {
        // @ts-ignore
        if (err.message.includes("Unexpected future history schema")) {
          if (existsSync(this.cloudConfig.path ? this.cloudConfig.path : "")) {
            await promises.unlink(this.cloudConfig.path!);
            try {
              this._realm = new Realm(this.cloudConfig);
              this.syncSession = this._realm.syncSession;
            } catch (err) {
              console.log(err);
              this.stateStore.logState.alertLog = `Open cloud database faild: ${
                err as string
              }`;
            }
          }
        } else {
          this.stateStore.logState.alertLog = `Open cloud database faild: ${
            err as string
          }`;
        }
      }
    } else {
      try {
        this._realm = new Realm(this.localConfig as Realm.Configuration);
      } catch (err) {
        console.error(err);
        this.stateStore.logState.alertLog = `Open local database faild: ${
          err as string
        }`;
      }
    }

    this._realm!.safeWrite = (callback) => {
      if (this._realm!.isInTransaction) {
        callback();
      } else {
        this._realm?.write(callback);
      }
    };

    this.stateStore.viewState.processingQueueCount -= 1;

    return this._realm!;
  }

  async getConfig(): Promise<Realm.Configuration> {
    const syncPassword = await window.appInteractor.getPassword("realmSync");
    if (
      window.appInteractor.getPreference("useSync") &&
      window.appInteractor.getPreference("syncEmail") !== "" &&
      syncPassword
    ) {
      return await this.getCloudConfig();
    } else {
      this.cloudConfig = undefined;
      return await this.getLocalConfig();
    }
  }

  async getLocalConfig(): Promise<Realm.Configuration> {
    await this.logoutCloud();

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
        Feed.schema,
        FeedEntity.schema,
      ],
      schemaVersion: this._schemaVersion,
      path: path.join(
        window.appInteractor.getPreference("appLibFolder") as string,
        "default.realm"
      ),
      migration: migrate,
    };
    this.localConfig = config;
    return config;
  }

  async getCloudConfig(): Promise<Realm.Configuration> {
    const cloudUser = await this.loginCloud();

    if (cloudUser) {
      const config = {
        schema: [
          PaperEntity.schema,
          PaperTag.schema,
          PaperFolder.schema,
          Feed.schema,
          FeedEntity.schema,
        ],
        schemaVersion: this._schemaVersion,
        sync: {
          user: cloudUser,
          partitionValue: cloudUser.id,
        },
        path: path.join(this.stateStore.dbState.defaultPath, "synced.realm"),
      };
      this.cloudConfig = config;
      return config;
    } else {
      window.appInteractor.setPreference("useSync", false);
      this.stateStore.viewState.preferenceUpdated = Date.now();
      return this.getLocalConfig();
    }
  }

  async loginCloud(this: DBRepository): Promise<Realm.User | null> {
    if (!this.app) {
      const id = window.appInteractor.getPreference("syncAPPID") as string;
      this.app = new Realm.App({
        id: id,
      });
    }

    // TODO: implement no internet connection detection
    if (false) {
      console.warn("No internet!");
      return this.app?.currentUser ?? null;
    }

    try {
      const syncPassword = await window.appInteractor.getPassword("realmSync");
      const credentials = Realm.Credentials.emailPassword(
        window.appInteractor.getPreference("syncEmail") as string,
        syncPassword as string
      );

      const loginedUser = await this.app.logIn(credentials);

      this.stateStore.logState.processLog =
        "Successfully logged in! Data is syncing...";

      this.app.switchUser(loginedUser);
      return this.app.currentUser;
    } catch (error) {
      window.appInteractor.setPreference("useSync", false);
      this.stateStore.viewState.preferenceUpdated = Date.now();
      this.stateStore.logState.alertLog = `Login failed, ${error as string}`;

      return null;
    }
  }

  async logoutCloud() {
    if (this.app) {
      // @ts-ignore
      for (const [_, user] of Object.entries(this.app.allUsers)) {
        await this.app.removeUser(user);
      }
    }
    const syncDBPath = path.join(
      this.stateStore.dbState.defaultPath,
      "synced.realm"
    );
    if (existsSync(syncDBPath)) {
      await promises.unlink(syncDBPath);
    }
  }

  // ========================
  // Sync Control
  // ========================
  pauseSync() {
    if (this.syncSession) {
      this.syncSession.pause();
    }
  }

  resumeSync() {
    if (this.syncSession) {
      this.syncSession.resume();
    }
  }

  // ========================
  // CRUD
  // ========================

  async paperEntities(
    search: string,
    flag: boolean,
    tag: string,
    folder: string,
    sortBy: string,
    sortOrder: string
  ) {
    const realm = await this.realm();
    return this.paperEntityRepository.load(
      realm,
      search,
      flag,
      tag,
      folder,
      sortBy,
      sortOrder
    );
  }

  async categorizers(type: CategorizerType, sortBy: string, sortOrder: string) {
    const realm = await this.realm();
    return this.categorizerRepository.load(realm, type, sortBy, sortOrder);
  }

  async deleteCategorizer(
    deleteAll = true,
    type: CategorizerType,
    categorizer?: Categorizer,
    name?: string
  ) {
    const realm = await this.realm();
    return this.categorizerRepository.remove(
      realm,
      deleteAll,
      type,
      categorizer,
      name
    );
  }

  async colorizeCategorizer(
    color: Colors,
    type: CategorizerType,
    categorizer?: Categorizer,
    name?: string
  ) {
    const realm = await this.realm();
    return this.categorizerRepository.colorize(
      realm,
      color,
      type,
      categorizer,
      name
    );
  }

  async renameCategorizer(
    oldName: string,
    newName: string,
    type: CategorizerType
  ) {
    const realm = await this.realm();
    return this.categorizerRepository.rename(realm, oldName, newName, type);
  }

  // ========================
  // Dev Functions
  // ========================

  async addDummyData() {
    const realm = await this.realm();
    const { tag, folder } = await this.categorizerRepository.addDummyData(
      realm
    );
    this.paperEntityRepository.addDummyData(tag, folder, realm);
  }

  async removeAll() {
    const realm = await this.realm();
    this.paperEntityRepository.removeAll(realm);
    this.categorizerRepository.removeAll(realm);
  }
}
