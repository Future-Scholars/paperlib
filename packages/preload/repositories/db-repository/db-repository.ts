import Realm from "realm";

import { Preference } from "../../utils/preference";
import { SharedState } from "../../utils/appstate";

import {
  getCloudConfig,
  getConfig,
  getLocalConfig,
  initRealm,
  loginCloud,
  logoutCloud,
  pauseSync,
  resumeSync,
} from "./db-init";
import {
  categorizers,
  createFilterPattern,
  deleteCategorizers,
  entities,
  entitiesByIds,
  preprintEntities,
  remove,
  updateCategorizers,
  update,
} from "./db-crud";
import { migrateLocaltoCloud } from "./db-migration";

export class DBRepository {
  sharedState: SharedState;
  preference: Preference;

  _realm: Realm | null;
  _schemaVersion: number;

  app: Realm.App | null;
  cloudConfig: Realm.Configuration | null;
  localConfig: Realm.Configuration | null;

  syncSession: Realm.App.Sync.Session | null = null;

  entitiesListenerInited: boolean;
  categorizersListenerInited: Record<string, boolean>;

  constructor(sharedState: SharedState, preference: Preference) {
    this.sharedState = sharedState;
    this.preference = preference;

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
  updateCategorizers = updateCategorizers;
  update = update;
}
