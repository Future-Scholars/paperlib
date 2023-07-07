import { ObjectId } from "bson";
import Realm, { Results } from "realm";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";

export interface IFeedEntityRepositoryState {
  count: number;
  updated: number;
}

export const IFeedEntityRepository = createDecorator("feedEntityRepository");

export class FeedEntityRepository extends Eventable<IFeedEntityRepositoryState> {
  constructor() {
    super("feedEntityRepository", {
      count: 0,
      updated: 0,
    });
  }

  /**
   * Load all filtered feed entities.
   * @param realm - Realm instance.
   * @param filter - Filter string.
   * @param sortBy - Sort by field.
   * @param sortOrder - Sort order.
   * @returns - Results of feed entities.
   */
  load(
    realm: Realm,
    filter: string,
    sortBy: string,
    sortOrder: "asce" | "desc"
  ) {
    let objects = realm.objects<FeedEntity>("FeedEntity");

    this.fire({ count: objects.length });

    if (!realm.feedEntityListened) {
      objects.addListener((objs, changes) => {
        const deletionCount = changes.deletions.length;
        const insertionCount = changes.insertions.length;
        const modificationCount =
          changes.newModifications.length + changes.oldModifications.length;

        if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
          this.fire("updated");
        }
      });
      realm.feedEntityListened = true;
    }

    if (filter) {
      try {
        return objects.filtered(filter).sorted(sortBy, sortOrder == "desc");
      } catch (error) {
        throw new Error(`Invalid filter: ${filter}`);
      }
    } else {
      return objects.sorted(sortBy, sortOrder == "desc");
    }
  }

  /**
   * Load feed entity by id.
   * @param realm - Realm instance.
   * @param ids - Paper ids.
   * @returns - Results of feed entities.
   */
  loadByIds(realm: Realm, ids: (ObjectId | string)[]) {
    const idsQuery = ids
      .map((id) => `_id == oid(${id as string})`)
      .join(" OR ");

    let objects = realm
      .objects<FeedEntity>("FeedEntity")
      .filtered(`(${idsQuery})`);

    return objects;
  }

  /**
   * Update feed entity.
   * @param realm - Realm instance.
   * @param feedEntity - Feed entity.
   * @param feed - Feed.
   * @param existingFeedEntity - Existing feed entity.
   * @param ignoreReadState - Ignore read state.
   * @param partition - Partition.
   * @returns "updated" | "created"
   */
  update(
    realm: Realm,
    feedEntity: FeedEntity,
    feed: Feed,
    existingFeedEntity: FeedEntity | null,
    ignoreReadState: boolean,
    partition: string
  ) {
    return realm.safeWrite(() => {
      if (existingFeedEntity) {
        // Update
        const updateObj = existingFeedEntity;
        updateObj.feedTime = feedEntity.feedTime;
        updateObj.title = feedEntity.title;
        updateObj.authors = feedEntity.authors;
        updateObj.abstract = feedEntity.abstract;
        updateObj.publication = feedEntity.publication;
        updateObj.pubTime = feedEntity.pubTime;
        updateObj.pubType = feedEntity.pubType;
        updateObj.doi = feedEntity.doi;
        updateObj.arxiv = feedEntity.arxiv;
        updateObj.mainURL = feedEntity.mainURL;
        updateObj.pages = feedEntity.pages;
        updateObj.volume = feedEntity.volume;
        updateObj.number = feedEntity.number;
        updateObj.publisher = feedEntity.publisher;
        if (!ignoreReadState) {
          updateObj.read = feedEntity.read;
        }
        updateObj.feed = feed;

        return "updated";
      } else {
        // Add
        const reduplicatedFeedEntities = realm
          .objects<FeedEntity>("FeedEntity")
          .filtered(
            "title == $0 and authors == $1",
            feedEntity.title,
            feedEntity.authors
          );
        if (reduplicatedFeedEntities.length === 0) {
          feedEntity.feed = feed;
          if (partition) {
            feedEntity._partition = partition;
          }
          realm.create("FeedEntity", feedEntity);

          return "created";
        } else {
          const updateObj = reduplicatedFeedEntities[0];
          updateObj.feedTime = feedEntity.feedTime;
          updateObj.title = feedEntity.title;
          updateObj.authors = feedEntity.authors;
          updateObj.abstract = feedEntity.abstract;
          updateObj.publication = feedEntity.publication;
          updateObj.pubTime = feedEntity.pubTime;
          updateObj.pubType = feedEntity.pubType;
          updateObj.doi = feedEntity.doi;
          updateObj.arxiv = feedEntity.arxiv;
          updateObj.mainURL = feedEntity.mainURL;
          updateObj.pages = feedEntity.pages;
          updateObj.volume = feedEntity.volume;
          updateObj.number = feedEntity.number;
          updateObj.publisher = feedEntity.publisher;
          if (!ignoreReadState) {
            updateObj.read = feedEntity.read;
          }
          updateObj.feed = feed;

          return "updated";
        }
      }
    });
  }

  /**
   * Delete outdate feed entities.
   * @param realm - Realm instance.
   * @returns - Feed count.
   */
  deleteOutdate(realm: Realm) {
    const readObjects = realm
      .objects<FeedEntity>("FeedEntity")
      .filtered(
        "(addTime < $0) AND (read == true)",
        new Date(Date.now() - 86400000 * 3)
      );
    const unreadObjects = realm
      .objects<FeedEntity>("FeedEntity")
      .filtered(
        "(addTime < $0) AND (read == false)",
        new Date(Date.now() - 86400000 * 30)
      );

    const feedCount: Record<string, number> = {};

    readObjects.forEach((obj) => {
      if (feedCount[obj.feed.name]) {
        feedCount[obj.feed.name] += 1;
      } else {
        feedCount[obj.feed.name] = 1;
      }
    });
    unreadObjects.forEach((obj) => {
      if (feedCount[obj.feed.name]) {
        feedCount[obj.feed.name] += 1;
      } else {
        feedCount[obj.feed.name] = 1;
      }
    });

    return realm.safeWrite(() => {
      realm.delete(readObjects);
      realm.delete(unreadObjects);
      return feedCount;
    });
  }

  /**
   * Delete feed entities.
   * @param realm - Realm instance.
   * @param ids - Paper ids.
   * @param feedEntity - Feed entity.
   * @returns - True if success.
   */
  delete(realm: Realm, ids?: (ObjectId | string)[], feedEntity?: FeedEntity) {
    return realm.safeWrite(() => {
      if (feedEntity) {
        realm.delete(feedEntity);
      } else if (ids) {
        realm.delete(
          realm.objects<FeedEntity>("FeedEntity").filtered("_id IN $0", ids)
        );
        return true;
      } else {
        throw new Error("Either ids or feedEntity must be specified.");
      }
    });
  }

  // ==============================
  // Dev Functions
  // ==============================
  removeAll(realm: Realm) {
    const objects = realm.objects<FeedEntity>("FeedEntity");
    realm.safeWrite(() => {
      realm.delete(objects);
    });
  }

  addDummyData(feed: Feed, realm: Realm) {
    const ids: Array<string | ObjectId> = [];
    realm.safeWrite(() => {
      for (let i = 0; i < 100; i++) {
        const entity = new FeedEntity(true);
        entity.dummyFill();
        entity.feed = feed;
        realm.create("FeedEntity", entity, Realm.UpdateMode.Modified);
      }
    });
  }
}

export type IFeedEntityResults =
  | Results<FeedEntity & Realm.Object>
  | Array<FeedEntity>;
