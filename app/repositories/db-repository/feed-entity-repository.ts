import Realm, { List, Results } from "realm";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { FeedEntity } from "@/models/feed-entity";
import { OID } from "@/models/id";
import {
  FeedRepository,
  IFeedRealmObject,
  IFeedRepository,
} from "./feed-repository";

export interface IFeedEntityRepositoryState {
  count: number;
  updated: number;
}

export const IFeedEntityRepository = createDecorator("feedEntityRepository");

export class FeedEntityRepository extends Eventable<IFeedEntityRepositoryState> {
  constructor(
    @IFeedRepository private readonly _feedRepository: FeedRepository
  ) {
    super("feedEntityRepository", {
      count: 0,
      updated: 0,
    });
  }

  /**
   * Transform feed entity to realm object if exists in database. Otherwise, return undefined.
   * @param realm - Realm instance
   * @param feedEntity - FeedEntity
   * @returns Realm object
   */
  toRealmObject(realm: Realm, feedEntity: IFeedEntityObject) {
    if (feedEntity instanceof Realm.Object) {
      return feedEntity as IFeedEntityRealmObject;
    } else {
      const objects = this.loadByIds(realm, [feedEntity._id]);

      if (objects.length > 0) {
        return objects[0] as IFeedEntityRealmObject;
      } else {
        const reduplicatedObjects = realm
          .objects<FeedEntity>("FeedEntity")
          .filtered(
            "title == $0 and authors == $1",
            feedEntity.title,
            feedEntity.authors
          );
        if (reduplicatedObjects.length > 0) {
          return reduplicatedObjects[0] as IFeedEntityRealmObject;
        } else {
          return undefined;
        }
      }
    }
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
    filterPlaceholders: any[],
    sortBy: string,
    sortOrder: "asce" | "desc"
  ): IFeedEntityCollection {
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
        return objects
          .filtered(filter, ...filterPlaceholders)
          .sorted(sortBy, sortOrder == "desc");
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
  loadByIds(realm: Realm, ids: OID[]): IFeedEntityCollection {
    const idsQuery = ids.map((id) => `oid(${id})`).join(", ");

    let objects = realm
      .objects<FeedEntity>("FeedEntity")
      .filtered(`_id IN { ${idsQuery} }`);

    return objects;
  }

  /**
   * Update feed entity.
   * @param realm - Realm instance.
   * @param feedEntity - Feed entity.
   * @param ignoreReadState - Ignore read state.
   * @param partition - Partition.
   * @returns FeedEntity
   */
  update(
    realm: Realm,
    feedEntity: FeedEntity,
    partition: string,
    ignoreReadState: boolean
  ) {
    return realm.safeWrite(() => {
      let feed = this._feedRepository.toRealmObject(realm, feedEntity.feed);
      if (!feed) {
        feed = this._feedRepository.update(
          realm,
          feedEntity.feed,
          partition
        ) as IFeedRealmObject;
      } else {
        feed = feed!;
      }

      const object = this.toRealmObject(realm, feedEntity);

      if (object) {
        // Update
        object.feedTime = feedEntity.feedTime;
        object.title = feedEntity.title;
        object.authors = feedEntity.authors;
        object.abstract = feedEntity.abstract;
        object.publication = feedEntity.publication;
        object.pubTime = feedEntity.pubTime;
        object.pubType = feedEntity.pubType;
        object.doi = feedEntity.doi;
        object.arxiv = feedEntity.arxiv;
        object.mainURL = feedEntity.mainURL;
        object.pages = feedEntity.pages;
        object.volume = feedEntity.volume;
        object.number = feedEntity.number;
        object.publisher = feedEntity.publisher;
        object.feed = feed;
        if (!ignoreReadState) {
          object.read = feedEntity.read;
        }

        if (partition) {
          object._partition = partition;
        }

        this._feedRepository.updateCount(realm, [feed]);

        return object;
      } else {
        // Insert
        if (partition) {
          feedEntity._partition = partition;
        }
        feedEntity.feed = feed;
        const newObject = realm.create<FeedEntity>("FeedEntity", feedEntity);

        return newObject;
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
  delete(realm: Realm, ids?: OID[], feedEntities?: IFeedEntityCollection) {
    return realm.safeWrite(() => {
      let objects: IFeedEntityCollection;

      if (feedEntities) {
        objects = feedEntities
          .map((feedEntity: IFeedEntityObject) =>
            this.toRealmObject(realm, feedEntity)
          )
          .filter((obj) => obj) as IFeedEntityCollection;
      } else if (ids) {
        objects = this.loadByIds(realm, ids);
      } else {
        throw new Error("Either ids or feedEntity must be specified.");
      }

      realm.delete(objects);

      return true;
    });
  }
}

export type IFeedEntityRealmObject = FeedEntity &
  Realm.Object<
    FeedEntity,
    | "_id"
    | "addTime"
    | "feed"
    | "feedTime"
    | "title"
    | "abstract"
    | "authors"
    | "publication"
    | "pubTime"
    | "pubType"
    | "doi"
    | "arxiv"
    | "mainURL"
    | "pages"
    | "volume"
    | "number"
    | "publisher"
    | "read"
  >;

export type IFeedEntityObject = FeedEntity | IFeedEntityRealmObject;

export type IFeedEntityCollection =
  | Results<IFeedEntityObject>
  | List<IFeedEntityObject>
  | Array<IFeedEntityObject>;
