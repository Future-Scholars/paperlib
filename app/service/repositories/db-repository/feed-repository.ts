import Realm, { List, Results } from "realm";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Colors } from "@/models/categorizer";
import { Feed, IFeedCollection, IFeedObject, IFeedRealmObject } from "@/models/feed";
import { OID } from "@/models/id";
import { ObjectId } from "bson";
import { toSqliteFeed, deleteSqliteFeed } from "@/service/services/sync/pollyfills/feed";
import { ILogService, LogService } from "@/common/services/log-service";
export interface IFeedRepositoryState {
  updated: number;
}

export const IFeedRepository = createDecorator("feedRepository");

export class FeedRepository extends Eventable<IFeedRepositoryState> {
  constructor(
    @ILogService
    private readonly _logService: LogService,
  ) {
    super("feedRepository", {
      updated: 0,
    });
  }

  /**
   * Transform feed to realm object if exists in database. Otherwise, return undefined.
   * @param realm - Realm instance
   * @param feed - Feed
   * @returns Realm object
   */
  toRealmObject(realm: Realm, feed: IFeedObject) {
    if (feed instanceof Realm.Object) {
      return feed as IFeedRealmObject;
    } else {
      const objects = realm
        .objects<Feed>("Feed")
        .filtered(`name == "${feed.name}"`);

      if (objects.length > 0) {
        return objects[0] as IFeedRealmObject;
      } else {
        return undefined;
      }
    }
  }

  /**
   * Load all feeds.
   * @param realm - Realm instance
   * @param sortBy - Sort by field
   * @param sortOrder - Sort order
   * @returns Results of feed
   */
  async load(realm: Realm, sortBy: string, sortOrder: string): Promise<IFeedCollection> {
    const objects = realm
      .objects<Feed>("Feed")
      .sorted(sortBy, sortOrder == "desc");

    if (!realm.feedListened) {
      objects.addListener((objs, changes) => {
        const deletionCount = changes.deletions.length;
        const insertionCount = changes.insertions.length;
        const modificationCount =
          changes.newModifications.length + changes.oldModifications.length;

        if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
          this.fire("updated");
        }
      });
      realm.feedListened = true;
    }
    // objects.forEach(async (object) => {
    //   await toSqliteFeed(object);
    // });
    for (const object of objects) {
      await toSqliteFeed(object);
    }
    return objects;
  }

  /**
   * Load feed by id.
   * @param realm - Realm instance
   * @param ids - Feed ids
   * @returns Feed
   */
  loadByIds(realm: Realm, ids: OID[]): IFeedCollection {
    const idsQuery = ids.map((id) => `oid(${id})`).join(", ");

    let objects = realm
      .objects<Feed>("Feed")
      .filtered(`_id IN { ${idsQuery} }`);

    return objects;
  }

  /**
   * Delete feed.
   * @param realm - Realm instance
   * @param ids - Feed ids
   * @param feeds - Feeds
   */
  async delete(realm: Realm, ids?: OID[], feeds?: IFeedCollection) {
    if (ids) {
      await Promise.all(ids.map(async (id) => {
        this._logService.info("Deleting sqlite feed by id", id.toString(), false, "Feed");
        await deleteSqliteFeed(id.toString());
      }));
    }
    return realm.safeWrite(() => {
      let objects: IFeedCollection;
      if (feeds) {
        objects = feeds
          .map((feed: IFeedObject) => this.toRealmObject(realm, feed))
          .filter((feed) => feed) as IFeedCollection;
      } else if (ids) {
        objects = this.loadByIds(realm, ids);
      } else {
        throw new Error(`Invalid arguments: ${feeds}, ${ids}`);
      }

      realm.delete(objects);



      return true;
    });
  }

  /**
   * Colorize feed.
   * @param realm - Realm instance
   * @param color - Color
   * @param id - Feed Id
   * @param feed - Feed
   */
  colorize(realm: Realm, color: Colors, id?: OID, feed?: Feed) {
    realm.safeWrite(() => {
      let objects: IFeedCollection;
      if (feed) {
        objects = [feed];
      } else if (id) {
        objects = this.loadByIds(realm, [id]);
      } else {
        throw new Error(`Invalid arguments: ${feed}, ${id}`);
      }
      for (const object of objects) {
        object.color = color;
      }
    });
  }

  /**
   * Rename feed.
   * @param realm - Realm instance
   * @param oldName - Old name
   * @param newName - New name
   */
  rename(realm: Realm, oldName: string, newName: string) {
    realm.safeWrite(() => {
      const objects = realm
        .objects<Feed>("Feed")
        .filtered(`name == "${oldName}"`);
      for (const object of objects) {
        object.name = newName;
      }
    });
  }

  /**
   * Make sure all properties of feed.
   * @param feed - Feed
   * @returns Feed
   */
  makeSureProperties(feed: IFeedObject) {
    if (!feed._id && !feed.id) {
      feed._id = new ObjectId();
      feed.id = feed._id;
    } else {
      feed._id = new ObjectId(feed._id || feed.id);
      feed.id = new ObjectId(feed.id || feed._id);
    }

    feed._partition = feed._partition || "";
    feed.name = feed.name || "";
    feed.color = feed.color || Colors.blue;
    feed.count = feed.count || 0;
    feed.url = feed.url || "";

    return feed;
  }

  /**
   * Update feed.
   * @param realm - Realm instance
   * @param feed - Feed
   * @param partition - Partition
   * @param fromSync - True if this update is called by sync client. 
   * @returns Feed
   */
  async update(realm: Realm, feed: IFeedObject, partition: string, fromSync: boolean = false) {
    feed = this.makeSureProperties(feed);
    if (!fromSync) {
      await toSqliteFeed(feed);
    }
    return realm.safeWrite(() => {
      const object = this.toRealmObject(realm, feed);

      if (object) {
        // Update
        object.name = feed.name;
        object.url = feed.url;
        object.color = feed.color;
        object.count = feed.count;
        if (partition) {
          object._partition = partition;
        }

        return object;
      } else {
        if (partition) {
          feed._partition = partition;
        }
        const newObject = realm.create<Feed>("Feed", feed);
        return newObject;
      }
    });
  }

  updateCount(realm: Realm, feeds: IFeedCollection) {
    return realm.safeWrite(() => {
      const feedRealmObjects = feeds.map((feed) => {
        return this.toRealmObject(realm, feed);
      }) as IFeedRealmObject[];

      for (const feed of feedRealmObjects) {
        feed.count = feed.linkingObjectsCount();
      }
    });
  }
}
