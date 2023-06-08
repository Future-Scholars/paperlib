import { ObjectId } from "bson";
import { existsSync, promises } from "fs";
import path from "path";
import Realm from "realm";

import {
  Categorizer,
  CategorizerType,
  Colors,
  PaperFolder,
  PaperTag,
} from "@/models/categorizer";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import { PaperEntity } from "@/models/paper-entity";
import { ThumbnailCache } from "@/models/paper-entity-cache";
import { PaperSmartFilter, PaperSmartFilterType } from "@/models/smart-filter";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import { CacheRepository } from "./cache-repository";
import { CategorizerRepository } from "./categorizer-repository";
import { migrate } from "./db-migration";
import { FeedEntityRepository } from "./feed-entity-repository";
import { FeedRepository } from "./feed-repository";
import { PaperEntityRepository } from "./paper-entity-repository";
import { PaperSmartFilterRepository } from "./smartfilter-repository";

export class DBRepository {
  stateStore: MainRendererStateStore;
  preference: Preference;

  _realm?: Realm;
  _schemaVersion: number;

  app?: Realm.App;
  cloudConfig?: Realm.Configuration;
  localConfig?: Realm.Configuration;

  syncSession?: Realm.App.Sync.Session | null;

  paperEntityRepository: PaperEntityRepository;
  categorizerRepository: CategorizerRepository;
  smartfilterRepository: PaperSmartFilterRepository;

  feedEntityRepository: FeedEntityRepository;
  feedRepository: FeedRepository;

  cacheRepository: CacheRepository;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;

    this.paperEntityRepository = new PaperEntityRepository(this.stateStore);
    this.categorizerRepository = new CategorizerRepository(this.stateStore);
    this.smartfilterRepository = new PaperSmartFilterRepository(
      this.stateStore
    );

    this.feedEntityRepository = new FeedEntityRepository(this.stateStore);
    this.feedRepository = new FeedRepository(this.stateStore);

    this.cacheRepository = new CacheRepository(
      this.stateStore,
      this.preference
    );

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
    window.logger.info("Initializing database...", "", true, "Database");

    // Stop watch file to release lock
    await window.appInteractor.fileRepository.stopWatch();

    if (this._realm || reinit) {
      Realm.defaultPath = window.appInteractor.getUserDataPath();
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
      this.smartfilterRepository.removeListeners();
      this.feedRepository.removeListeners();
      this.feedEntityRepository.removeListeners();
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
              window.logger.error(
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
        this._realm = new Realm(this.localConfig as Realm.Configuration);
      } catch (err) {
        window.logger.error(
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

    // Start watch file
    window.appInteractor.fileRepository.startWatch();

    this.stateStore.viewState.processingQueueCount -= 1;

    this.stateStore.viewState.realmReinited = Date.now();

    return this._realm!;
  }

  async getConfig(): Promise<Realm.Configuration> {
    let syncPassword;

    try {
      syncPassword = await window.appInteractor.getPassword("realmSync");
    } catch (err) {
      window.logger.error(
        "Failed to get sync password",
        err as Error,
        true,
        "Database"
      );
    }
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

  async getLocalConfig(logout = true): Promise<Realm.Configuration> {
    if (logout) {
      await this.logoutCloud();
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
          PaperSmartFilter.schema,
          Feed.schema,
          FeedEntity.schema,
        ],
        schemaVersion: this._schemaVersion,
        sync: {
          user: cloudUser,
          partitionValue: cloudUser.id,
        },
        path: path.join(window.appInteractor.getUserDataPath(), "synced.realm"),
      };
      this.cloudConfig = config;
      return config;
    } else {
      window.logger.warn(
        "Failed to login to cloud database",
        "",
        true,
        "Database"
      );
      window.appInteractor.setPreference("useSync", false);
      return this.getLocalConfig();
    }
  }

  async loginCloud(this: DBRepository): Promise<Realm.User | null> {
    if (!this.app) {
      process.chdir(window.appInteractor.getUserDataPath());

      const id = window.appInteractor.getPreference("syncAPPID") as string;
      this.app = new Realm.App({
        id: id,
      });
    }

    if (!window.networkTool.connected()) {
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

      window.logger.info("Successfully logged in!", "", true, "Database");

      this.app.switchUser(loginedUser);
      return this.app.currentUser;
    } catch (error) {
      window.appInteractor.setPreference("useSync", false);
      window.logger.error(
        "Failed to login to cloud database",
        error as Error,
        true,
        "Database"
      );

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
      window.appInteractor.getUserDataPath(),
      "synced.realm"
    );
    if (existsSync(syncDBPath)) {
      await promises.unlink(syncDBPath);
    }
  }

  getPartition() {
    return this.cloudConfig && this.app && this.app.currentUser
      ? this.app.currentUser.id.toString()
      : "";
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

  async migrateLocaltoCloud() {
    try {
      const localConfig = await this.getLocalConfig(false);
      const localRealm = new Realm(localConfig);

      const entities = localRealm.objects<PaperEntity>("PaperEntity");
      const entityDraftsWithCategorizer = entities.map((entity) => {
        const draft = new PaperEntity(false).initialize(entity);
        return draft;
      });

      const entityDraftsWithoutCategorizer = entities.map((entity) => {
        const draft = new PaperEntity(false).initialize(entity);
        draft.tags = [];
        draft.folders = [];
        return draft;
      });

      await this.updatePaperEntities(entityDraftsWithoutCategorizer);
      await this.updatePaperEntities(entityDraftsWithCategorizer);
    } catch (error) {
      window.logger.error("Migration failed", error as Error, true, "Database");
    }
  }

  // ======================================
  // CRUD
  // ======================================

  // ========================
  // Read
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

    const _search = search;
    if (this.stateStore.viewState.searchMode === "fulltext") {
      search = "";
    }

    let paperEntities = this.paperEntityRepository.load(
      realm,
      search,
      flag,
      tag,
      folder,
      sortBy,
      sortOrder
    );

    if (this.stateStore.viewState.searchMode === "fulltext" && _search) {
      paperEntities = await this.cacheRepository.fullTextFilter(
        _search,
        paperEntities
      );
    }

    return paperEntities;
  }

  async paperEntitiesByIds(ids: (string | ObjectId)[]) {
    const realm = await this.realm();
    return this.paperEntityRepository.loadByIds(realm, ids);
  }

  async preprintPaperEntities() {
    const realm = await this.realm();
    return this.paperEntityRepository.loadPreprint(realm);
  }

  async categorizers(type: CategorizerType, sortBy: string, sortOrder: string) {
    const realm = await this.realm();
    return this.categorizerRepository.load(realm, type, sortBy, sortOrder);
  }

  async smartfilters(
    type: PaperSmartFilterType,
    sortBy: string,
    sortOrder: string
  ) {
    const realm = await this.realm();
    return this.smartfilterRepository.load(realm, type, sortBy, sortOrder);
  }

  async feeds(sortBy: string, sortOrder: string) {
    const realm = await this.realm();
    return this.feedRepository.load(realm, sortBy, sortOrder);
  }

  async feedEntities(
    search: string,
    name: string,
    unread: boolean,
    sortBy: string,
    sortOrder: string
  ) {
    const realm = await this.realm();
    return this.feedEntityRepository.load(
      realm,
      search,
      name,
      unread,
      sortBy,
      sortOrder
    );
  }

  async thumbnail(paperEntity: PaperEntity) {
    return await this.cacheRepository.thumbnail(paperEntity);
  }

  // ========================
  // Create and Update
  // ========================
  async updatePaperEntities(paperEntities: PaperEntity[]): Promise<boolean[]> {
    const realm = await this.realm();

    return realm.safeWrite(() => {
      const successes: boolean[] = [];
      for (const paperEntity of paperEntities) {
        let existingPaperEntity = null;
        if (paperEntity._id) {
          const existingObjs = this.paperEntityRepository.loadByIds(realm, [
            paperEntity._id,
          ]);
          if (existingObjs.length > 0) {
            existingPaperEntity = existingObjs[0];
          }
        }

        const tags = this.categorizerRepository.update(
          realm,
          existingPaperEntity ? existingPaperEntity.tags : [],
          paperEntity.tags,
          "PaperTag",
          this.getPartition()
        );
        const folders = this.categorizerRepository.update(
          realm,
          existingPaperEntity ? existingPaperEntity.folders : [],
          paperEntity.folders,
          "PaperFolder",
          this.getPartition()
        );

        const success = this.paperEntityRepository.update(
          realm,
          paperEntity,
          tags,
          folders,
          existingPaperEntity,
          this.getPartition()
        );
        successes.push(success);
      }
      return successes;
    });
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

  async insertPaperSmartFilter(
    type: PaperSmartFilterType,
    smartfilter: PaperSmartFilter
  ) {
    const realm = await this.realm();
    return this.smartfilterRepository.insert(
      realm,
      smartfilter,
      type,
      this.getPartition()
    );
  }

  async colorizePaperSmartFilter(
    color: Colors,
    type: PaperSmartFilterType,
    smartfilter?: PaperSmartFilter,
    name?: string
  ) {
    const realm = await this.realm();
    return this.smartfilterRepository.colorize(
      realm,
      color,
      type,
      smartfilter,
      name
    );
  }

  async updateFeeds(feeds: Feed[]) {
    const realm = await this.realm();

    return realm.safeWrite(() => {
      const successes: boolean[] = [];
      for (const feed of feeds) {
        let existingFeed = null;
        if (feed._id) {
          const existingObjs = this.feedRepository.loadByIds(realm, [feed._id]);
          if (existingObjs.length > 0) {
            existingFeed = existingObjs[0];
          }
        }
        const success = this.feedRepository.update(
          realm,
          existingFeed,
          feed,
          this.getPartition()
        );
        successes.push(success !== null);
      }

      return successes;
    });
  }

  async colorizeFeed(color: Colors, feed?: Feed, name?: string) {
    const realm = await this.realm();
    return this.feedRepository.colorize(realm, color, feed, name);
  }

  async updateFeedEntities(
    feedEntities: FeedEntity[],
    ignoreReadState = false
  ) {
    const realm = await this.realm();

    realm.safeWrite(() => {
      const successes: boolean[] = [];
      for (const feedEntity of feedEntities) {
        let existingFeedEntity = null;
        if (feedEntity._id) {
          const existingObjs = this.feedEntityRepository.loadByIds(realm, [
            feedEntity._id,
          ]);
          if (existingObjs.length > 0) {
            existingFeedEntity = existingObjs[0];
          }
        }

        const feed = existingFeedEntity
          ? this.feedRepository.update(
              realm,
              existingFeedEntity.feed,
              feedEntity.feed,
              this.getPartition()
            )
          : this.feedRepository.update(
              realm,
              null,
              feedEntity.feed,
              this.getPartition()
            );
        let success;
        if (feed) {
          success = this.feedEntityRepository.update(
            realm,
            feedEntity,
            feed,
            existingFeedEntity,
            ignoreReadState,
            this.getPartition()
          );

          if (success === "updated") {
            this.feedRepository.delete(realm, false, feed);
          }

          success = success ? true : false;
        } else {
          success = false;
        }
        successes.push(success);
      }
    });
  }

  async updatePaperEntitiesCacheFullText(paperEntities: PaperEntity[]) {
    await this.cacheRepository.updateFullText(paperEntities);
  }

  async updatePaperEntityCacheThumbnail(
    paperEntity: PaperEntity,
    thumbnailCache: ThumbnailCache
  ) {
    await this.cacheRepository.updateThumbnail(paperEntity, thumbnailCache);
  }

  // ========================
  // Delete
  // ========================
  async deleteCategorizer(
    deleteAll = true,
    type: CategorizerType,
    categorizer?: Categorizer,
    name?: string
  ) {
    const realm = await this.realm();
    return this.categorizerRepository.delete(
      realm,
      deleteAll,
      type,
      categorizer,
      name
    );
  }

  async deletePaperSmartFilter(
    type: PaperSmartFilterType,
    smartfilter?: PaperSmartFilter,
    name?: string
  ) {
    const realm = await this.realm();
    return this.smartfilterRepository.delete(realm, type, smartfilter, name);
  }

  async deletePaperEntities(ids: (ObjectId | string)[]) {
    const realm = await this.realm();

    const toBeDeletedObjs = this.paperEntityRepository.loadByIds(realm, ids);
    const removeFileURLs = realm.safeWrite(() => {
      const removeFileURLs: string[] = [];
      for (const obj of toBeDeletedObjs) {
        for (const tag of obj.tags) {
          this.categorizerRepository.delete(realm, false, "PaperTag", tag);
        }
        for (const folder of obj.folders) {
          this.categorizerRepository.delete(
            realm,
            false,
            "PaperFolder",
            folder
          );
        }

        const objFileURLs = [obj.mainURL, ...obj.supURLs];
        const success = this.paperEntityRepository.delete(realm, obj);
        if (success) {
          removeFileURLs.push(...objFileURLs);
        }
      }
      return removeFileURLs;
    });

    await this.cacheRepository.delete(ids);
    return removeFileURLs;
  }

  async deleteOutdatedFeedEntities() {
    const realm = await this.realm();
    return this.feedEntityRepository.deleteOutdate(realm);
  }

  async deleteFeed(deleteAll = true, feed?: Feed, name?: string) {
    const realm = await this.realm();

    const toBeDeletedName = feed ? feed.name : name;
    const feedEntities = this.feedEntityRepository.load(
      realm,
      "",
      toBeDeletedName || "",
      false,
      "addTime",
      "desc"
    );

    return realm.safeWrite(async () => {
      await this.feedEntityRepository.delete(
        realm,
        undefined,
        feedEntities.map((entity) => entity._id)
      );
      return await this.feedRepository.delete(realm, deleteAll, feed, name);
    });
  }

  // ========================
  // Dev Functions
  // ========================

  async addDummyData() {
    const realm = await this.realm();
    const { tag, folder } = await this.categorizerRepository.addDummyData(
      realm,
      this.getPartition()
    );
    this.paperEntityRepository.addDummyData(
      tag,
      folder,
      realm,
      this.getPartition()
    );

    // const feed = await this.feedRepository.addDummyData(realm);
    // this.feedEntityRepository.addDummyData(feed, realm);
  }

  async removeAll() {
    const realm = await this.realm();
    this.paperEntityRepository.removeAll(realm);
    this.categorizerRepository.deleteAll(realm);
    this.feedRepository.deleteAll(realm);
    this.feedEntityRepository.removeAll(realm);
    this.cacheRepository.removeAll();
  }
}
