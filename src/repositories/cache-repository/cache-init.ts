import Realm from 'realm';
import path from 'path';

import { PaperEntityCacheSchema } from '../../models/PaperEntityCache';
import { CacheRepository } from './cache-repository';

export function initCache(this: CacheRepository, reinit = false) {
  if (this._realm || reinit) {
    if (this._realm) {
      this._realm.close();
    }
    this._realm = null;
    this.app = null;
    this.config = null;
  }

  this.getConfig();
  try {
    this._realm = new Realm(this.config as Realm.Configuration);
  } catch (err) {
    this.sharedState.set(
      'viewState.alertInformation',
      `Open cache database faild: ${err as string}`
    );
  }
}

export function getConfig(this: CacheRepository): Realm.Configuration {
  const config = {
    schema: [PaperEntityCacheSchema],
    schemaVersion: this._schemaVersion,
    path: path.join(
      this.sharedState.dbState.defaultPath.value as string,
      'cache.realm'
    ),
  };
  this.config = config;
  return config;
}
