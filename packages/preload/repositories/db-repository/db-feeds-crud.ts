import Realm, { Results } from "realm";
import { ObjectId } from "bson";

import { Feed } from "../../models/Feed";
import { FeedEntity } from "../../models/FeedEntity";
import { FeedDraft } from "../../models/FeedDraft";
import { FeedEntityDraft } from "../../models/FeedEntityDraft";
import { DBRepository } from "./db-repository";
import { formatString } from "../../utils/string";

// ===========================================================
// Read
export function createFeedFilterPattern(
  this: DBRepository,
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
    if (this.sharedState.viewState.searchMode.get() === "general") {
      filterFormat += `(title contains[c] \"${formatedSearch}\" OR authors contains[c] \"${formatedSearch}\" OR publication contains[c] \"${formatedSearch}\" OR abstract contains[c] \"${formatedSearch}\") AND `;
    } else if (this.sharedState.viewState.searchMode.get() === "advanced") {
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

export async function feeds(
  this: DBRepository,
  feedName: string | null,
  sortBy: string,
  sortOrder: string
): Promise<Feed[]> {
  const realm = await this.realm();
  const objects = realm.objects("Feed").sorted(sortBy, sortOrder == "desc");

  if (!this.feedsListenerInited) {
    objects.addListener((objs, changes) => {
      const deletionCount = changes.deletions.length;
      const insertionCount = changes.insertions.length;
      const modificationCount =
        changes.newModifications.length + changes.oldModifications.length;

      if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
        this.sharedState.set("dbState.feedsUpdated", Date.now());
      }
    });
    this.feedsListenerInited = true;
  }

  if (feedName) {
    return objects.filtered(`name == "${feedName}"`).toJSON() as Feed[];
  }
  return objects.toJSON() as Feed[];
}

export async function feedEntities(
  this: DBRepository,
  search: string | null,
  name: string | null,
  unread: boolean,
  sortBy: string,
  sortOrder: string
): Promise<FeedEntity[]> {
  const filterPattern = this.createFeedFilterPattern(search, name, unread);

  const realm = await this.realm();
  const objects = realm
    .objects("FeedEntity")
    .sorted(sortBy, sortOrder == "desc");

  this.sharedState.set("viewState.feedEntitiesCount", objects.length);

  if (!this.feedEntitiesListenerInited) {
    objects.addListener((objs, changes) => {
      const deletionCount = changes.deletions.length;
      const insertionCount = changes.insertions.length;
      const modificationCount =
        changes.newModifications.length + changes.oldModifications.length;

      if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
        this.sharedState.set("dbState.feedEntitiesUpdated", Date.now());
      }
    });
    this.feedEntitiesListenerInited = true;
  }

  if (filterPattern) {
    let feeds;
    try {
      feeds = objects.filtered(filterPattern).toJSON() as FeedEntity[];
    } catch (error) {
      console.log(error);
      this.sharedState.set(
        "viewState.alertInformation",
        `Filter pattern is invalid: ${error as string}`
      );
      feeds = objects.toJSON() as FeedEntity[];
    }
    feeds = feeds.map((feed) => {
      feed.id = feed.id.toString();
      feed._id = feed._id.toString();
      return feed;
    });
    return feeds;
  } else {
    let feeds = objects.toJSON() as FeedEntity[];
    feeds = feeds.map((feed) => {
      feed.id = feed.id.toString();
      feed._id = feed._id.toString();
      return feed;
    });
    return feeds;
  }
}

// ============================================================
// Delete
export async function deleteFeeds(this: DBRepository, feedNames: string[]) {
  const realm = await this.realm();

  realm.safeWrite(() => {
    feedNames.forEach((feedName) => {
      const objects = realm!
        .objects<FeedEntity>("FeedEntity")
        .filtered(`feed.name == "${feedName}"`) as Results<FeedEntity>;
      realm!.delete(objects);
      const feeds = realm!
        .objects<Feed>("Feed")
        .filtered(`name == "${feedName}"`);
      realm!.delete(feeds);
    });
  });
}

// ============================================================
// Update & Add

export async function updateFeeds(
  this: DBRepository,
  feeds: FeedDraft[]
): Promise<boolean[]> {
  const realm = await this.realm();

  const successes: boolean[] = [];

  realm.safeWrite(() => {
    for (const feed of feeds) {
      let existingObj: Feed | null;
      if (feed._id) {
        existingObj = realm.objectForPrimaryKey(
          "Feed",
          new Realm.BSON.ObjectId(feed._id)
        ) as Feed;
      } else {
        existingObj = null;
      }
      if (existingObj) {
        // Update
        const updateObj = existingObj as unknown as Feed;

        updateObj.url = feed.url;
        updateObj.name = feed.name;
        updateObj.count = feed.count;
        updateObj.color = feed.color;

        successes.push(true);
      } else {
        // Add
        const reduplicatedFeeds = realm
          .objects("Feed")
          .filtered(`name == \"${feed.name}\"`);
        if (reduplicatedFeeds.length > 0) {
          continue;
        }

        if (this.cloudConfig && this.app && this.app.currentUser) {
          feed._partition = this.app.currentUser.id.toString();
        }
        const newObj = feed.create();
        realm.create("Feed", newObj);
        successes.push(true);
      }
    }
  });
  return successes;
}

export async function updateFeedEntities(
  this: DBRepository,
  feedEntities: FeedEntityDraft[]
): Promise<boolean[]> {
  const realm = await this.realm();

  const successes: boolean[] = [];

  realm.safeWrite(() => {
    for (const feedEntity of feedEntities) {
      let existingObj: FeedEntity | null;
      if (feedEntity._id) {
        existingObj = realm.objectForPrimaryKey(
          "FeedEntity",
          new Realm.BSON.ObjectId(feedEntity._id)
        ) as FeedEntity;
      } else {
        existingObj = null;
      }
      if (existingObj) {
        // Update
        const updateObj = existingObj as unknown as FeedEntity;

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
        updateObj.feed.color = feedEntity.feed.color;
        updateObj.feed.name = feedEntity.feed.name;
        updateObj.feed.url = feedEntity.feed.url;
        updateObj.feed.count = feedEntity.feed.count;

        successes.push(true);
      } else {
        // Add
        const reduplicatedFeeds = realm
          .objects("FeedEntity")
          .filtered(
            `title == \"${feedEntity.title}\" and authors == \"${feedEntity.authors}\"`
          );
        if (reduplicatedFeeds.length > 0) {
          continue;
        }

        if (this.cloudConfig && this.app && this.app.currentUser) {
          feedEntity._partition = this.app.currentUser.id.toString();
        }
        const newObj = feedEntity.create();

        let existingFeed: Feed;
        if (feedEntity.feed.id) {
          existingFeed = realm.objectForPrimaryKey(
            "Feed",
            new Realm.BSON.ObjectId(feedEntity.feed.id)
          ) as Feed;
        } else {
          const existingFeeds = realm
            .objects("Feed")
            .filtered(`name == \"${feedEntity.feed.name}\"`);
          if (existingFeeds.length > 0) {
            existingFeed = existingFeeds[0] as unknown as Feed;
          } else {
            existingFeed = newObj.feed;
            if (this.cloudConfig && this.app && this.app.currentUser) {
              existingFeed._partition = this.app.currentUser.id.toString();
            }
            realm.create("Feed", existingFeed);
          }
        }
        existingFeed.count += 1;
        newObj.feed = existingFeed;

        realm.create("FeedEntity", newObj);
        successes.push(true);
      }
    }
  });
  return successes;
}
