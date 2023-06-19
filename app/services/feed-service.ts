import { DatabaseCore, IDatabaseCore } from "@/base/database/core";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Colors } from "@/models/categorizer";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import { PaperEntity } from "@/models/paper-entity";
import {
  FeedEntityRepository,
  FeedEntityResults,
  IFeedEntityRepository,
} from "@/repositories/db-repository/feed-entity-repository-v2";
import {
  FeedRepository,
  IFeedRepository,
} from "@/repositories/db-repository/feed-repository-v2";
import {
  IRSSRepository,
  RSSRepository,
} from "@/repositories/rss-repository/rss-repository";
import { ILogService, LogService } from "@/services/log-service";
import { IPaperService, PaperService } from "@/services/paper-service";
import { IScrapeService, ScrapeService } from "@/services/scrape-service";
import { ProcessingKey, processing } from "@/services/state-service/processing";
import { formatString } from "@/utils/string";

export interface IFeedServiceState {
  updated: number;
  entitiesCount: number;
  entitiesUpdated: number;
}

export interface IFeedEntityFilterOptions {
  search?: string;
  searchMode?: "general" | "fulltext" | "advanced";
  feedName?: string;
  unread?: boolean;
}

export const IFeedService = createDecorator("feedService");

export class FeedService extends Eventable<IFeedServiceState> {
  constructor(
    @IDatabaseCore private readonly _databaseCore: DatabaseCore,
    @IFeedEntityRepository
    private readonly _feedEntityRepository: FeedEntityRepository,
    @IFeedRepository private readonly _feedRepository: FeedRepository,
    @IRSSRepository private readonly _rssRepository: RSSRepository,
    @IScrapeService private readonly _scrapeService: ScrapeService,
    @IPaperService private readonly _paperService: PaperService,
    @ILogService private readonly _logService: LogService
  ) {
    super("feedService", {
      updated: 0,
      entitiesCount: 0,
      entitiesUpdated: 0,
    });

    this._feedRepository.on(["updated"], (payload) => {
      this.fire({
        updated: payload.value,
      });
    });

    this._feedEntityRepository.on(["count", "updated"], (payload) => {
      this.fire({
        [`entities${payload.key.slice(0, 1).toUpperCase()}${payload.key.slice(
          1
        )}`]: payload.value,
      });
    });
  }

  /**
   * Load feeds.
   * @param sortBy Sort by.
   * @param sortOrder Sort order.
   */
  @processing(ProcessingKey.General)
  async load(sortBy: string, sortOrder: string) {
    try {
      return this._feedRepository.load(
        await this._databaseCore.realm(),
        sortBy,
        sortOrder
      );
    } catch (error) {
      this._logService.error(
        "Failed to load feeds",
        error as Error,
        true,
        "FeedService"
      );
      return [] as Feed[];
    }
  }

  constructFilter(filterOptions: IFeedEntityFilterOptions) {
    let filter = "";

    if (filterOptions.search) {
      const formatedSearch = formatString({
        str: filterOptions.search,
        removeNewline: true,
        trimWhite: true,
      });

      if (filterOptions.searchMode === "general") {
        filter += `(title contains[c] \"${formatedSearch}\" OR authors contains[c] \"${formatedSearch}\" OR publication contains[c] \"${formatedSearch}\" OR abstract contains[c] \"${formatedSearch}\") AND `;
      } else if (filterOptions.searchMode === "advanced") {
        filter += `(${formatedSearch}) AND `;
      }
    }
    if (filterOptions.feedName) {
      filter += `(feed.name == \"${filterOptions.feedName}\") AND `;
    }
    if (filterOptions.unread) {
      filter += `(read == false) AND `;
    }
    if (filter.length > 0) {
      filter = filter.slice(0, -5);
    }

    return filter;
  }

  /**
   * Load feed entities from the database.
   * @param search Search string.
   * @param feed Feed name.
   * @param unread Whether to load only unread entities.
   * @param sortBy Sort by.
   * @param sortOrder Sort order.
   * @returns Feed entities.
   */
  @processing(ProcessingKey.General)
  async loadEntities(
    filter: string,
    sortBy: string,
    sortOrder: "asce" | "desc"
  ) {
    try {
      return this._feedEntityRepository.load(
        await this._databaseCore.realm(),
        filter,
        sortBy,
        sortOrder
      );
    } catch (e) {
      this._logService.error(
        "Failed to load feed entities",
        e as Error,
        true,
        "FeedService"
      );
      return [] as FeedEntityResults;
    }
  }

  /**
   * Update a feed.
   * @param feed Feed.
   * returns
   */
  @processing(ProcessingKey.General)
  async update(feeds: Feed[]) {
    this._logService.info(
      `Updating ${feeds.length} feeds...`,
      "",
      true,
      "FeedService"
    );

    try {
      const realm = await this._databaseCore.realm();

      return realm.safeWrite(() => {
        const updatedFeeds: (Feed | null)[] = [];

        for (const feed of feeds) {
          let existingFeed: Feed | null = null;
          if (feed._id) {
            const existingObjs = this._feedRepository.loadByIds(realm, [
              feed._id,
            ]);
            if (existingObjs.length > 0) {
              existingFeed = existingObjs[0];
            }
          }
          const updatedFeed = this._feedRepository.update(
            realm,
            existingFeed,
            feed,
            this._databaseCore.getPartition()
          );
          updatedFeeds.push(updatedFeed);
        }

        return updatedFeeds;
      });
    } catch (error) {
      this._logService.error(
        `Failed to update feeds`,
        error as Error,
        true,
        "Feed"
      );
      return [] as Feed[];
    }
  }

  /**
   * Update feed entities.
   * @param feedEntities - Feed entities
   * @returns
   */
  @processing(ProcessingKey.General)
  async updateEntities(feedEntities: FeedEntity[], ignoreReadState = false) {
    this._logService.info(
      `Updating ${feedEntities.length} feed entities...`,
      "",
      true,
      "FeedEntityService"
    );

    try {
      // TODO: make the following logic clearer
      const realm = await this._databaseCore.realm();

      return realm.safeWrite(() => {
        const successes: boolean[] = [];
        for (const feedEntity of feedEntities) {
          let existingFeedEntity: FeedEntity | null = null;
          if (feedEntity._id) {
            const existingObjs = this._feedEntityRepository.loadByIds(realm, [
              feedEntity._id,
            ]);
            if (existingObjs.length > 0) {
              existingFeedEntity = existingObjs[0];
            }
          }

          const feed = this._feedRepository.update(
            realm,
            existingFeedEntity ? existingFeedEntity.feed : null,
            feedEntity.feed,
            this._databaseCore.getPartition()
          );
          let success;
          if (feed) {
            const createMode = this._feedEntityRepository.update(
              realm,
              feedEntity,
              feed,
              existingFeedEntity,
              ignoreReadState,
              this._databaseCore.getPartition()
            );

            if (createMode === "updated") {
              this._feedRepository.delete(realm, false, feed);
            }

            success = createMode ? true : false;
          } else {
            success = false;
          }
          successes.push(success);
        }
      });
    } catch (error) {
      this._logService.error(
        `Failed to update feed entities`,
        error as Error,
        true,
        "FeedEntityService"
      );
    }
  }

  /**
   * Create a feed.
   * @param feed Feed.
   * @returns
   */
  @processing(ProcessingKey.General)
  async create(feeds: Feed[]) {
    try {
      const updatedFeeds = await this.update(feeds);

      this.refresh(
        (updatedFeeds.filter((feed) => feed !== null) as Feed[]).map(
          (feed: Feed) => feed.name
        )
      );
    } catch (error) {
      this._logService.error(
        `Failed to create feeds`,
        error as Error,
        true,
        "FeedService"
      );
    }
  }

  /**
   * Refresh feeds.
   * @param feed Feed.
   * @returns
   */
  @processing(ProcessingKey.General)
  async refresh(feedNames: string[]) {
    // TODO: user id rather than name here.
    this._logService.info(
      `Refreshing ${feedNames.length} feeds...`,
      "",
      true,
      "FeedService"
    );

    try {
      let feedEntityDrafts: FeedEntity[] = [];

      const feeds = (await this.load("name", "asce")) as Realm.Results<
        Feed & Realm.Object
      >;
      feedEntityDrafts = (
        await Promise.all(
          feedNames.map((feedName) => {
            const feed = feeds.filtered(`name = "${feedName}"`);
            if (feed.length === 0) {
              return Promise.resolve([] as FeedEntity[]);
            } else {
              return this._rssRepository.fetch(feed[0]);
            }
          })
        )
      ).flat();
      await this.updateEntities(feedEntityDrafts, true);
    } catch (error) {
      this._logService.error(
        `Failed to refresh feeds`,
        error as Error,
        true,
        "Feed"
      );
    }
  }

  /**
   * Colorize a feed.
   * @param color Color.
   * @param name Feed name.
   * @param feed Feed.
   * @returns
   */
  @processing(ProcessingKey.General)
  async colorize(color: Colors, name?: string, feed?: Feed) {
    try {
      this._feedRepository.colorize(
        await this._databaseCore.realm(),
        color,
        feed,
        name
      );
    } catch (error) {
      this._logService.error(
        `Failed to colorize feed`,
        error as Error,
        true,
        "FeedService"
      );
    }
  }

  /**
   * Delete a feed.
   * @param name Feed name.
   * @param feed Feed.
   * @returns
   */
  @processing(ProcessingKey.General)
  async delete(name?: string, feed?: Feed) {
    const realm = await this._databaseCore.realm();
    try {
      const toBeDeletedEntities = this._feedEntityRepository.load(
        realm,
        this.constructFilter({
          feedName: name || feed?.name,
        }),
        "addTime",
        "asce"
      );

      this._feedEntityRepository.delete(
        realm,
        toBeDeletedEntities.map((feed) => feed._id)
      );

      this._feedRepository.delete(realm, true, feed, name);
    } catch (e) {
      this._logService.error(
        `Failed to remove feed`,
        e as Error,
        true,
        "FeedService"
      );
    }
  }

  /**
   * Add feed entities to library.
   * @param feedEntities
   * @returns
   */
  async addToLib(feedEntities: FeedEntity[]) {
    this._logService.info(
      `Adding ${feedEntities.length} feed entities to library...`,
      "",
      true,
      "Feed"
    );

    try {
      const paperEntityDrafts = await this._scrapeService.scrape(
        feedEntities.map((feedEntityDraft: FeedEntity) => {
          const paperEntityDraft = new PaperEntity(true);
          paperEntityDraft.fromFeed(feedEntityDraft);
          // NOTE: we don't want to download the PDFs when adding to library.
          paperEntityDraft.mainURL = "";
          return {
            type: "paperEntity",
            value: paperEntityDraft,
          };
        }),
        ["semanticscholar"]
      );

      // NOTE: here we decide to not download the PDFs when adding to library.
      await this._paperService.update(paperEntityDrafts);
    } catch (error) {
      this._logService.error(
        `Failed to add feed entities to library`,
        error as Error,
        true,
        "Feed"
      );
    }
  }

  // TODO: routine task
}
