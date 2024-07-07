import { chunkRun } from "@/base/chunk";
import { DatabaseCore, IDatabaseCore } from "@/base/database/core";
import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { formatString } from "@/base/string";
import { ILogService, LogService } from "@/common/services/log-service";
import { Colors } from "@/models/categorizer";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import { OID } from "@/models/id";
import { PaperEntity } from "@/models/paper-entity";
import { IPaperService, PaperService } from "@/renderer/services/paper-service";
import {
  ISchedulerService,
  SchedulerService,
} from "@/renderer/services/scheduler-service";
import {
  IScrapeService,
  ScrapeService,
} from "@/renderer/services/scrape-service";
import { ProcessingKey, processing } from "@/renderer/services/uistate-service";
import {
  FeedEntityRepository,
  IFeedEntityCollection,
  IFeedEntityObject,
  IFeedEntityRepository,
} from "@/repositories/db-repository/feed-entity-repository";
import {
  FeedRepository,
  IFeedCollection,
  IFeedObject,
  IFeedRepository,
} from "@/repositories/db-repository/feed-repository";
import {
  IRSSRepository,
  RSSRepository,
} from "@/repositories/rss-repository/rss-repository";

export interface IFeedEntityFilterOptions {
  search?: string;
  searchMode?: "general" | "fulltext" | "advanced";
  feedIds?: OID[];
  feedNames?: string[];
  unread?: boolean;
  title?: string;
  authors?: string;
}

export class FeedEntityFilterOptions implements IFeedEntityFilterOptions {
  public filters: string[] = [];
  public placeholders: string[] = [];
  public search?: string;
  public searchMode?: "general" | "fulltext" | "advanced";
  public feedIds?: OID[];
  public feedNames?: string[];
  public unread?: boolean;
  public title?: string;
  public authors?: string;

  constructor(options?: Partial<IFeedEntityFilterOptions>) {
    if (options) {
      this.update(options);
    }
  }

  update(options: Partial<IFeedEntityFilterOptions>) {
    for (const key in options) {
      this[key] = options[key];
    }

    this.filters = [];
    this.placeholders = [];

    if (this.search) {
      const formatedSearch = formatString({
        str: this.search,
        removeNewline: true,
        trimWhite: true,
      });

      if (this.searchMode === "general") {
        this.filters.push(
          `(title contains[c] \"${formatedSearch}\" OR authors contains[c] \"${formatedSearch}\" OR publication contains[c] \"${formatedSearch}\" OR abstract contains[c] \"${formatedSearch}\")`
        );
      } else if (this.searchMode === "advanced") {
        this.filters.push(`(${formatedSearch})`);
      }
    }
    if (this.feedNames && this.feedNames.length > 0) {
      const feedNamesQuery = this.feedNames
        .filter((feedName) => feedName)
        .map((feedName) => `"${feedName}"`)
        .join(", ");

      this.filters.push(`(feed.name IN { ${feedNamesQuery} })`);
    }
    if (this.feedIds && this.feedIds.length > 0) {
      const feedIdsQuery = this.feedIds
        .filter((feedId) => feedId)
        .map((feedId) => `oid(${feedId})`)
        .join(", ");

      this.filters.push(`(feed._id IN { ${feedIdsQuery} })`);
    }
    if (this.unread) {
      this.filters.push(`(read == false)`);
    }
    if (this.title) {
      this.filters.push(`(title == $${this.placeholders.length})`);
      this.placeholders.push(this.title);
    }
    if (this.authors) {
      this.filters.push(`(authors == $${this.placeholders.length})`);
      this.placeholders.push(this.authors);
    }
  }

  toString() {
    const filterStr = this.filters.join(" AND ");
    return filterStr;
  }
}

export interface IFeedServiceState {
  updated: number;
  entitiesCount: number;
  entitiesUpdated: number;
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
    @ISchedulerService private readonly _schedulerService: SchedulerService,
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

    this._databaseCore.already("dbInitialized", () => {
      this._schedulerService.createTask(
        "feedServiceScrapePreprint",
        () => {
          this._routineRefresh();
        },
        86400,
        undefined,
        true,
        false,
        60000
      );
    });
  }

  /**
   * Load feeds.
   * @param sortBy - Sort by.
   * @param sortOrder - Sort order.
   * @returns Feeds.
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to load feeds.", true, "FeedService", [])
  async load(sortBy: string, sortOrder: string) {
    if (this._databaseCore.getState("dbInitializing")) {
      return [];
    }
    return this._feedRepository.load(
      await this._databaseCore.realm(),
      sortBy,
      sortOrder
    );
  }

  /**
   * Load feed entities from the database.
   * @param filter - Filter.
   * @param sortBy - Sort by.
   * @param sortOrder - Sort order.
   * @returns Feed entities.
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to load feed entities.", true, "FeedService", [])
  async loadEntities(
    filter: FeedEntityFilterOptions,
    sortBy: string,
    sortOrder: "asce" | "desc"
  ) {
    if (this._databaseCore.getState("dbInitializing")) {
      return [];
    }
    if (!(filter instanceof FeedEntityFilterOptions)) {
      filter = new FeedEntityFilterOptions(filter);
    }

    return this._feedEntityRepository.load(
      await this._databaseCore.realm(),
      filter.toString(),
      filter.placeholders,
      sortBy,
      sortOrder
    );
  }

  /**
   * Update feeds.
   * @param feeds - Feeds.
   * @returns Updated feeds.
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to update feeds.", true, "FeedService", [])
  async update(feeds: IFeedCollection) {
    if (this._databaseCore.getState("dbInitializing")) {
      return [];
    }
    this._logService.info(
      `Updating ${feeds.length} feeds...`,
      "",
      false,
      "FeedService"
    );

    const realm = await this._databaseCore.realm();

    const updatedFeeds: IFeedCollection = [];

    for (const feed of feeds) {
      const updatedFeed = this._feedRepository.update(
        realm,
        feed,
        this._databaseCore.getPartition()
      );
      updatedFeeds.push(updatedFeed);
    }

    return updatedFeeds;
  }

  /**
   * Update feed entities.
   * @param feedEntities - Feed entities
   * @param ignoreReadState - Ignore read state. Default: false.
   * @returns Updated feed entities.
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to update feed entities.", true, "FeedService", [])
  async updateEntities(
    feedEntities: IFeedEntityCollection,
    ignoreReadState = false
  ) {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }
    this._logService.info(
      `Updating ${feedEntities.length} feed entities...`,
      "",
      false,
      "FeedEntityService"
    );

    const realm = await this._databaseCore.realm();
    const updatedFeedEntities: IFeedEntityCollection = [];

    for (const feedEntity of feedEntities) {
      const updatedFeedEntity = this._feedEntityRepository.update(
        realm,
        feedEntity,
        this._databaseCore.getPartition(),
        ignoreReadState
      );
      updatedFeedEntities.push(updatedFeedEntity);
    }

    return updatedFeedEntities;
  }

  /**
   * Create feeds.
   * @param feeds - Feeds
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to create feeds.", true, "FeedService", [])
  async create(feeds: Feed[]) {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }
    feeds.forEach((feed) => {
      feed.name = feed.name.replace(/"/g, "'");
    });

    const updatedFeeds = await this.update(feeds);

    await this.refresh(undefined, updatedFeeds);
  }

  /**
   * Refresh feeds.
   * @param ids - Feed ids
   * @param feeds - Feeds
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to refresh feeds.", true, "FeedService")
  async refresh(ids?: OID[], feeds?: IFeedCollection) {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }

    if (!ids && !feeds) {
      throw new Error("No feed ids or feeds provided.");
    }

    this._logService.info(
      `Refreshing ${ids?.length || feeds?.length} feeds...`,
      "",
      false,
      "FeedService"
    );

    const realm = await this._databaseCore.realm();

    if (!feeds && ids) {
      feeds = this._feedRepository.loadByIds(realm, ids);
    } else {
      feeds = feeds!;
    }

    const feedEntityDraftListAndErrors = await chunkRun<
      IFeedObject,
      IFeedEntityCollection,
      IFeedEntityCollection
    >(
      feeds,
      async (feed: IFeedObject) => {
        const feedEntityDrafts = await this._rssRepository.fetch(feed);
        return feedEntityDrafts;
      },
      async () => {
        return [];
      },
      5
    );

    for (const i in feedEntityDraftListAndErrors.errors) {
      const error = feedEntityDraftListAndErrors.errors[i];
      this._logService.error(
        `Failed to refresh feeds: ${feeds[i].name}`,
        error as Error,
        true,
        "Feed"
      );
    }
    const feedEntityDrafts = feedEntityDraftListAndErrors.results.flat();

    this._logService.info(
      `Fetched ${feedEntityDrafts.length} feed entities...`,
      "",
      false,
      "FeedService"
    );

    await this.updateEntities(feedEntityDrafts, true);
  }

  /**
   * Colorize a feed.
   * @param color - Color
   * @param id - Feed ID
   * @param feed - Feed
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to colorize feeds.", true, "FeedService", [])
  async colorize(color: Colors, id?: OID, feed?: IFeedObject) {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }
    this._feedRepository.colorize(
      await this._databaseCore.realm(),
      color,
      id,
      feed
    );
  }

  /**
   * Delete a feed.
   * @param ids - Feed IDs
   * @param feeds - Feeds
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to delete feeds.", true, "FeedService", [])
  async delete(ids?: OID[], feeds?: IFeedCollection) {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }

    if (!ids && !feeds) {
      this._logService.error(
        "Failed to delete feeds",
        "No feed ids or feeds provided.",
        false,
        "FeedService"
      );
      return;
    }

    this._logService.info(
      `Deleting ${ids?.length || feeds?.length} feeds...`,
      "",
      false,
      "FeedService"
    );

    const realm = await this._databaseCore.realm();

    if (!feeds && ids) {
      feeds = this._feedRepository.loadByIds(realm, ids);
    } else {
      feeds = feeds!;
    }

    const filter = new FeedEntityFilterOptions({
      feedIds: feeds.map((feed: IFeedObject) => feed._id),
    });
    const toBeDeletedEntities = this._feedEntityRepository.load(
      realm,
      filter.toString(),
      filter.placeholders,
      "addTime",
      "asce"
    );
    this._feedEntityRepository.delete(realm, undefined, toBeDeletedEntities);

    this._feedRepository.delete(realm, undefined, feeds);
  }

  /**
   * Add feed entities to library.
   * @param feedEntities - Feed entities
   */
  @errorcatching("Failed to add feed entities to library.", true, "FeedService")
  async addToLib(feedEntities: IFeedEntityCollection) {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }

    this._logService.info(
      `Adding ${feedEntities.length} feed entities to library...`,
      "",
      true,
      "Feed"
    );

    const paperEntityDrafts = feedEntities.map(
      (feedEntityDraft: IFeedEntityObject) => {
        const paperEntityDraft = new PaperEntity({}, true).fromFeed(
          feedEntityDraft
        );
        // NOTE: we don't want to download the PDFs when adding to library.
        paperEntityDraft.mainURL = "";
        return paperEntityDraft;
      }
    );

    // NOTE: here we decide to not download the PDFs when adding to library.
    await this._paperService.update(paperEntityDrafts, false, false);
  }

  @processing(ProcessingKey.General)
  @errorcatching("Failed to refresh feeds (routine).", true, "FeedService")
  private async _routineRefresh() {
    if (this._databaseCore.getState("dbInitializing")) {
      return;
    }
    const feeds = (await this.load("name", "desc")) as Feed[];
    await this.refresh(undefined, feeds);
    this._feedEntityRepository.deleteOutdate(await this._databaseCore.realm());
  }

  /**
   * Migrate the local database to the cloud database. */
  @errorcatching(
    "Failed to migrate the local feeds to the cloud database.",
    true,
    "DatabaseService"
  )
  async migrateLocaltoCloud() {
    const localConfig = await this._databaseCore.getLocalConfig(false);
    const localRealm = new Realm(localConfig);

    const feeds = localRealm.objects<Feed>("Feed");
    await this.update(feeds.map((feed) => new Feed(feed)));

    const feedEntities = localRealm.objects<FeedEntity>("FeedEntity");
    await this.updateEntities(
      feedEntities.map((feedEntity) => new FeedEntity(feedEntity))
    );

    this._logService.info(
      `Migrated ${feeds.length} feed(s) to cloud database.`,
      "",
      true,
      "FeedService"
    );
  }
}
