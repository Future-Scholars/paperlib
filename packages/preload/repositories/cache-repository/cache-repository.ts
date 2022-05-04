import Realm from "realm";

import { Preference } from "../../utils/preference";
import { SharedState } from "../../utils/appstate";

import { getConfig, initCache } from "./cache-init";
import { update, getPDFText, fullTextFilter, remove } from "./cache-crud";

export class CacheRepository {
  sharedState: SharedState;
  preference: Preference;

  _realm: Realm | null;
  _schemaVersion: number;

  app: Realm.App | null;
  config: Realm.Configuration | null;

  entitiesListenerInited: boolean;
  categorizersListenerInited: Record<string, boolean>;

  constructor(sharedState: SharedState, preference: Preference) {
    this.sharedState = sharedState;
    this.preference = preference;

    this._realm = null;
    this._schemaVersion = 1;

    this.app = null;
    this.config = null;

    this.entitiesListenerInited = false;
    this.categorizersListenerInited = {
      PaperTag: false,
      PaperFolder: false,
    };
  }

  cache(): Realm {
    if (!this._realm) {
      this.initCache(true);
    }
    return this._realm as Realm;
  }

  // Initialize Func
  initCache = initCache;
  getConfig = getConfig;

  // CRUD Func
  update = update;
  getPDFText = getPDFText;
  fullTextFilter = fullTextFilter;
  remove = remove;
}
