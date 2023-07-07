import { ObjectId } from "bson";
import Realm, { Results } from "realm";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Colors } from "@/models/categorizer";
import { Feed } from "@/models/feed";

export interface IFeedRepositoryState {
  updated: number;
}

export const IFeedRepository = createDecorator("feedRepository");

export class FeedRepository extends Eventable<IFeedRepositoryState> {
  constructor() {
    super("feedRepository", {
      updated: 0,
    });
  }

  /**
   * Load all feeds.
   * @param realm - Realm instance
   * @param sortBy - Sort by field
   * @param sortOrder - Sort order
   * @returns Results of feed
   */
  load(realm: Realm, sortBy: string, sortOrder: string) {
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
    return objects;
  }

  /**
   * Load feed by id.
   * @param realm - Realm instance
   * @param id - Feed id
   * @returns Feed
   */
  loadByIds(realm: Realm, ids: (ObjectId | string)[]) {
    const idsQuery = ids
      .map((id) => `_id == oid(${id as string})`)
      .join(" OR ");

    let objects = realm.objects<Feed>("Feed").filtered(`(${idsQuery})`);

    return objects;
  }

  /**
   * Delete feed.
   * @param realm - Realm instance
   * @param deleteAll - Delete all feed
   * @param feed - Feed
   * @param name - Feed name
   */
  delete(realm: Realm, deleteAll = true, feed?: Feed, name?: string) {
    return realm.safeWrite(() => {
      let objects: IFeedResults;
      if (feed) {
        objects = realm
          .objects<Feed>("Feed")
          .filtered(`name == "${feed.name}"`);
      } else if (name) {
        objects = realm.objects<Feed>("Feed").filtered(`name == "${name}"`);
      } else {
        throw new Error(`Invalid arguments: ${feed}, ${name}`);
      }

      if (deleteAll) {
        realm.delete(objects);
      } else {
        for (const object of objects) {
          object.count -= 1;
          if (object.count <= 0) {
            realm.delete(object);
          }
        }
      }
      return true;
    });
  }

  /**
   * Colorize feed.
   * @param realm - Realm instance
   * @param color - Color
   * @param feed - Feed
   * @param name - Feed name
   */
  colorize(realm: Realm, color: Colors, feed?: Feed, name?: string) {
    realm.safeWrite(() => {
      let objects: IFeedResults;
      if (feed) {
        objects = realm
          .objects<Feed>("Feed")
          .filtered(`name == "${feed.name}"`);
      } else if (name) {
        objects = realm.objects<Feed>("Feed").filtered(`name == "${name}"`);
      } else {
        throw new Error(`Invalid arguments: ${feed}, ${name}`);
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
   * Update feed.
   * @param realm - Realm instance
   * @param existFeed - Exist feed
   * @param updateFeed - Update feed
   * @param partition - Partition
   * @returns Feed
   */
  update(
    realm: Realm,
    existFeed: Feed | null,
    updateFeed: Feed | null,
    partition: string
  ) {
    // exist = null, undate != null, means create (or link once).
    // exist != null, update != null, means update.
    // exist != null, update = null, means delete (or unlink once).
    return realm.safeWrite(() => {
      let newFeed: Feed;
      const existName = existFeed?.name;
      const updateName = updateFeed?.name;

      if (!existName && updateName) {
        const objects = realm
          .objects<Feed>("Feed")
          .filtered(`name == "${updateName}"`);
        if (objects.length > 0) {
          // Link
          const object = objects[0];
          object.count += 1;
          newFeed = objects[0];
        } else {
          // Create
          const toBeCreatedObject = new Feed(true).initialize(updateFeed);
          if (partition) {
            toBeCreatedObject._partition = partition;
          }
          newFeed = realm.create<Feed>("Feed", toBeCreatedObject);
        }
      } else if (existName && updateName) {
        // Update
        const objects = realm
          .objects<Feed>("Feed")
          .filtered(`name == "${existName}"`);
        if (objects.length > 0) {
          const object = objects[0];
          object.name = updateName;
          object.color = updateFeed?.color;
          object.count = updateFeed?.count;
          if (partition) {
            object._partition = partition;
          }
          newFeed = objects[0];
        } else {
          throw new Error(`No feed found: ${existName}`);
        }
      } else if (existName && !updateName) {
        // Delete
        const objects = realm
          .objects<Feed>("Feed")
          .filtered(`name == "${existName}"`);
        if (objects.length > 0) {
          const object = objects[0];
          object.count -= 1;
          if (object.count <= 0) {
            object.count = 0;
          }
          newFeed = objects[0];
        } else {
          throw new Error(`No feed found: ${existName}`);
        }
      } else {
        throw new Error(`Invalid arguments: ${existFeed}, ${updateFeed}`);
      }
      return newFeed;
    });
  }

  // ========================
  // Dev Functions
  // ========================
  async addDummyData(realm: Realm) {
    const feed = new Feed(true);
    feed.name = "object-detection";
    feed.url =
      "http://export.arxiv.org/api/query?search_query=(ti:%22object%20detection%22+OR+abs:%22object%20detection%22)+AND+cat:%22cs.CV%22&amp;sortBy=lastUpdatedDate&amp;sortOrder=descending";
    feed.count = 1;
    realm.write(() => {
      realm.create("Feed", feed);
    });

    return feed;
  }

  async deleteAll(realm: Realm) {
    realm.write(() => {
      const feeds = realm.objects<Feed>("Feed");
      realm.delete(feeds);
    });
  }
}

export type IFeedResults = Results<Feed & Realm.Object> | Array<Feed>;
