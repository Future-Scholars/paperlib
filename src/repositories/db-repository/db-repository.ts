import Realm from 'realm';

import { Preference } from 'src/utils/preference';
import { SharedState } from 'src/interactors/app-state';

import {
  getCloudConfig,
  getConfig,
  getLocalConfig,
  initRealm,
  loginCloud,
  logoutCloud,
  pauseSync,
  resumeSync,
} from './db-init';
import {
  categorizers,
  createFilterPattern,
  deleteCategorizers,
  entities,
  entitiesByIds,
  linkCategorizers,
  preprintEntities,
  remove,
  unlinkCategorizers,
  update,
} from './db-crud';
import { migrateLocaltoCloud } from './db-migration';

export class DBRepository {
  preference: Preference;
  sharedState: SharedState;

  _realm: Realm | null;
  _schemaVersion: number;

  app: Realm.App | null;
  cloudConfig: Realm.Configuration | null;
  localConfig: Realm.Configuration | null;

  syncSession: Realm.App.Sync.Session | null = null;

  entitiesListenerInited: boolean;
  categorizersListenerInited: Record<string, boolean>;

  constructor(preference: Preference, sharedState: SharedState) {
    this.preference = preference;
    this.sharedState = sharedState;

    this._realm = null;
    this._schemaVersion = 6;

    this.app = null;
    this.cloudConfig = null;
    this.localConfig = null;

    this.entitiesListenerInited = false;
    this.categorizersListenerInited = {
      PaperTag: false,
      PaperFolder: false,
    };
  }

  async realm(): Promise<Realm> {
    if (!this._realm) {
      await this.initRealm(true);
    }
    return this._realm as Realm;
  }

  // Initialize Func
  initRealm = initRealm;
  getConfig = getConfig;
  getLocalConfig = getLocalConfig;
  getCloudConfig = getCloudConfig;
  loginCloud = loginCloud;
  logoutCloud = logoutCloud;
  migrateLocaltoCloud = migrateLocaltoCloud;
  pauseSync = pauseSync;
  resumeSync = resumeSync;

  // CRUD Func
  entitiesByIds = entitiesByIds;
  createFilterPattern = createFilterPattern;
  entities = entities;
  categorizers = categorizers;
  preprintEntities = preprintEntities;
  remove = remove;
  deleteCategorizers = deleteCategorizers;
  unlinkCategorizers = unlinkCategorizers;
  linkCategorizers = linkCategorizers;
  update = update;
}
