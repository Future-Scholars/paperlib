import Realm from 'realm';
import path from 'path';
import { promises as fsPromise } from 'fs';
import keytar from 'keytar';

import { PaperEntitySchema } from '../../models/PaperEntity';
import {
  PaperFolderSchema,
  PaperTagSchema,
} from '../../models/PaperCategorizer';
import { migrate } from './db-migration';
import { DBRepository } from './db-repository';

export async function initRealm(this: DBRepository, reinit = false) {
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
  }

  if (this._realm) {
    return;
  }
  await this.getConfig();
  if (this.cloudConfig) {
    try {
      this._realm = new Realm(this.cloudConfig);
      this.syncSession = this._realm.syncSession;
    } catch (err) {
      this.sharedState.set(
        'viewState.alertInformation',
        `Open cloud database faild: ${err as string}`
      );
    }
  } else {
    try {
      this._realm = new Realm(this.localConfig as Realm.Configuration);
    } catch (err) {
      this.sharedState.set(
        'viewState.alertInformation',
        `Open cloud database faild: ${err as string}`
      );
    }
  }
}

export async function getConfig(
  this: DBRepository
): Promise<Realm.Configuration> {
  const syncPassword = await keytar.getPassword('paperlib', 'realmSync');
  if (
    this.preference.get('useSync') &&
    this.preference.get('syncEmail') !== '' &&
    syncPassword
  ) {
    return await this.getCloudConfig();
  } else {
    this.cloudConfig = null;
    return this.getLocalConfig();
  }
}

export function getLocalConfig(this: DBRepository): Realm.Configuration {
  const config = {
    schema: [PaperEntitySchema, PaperTagSchema, PaperFolderSchema],
    schemaVersion: this._schemaVersion,
    path: path.join(
      this.preference.get('appLibFolder') as string,
      'default.realm'
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
      schema: [PaperEntitySchema, PaperTagSchema, PaperFolderSchema],
      schemaVersion: this._schemaVersion,
      sync: {
        user: cloudUser,
        partitionValue: cloudUser.id,
      },
      path: path.join(
        this.sharedState.dbState.defaultPath.value as string,
        'synced.realm'
      ),
    };
    this.cloudConfig = config;
    return config;
  } else {
    this.preference.set('useSync', false);
    this.sharedState.set('viewState.preferenceUpdated', new Date().getTime());
    return this.getLocalConfig();
  }
}

export async function loginCloud(
  this: DBRepository
): Promise<Realm.User | null> {
  if (!this.app) {
    process.chdir(this.sharedState.dbState.defaultPath.value as string);

    let id;
    if (this.preference.get('syncCloudBackend') === 'official') {
      id = 'paperlib-iadbj';
    } else {
      id = this.preference.get('syncAPPID') as string;
    }
    this.app = new Realm.App({
      id: id,
    });
  }

  try {
    const syncPassword = await keytar.getPassword('paperlib', 'realmSync');
    const credentials = Realm.Credentials.emailPassword(
      this.preference.get('syncEmail') as string,
      syncPassword as string
    );

    const loginedUser = await this.app.logIn(credentials);
    this.sharedState.set(
      'viewState.alertInformation',
      'Successfully logged in!'
    );
    this.app.switchUser(loginedUser);
    return this.app.currentUser;
  } catch (error) {
    this.preference.set('useSync', false);
    this.sharedState.set('viewState.preferenceUpdated', new Date().getTime());
    this.sharedState.set(
      'viewState.alertInformation',
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

  await fsPromise.unlink(
    path.join(
      this.sharedState.dbState.defaultPath.value as string,
      'synced.realm'
    )
  );

  await this.initRealm(true);
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
