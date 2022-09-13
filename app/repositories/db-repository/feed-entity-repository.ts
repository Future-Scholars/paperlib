import { ObjectId } from "bson";
import Realm, { PrimaryKey, Results } from "realm";

import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { formatString } from "@/utils/string";

export class FeedEntityRepository {
  stateStore: MainRendererStateStore;
  listened: boolean;

  constructor(stateStore: MainRendererStateStore) {
    this.stateStore = stateStore;
    this.listened = false;
  }

  removeListeners() {
    this.listened = false;
  }

  createFilterPattern(
    search: string | null,
    name: string | null,
    unread: boolean
  ): string {
    let filterFormat = "";

    const formatedSearch = formatString({
      str: search,
      removeNewline: true,
      trimWhite: true,
    });

    if (search) {
      if (this.stateStore.viewState.searchMode === "general") {
        filterFormat += `(title contains[c] \"${formatedSearch}\" OR authors contains[c] \"${formatedSearch}\" OR publication contains[c] \"${formatedSearch}\" OR abstract contains[c] \"${formatedSearch}\") AND `;
      } else if (this.stateStore.viewState.searchMode === "advanced") {
        filterFormat += `(${formatedSearch}) AND `;
      }
    }
    if (name) {
      filterFormat += `(feed.name == \"${name}\") AND `;
    }
    if (unread) {
      filterFormat += `(read == false) AND `;
    }
    if (filterFormat.length > 0) {
      filterFormat = filterFormat.slice(0, -5);
    }

    return filterFormat;
  }

  // ========================
  // Read
  // ========================
  load(
    realm: Realm,
    search: string,
    name: string,
    unread: boolean,
    sortBy: string,
    sortOrder: string
  ) {
    const filterPattern = this.createFilterPattern(search, name, unread);

    let objects = realm
      .objects<FeedEntity>("FeedEntity")
      .sorted(sortBy, sortOrder == "desc");
    this.stateStore.viewState.feedEntitiesCount = objects.length;

    if (!this.listened) {
      objects.addListener((objs, changes) => {
        const deletionCount = changes.deletions.length;
        const insertionCount = changes.insertions.length;
        const modificationCount =
          changes.newModifications.length + changes.oldModifications.length;

        if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
          this.stateStore.dbState.feedEntitiesUpdated = Date.now();
        }
      });
      this.listened = true;
    }

    if (filterPattern) {
      try {
        objects = objects.filtered(filterPattern);
      } catch (error) {
        console.error(error);
        this.stateStore.logState.alertLog = `Filter pattern is invalid: ${
          error as string
        }`;
      }
    }

    return objects;
  }

  loadByIds(realm: Realm, ids: (ObjectId | string)[]) {
    const idsQuery = ids
      .map((id) => `_id == oid(${id as string})`)
      .join(" OR ");

    let objects = realm
      .objects<FeedEntity>("FeedEntity")
      .filtered(`(${idsQuery})`);

    return objects;
  }

  // ========================
  // Update
  // ========================
  update(
    realm: Realm,
    feedEntity: FeedEntity,
    feed: Feed,
    existingFeedEntity: FeedEntity | null,
    partition: string
  ) {
    try {
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
          updateObj.read = feedEntity.read;
          updateObj.feed = feed;

          return true;
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

            return true;
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
            updateObj.read = feedEntity.read;
            updateObj.feed = feed;

            return true;
          }
        }
      });
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Failed to update database: ${
        error as string
      }`;
      return false;
    }
  }

  // ========================
  // Delete
  // ========================
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

    try {
      return realm.safeWrite(() => {
        realm.delete(readObjects);
        realm.delete(unreadObjects);
        return feedCount;
      });
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Failed to delete database: ${
        error as string
      }`;
      return {};
    }
  }

  delete(realm: Realm, feedEntity?: FeedEntity, ids?: (ObjectId | string)[]) {
    try {
      return realm.safeWrite(() => {
        if (feedEntity) {
          realm.delete(feedEntity);
        } else if (ids) {
          const idsQuery = ids
            .map((id) => `_id == oid(${id as string})`)
            .join(" OR ");
          realm.delete(
            realm.objects<FeedEntity>("FeedEntity").filtered(`(${idsQuery})`)
          );
          return true;
        } else {
          throw new Error("No feed entity or ids are given");
        }
      });
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Failed to delete feed entities: ${
        error as string
      }`;
      return false;
    }
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

export type FeedEntityResults =
  | Results<FeedEntity & Object>
  | Array<FeedEntity>;
