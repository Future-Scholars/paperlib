import Realm from "realm";
import path from "path";
import { existsSync, promises as fsPromise } from "fs";
import keytar from "keytar";

import { PaperEntitySchema } from "../../models/PaperEntity";
import {
  PaperFolderSchema,
  PaperTagSchema,
} from "../../models/PaperCategorizer";
import { FeedSchema } from "../../models/Feed";
import { FeedEntitySchema } from "../../models/FeedEntity";

import { migrate } from "./db-migration";
import { DBRepository } from "./db-repository";

export async function initRealm(this: DBRepository, reinit = false) {
  this.sharedState.set(
    "viewState.processingQueueCount",
    (this.sharedState.viewState.processingQueueCount.value as number) + 1
  );
  this.sharedState.set(
    "viewState.processInformation",
    "Initialize database..."
  );

  if (this._realm || reinit) {
    if (this._realm) {
      this._realm.close();
    }
    this._realm = null;
    this.app = null;
    this.cloudConfig = null;
    this.syncSession = null;
    this.localConfig = null;
    this.entitiesListenerInited = false;
    this.categorizersListenerInited = {
      PaperTag: false,
      PaperFolder: false,
    };
    this.feedsListenerInited = false;
    this.feedEntitiesListenerInited = false;
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
          await fsPromise.unlink(this.cloudConfig.path!);
          try {
            this._realm = new Realm(this.cloudConfig);
            this.syncSession = this._realm.syncSession;
          } catch (err) {
            console.log(err);
            this.sharedState.set(
              "viewState.alertInformation",
              `Open cloud database faild: ${err as string}`
            );
          }
        }
      } else {
        this.sharedState.set(
          "viewState.alertInformation",
          `Open cloud database faild: ${err as string}`
        );
      }
    }
  } else {
    try {
      this._realm = new Realm(this.localConfig as Realm.Configuration);
    } catch (err) {
      console.log(err);
      this.sharedState.set(
        "viewState.alertInformation",
        `Open local database faild: ${err as string}`
      );
    }
  }
  this.sharedState.set(
    "viewState.processingQueueCount",
    (this.sharedState.viewState.processingQueueCount.value as number) - 1
  );

  // @ts-ignore
  this._realm.safeWrite = (callback) => {
    if (this._realm?.isInTransaction) {
      callback();
    } else {
      this._realm?.write(callback);
    }
  };

  return this._realm;
}

export async function getConfig(
  this: DBRepository
): Promise<Realm.Configuration> {
  const syncPassword = await keytar.getPassword("paperlib", "realmSync");
  if (
    this.preference.get("useSync") &&
    this.preference.get("syncEmail") !== "" &&
    syncPassword
  ) {
    return await this.getCloudConfig();
  } else {
    this.cloudConfig = null;
    return await this.getLocalConfig();
  }
}

export async function getLocalConfig(
  this: DBRepository
): Promise<Realm.Configuration> {
  await this.logoutCloud();

  if (!existsSync(this.preference.get("appLibFolder") as string)) {
    await fsPromise.mkdir(this.preference.get("appLibFolder") as string, {
      recursive: true,
    });
  }

  const config = {
    schema: [
      PaperEntitySchema,
      PaperTagSchema,
      PaperFolderSchema,
      FeedSchema,
      FeedEntitySchema,
    ],
    schemaVersion: this._schemaVersion,
    path: path.join(
      this.preference.get("appLibFolder") as string,
      "default.realm"
    ),
    migration: migrate,
  };
  this.localConfig = config;
  return config;
}

export async function getCloudConfig(
  this: DBRepository
): Promise<Realm.Configuration> {
  const cloudUser = await this.loginCloud();

  if (cloudUser) {
    const config = {
      schema: [
        PaperEntitySchema,
        PaperTagSchema,
        PaperFolderSchema,
        FeedSchema,
        FeedEntitySchema,
      ],
      schemaVersion: this._schemaVersion,
      sync: {
        user: cloudUser,
        partitionValue: cloudUser.id,
      },
      path: path.join(
        this.sharedState.dbState.defaultPath.value as string,
        "synced.realm"
      ),
    };
    this.cloudConfig = config;
    return config;
  } else {
    this.preference.set("useSync", false);
    this.sharedState.set("viewState.preferenceUpdated", Date.now());
    return this.getLocalConfig();
  }
}

export async function loginCloud(
  this: DBRepository
): Promise<Realm.User | null> {
  if (!this.app) {
    process.chdir(this.sharedState.dbState.defaultPath.value as string);

    const id = this.preference.get("syncAPPID") as string;
    this.app = new Realm.App({
      id: id,
    });
  }

  const checkInternetConnected = require("check-internet-connected");
  if (
    !(await checkInternetConnected({
      domain: "https://httpbin.org/get",
    }))
  ) {
    console.log("No internet!");
    return this.app.currentUser;
  }

  try {
    const syncPassword = await keytar.getPassword("paperlib", "realmSync");
    const credentials = Realm.Credentials.emailPassword(
      this.preference.get("syncEmail") as string,
      syncPassword as string
    );

    const loginedUser = await this.app.logIn(credentials);
    this.sharedState.set(
      "viewState.processInformation",
      "Successfully logged in! Data is syncing..."
    );
    this.app.switchUser(loginedUser);
    return this.app.currentUser;
  } catch (error) {
    this.preference.set("useSync", false);
    this.sharedState.set("viewState.preferenceUpdated", Date.now());
    this.sharedState.set(
      "viewState.alertInformation",
      `Login failed, ${error as string}`
    );
    return null;
  }
}

export async function logoutCloud(this: DBRepository) {
  if (this.app) {
    // @ts-ignore
    for (const [_, user] of Object.entries(this.app.allUsers)) {
      await this.app.removeUser(user);
    }
  }
  const syncDBPath = path.join(
    this.sharedState.dbState.defaultPath.value as string,
    "synced.realm"
  );

  if (existsSync(syncDBPath)) {
    await fsPromise.unlink(
      path.join(
        this.sharedState.dbState.defaultPath.value as string,
        "synced.realm"
      )
    );
  }
}

export function pauseSync(this: DBRepository) {
  if (this.syncSession) {
    this.syncSession.pause();
  }
}

export function resumeSync(this: DBRepository) {
  if (this.syncSession) {
    this.syncSession.resume();
  }
}
