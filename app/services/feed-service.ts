import { ObjectId } from "bson";
import { clipboard } from "electron";
import { readFileSync } from "fs";
import path from "path";

import { createDecorator } from "@/base/injection/injection";
import {
  Categorizer,
  CategorizerType,
  Colors,
  PaperFolder,
  PaperTag,
} from "@/models/categorizer";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import { PaperEntity } from "@/models/paper-entity";
import { ThumbnailCache } from "@/models/paper-entity-cache";
import { PaperSmartFilter, PaperSmartFilterType } from "@/models/smart-filter";
import {
  DBRepository,
  IDBRepository,
} from "@/repositories/db-repository/db-repository";
import { FeedEntityResults } from "@/repositories/db-repository/feed-entity-repository";
import { IPaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import {
  DownloaderRepository,
  IDownloaderRepository,
} from "@/repositories/downloader-repository/downloader-repository";
import {
  FileRepository,
  IFileRepository,
} from "@/repositories/file-repository/file-repository";
import {
  IReferenceRepository,
  ReferenceRepository,
} from "@/repositories/reference-repository/reference-repository";
import {
  IRSSRepository,
  RSSRepository,
} from "@/repositories/rss-repository/rss-repository";
import {
  IScraperRepository,
  ScraperRepository,
} from "@/repositories/scraper-repository/scraper-repository";
import { ILogService, LogService } from "@/services/log-service";
import {
  IPreferenceService,
  PreferenceService,
} from "@/services/preference-service";
import { ProcessingKey, processing } from "@/services/state-service/processing";
import {
  IStateService,
  StateService,
} from "@/services/state-service/state-service";
import { bibtex2json, bibtex2paperEntityDraft } from "@/utils/bibtex";

export const ISechedulerService = createDecorator("ISchedulerService");

export class FeedService {
  constructor(
    @IDBRepository private readonly dbRepository: DBRepository,
    @IScraperRepository private readonly scraperRepository: ScraperRepository,
    @IFileRepository private readonly fileRepository: FileRepository,
    @IDownloaderRepository
    private readonly downloaderRepository: DownloaderRepository,
    @IReferenceRepository
    private readonly referenceRepository: ReferenceRepository,
    @IRSSRepository private readonly rssRepository: RSSRepository,
    @IStateService private readonly stateService: StateService,
    @IPreferenceService private readonly preferenceService: PreferenceService,
    @ILogService private readonly logService: LogService
  ) {}

  // ========================
  // Read
  // ========================

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
  async loadFeedEntities(
    search: string,
    feed: string,
    unread: boolean,
    sortBy: string,
    sortOrder: string
  ) {
    let entities;
    if (
      (this.stateService.viewState.searchMode === "fulltext" ||
        this.stateService.viewState.searchMode === "advanced") &&
      search
    ) {
      this.logService.warn(
        `Fulltext or advanced searching is not supported in the feeds view.`,
        "",
        true,
        "Search"
      );
      search = "";
    }
    try {
      entities = await this.dbRepository.feedEntities(
        search,
        feed,
        unread,
        sortBy,
        sortOrder
      );
    } catch (e) {
      this.logService.error(
        "Failed to load feed entities",
        e as Error,
        true,
        "Feed"
      );
      entities = [] as FeedEntityResults;
    }

    return entities;
  }

  /**
   * Load feeds.
   * @param sortBy Sort by.
   * @param sortOrder Sort order.
   */
  async loadFeeds(sortBy: string, sortOrder: string) {
    return await this.dbRepository.feeds(sortBy, sortOrder);
  }

  // ========================
  // Create
  // ========================
  /**
   * Create a feed.
   * @param feed Feed.
   * @returns
   */
  @processing(ProcessingKey.General)
  async createFeed(feeds: Feed[]) {
    this.logService.info(`Creating ${feeds.length} feeds...`, "", true, "Feed");

    try {
      const successes = await this.dbRepository.updateFeeds(feeds);

      this.refresh(
        feeds.filter((_, index) => successes[index]).map((feed) => feed.name)
      );
    } catch (error) {
      this.logService.error(
        `Failed to create feeds`,
        error as Error,
        true,
        "Feed"
      );
    }
  }

  // ========================
  // Update
  // ========================
  /**
   * Update a feed.
   * @param feed Feed.
   * @returns
   */
  @processing(ProcessingKey.General)
  async refresh(feedNames: string[]) {
    this.logService.info(
      `Refreshing ${feedNames.length} feeds...`,
      "",
      true,
      "Feed"
    );

    try {
      let feedEntityDrafts: FeedEntity[] = [];

      const feeds = await this.dbRepository.feeds("name", "asc");
      feedEntityDrafts = (
        await Promise.all(
          feedNames.map((feedName) => {
            const feed = feeds.filtered(`name = "${feedName}"`);
            if (feed.length === 0) {
              return Promise.resolve([] as FeedEntity[]);
            } else {
              return this.rssRepository.fetch(feed[0]);
            }
          })
        )
      ).flat();
      await this.dbRepository.updateFeedEntities(feedEntityDrafts, true);
    } catch (error) {
      this.logService.error(
        `Failed to refresh feeds`,
        error as Error,
        true,
        "Feed"
      );
    }
  }

  /**
   * Update a feed.
   * @param feed Feed.
   * returns
   */
  @processing(ProcessingKey.General)
  async updateFeeds(feeds: Feed[]) {
    this.logService.info(`Updating ${feeds.length} feeds...`, "", true, "Feed");

    try {
      await this.dbRepository.updateFeeds(feeds);
    } catch (error) {
      this.logService.error(
        `Failed to update feeds`,
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
  async colorizeFeed(color: Colors, name?: string, feed?: Feed) {
    try {
      await this.dbRepository.colorizeFeed(color, feed, name);
    } catch (error) {
      this.logService.error(
        `Failed to colorize feed`,
        error as Error,
        true,
        "Feed"
      );
    }
  }

  /**
   * Update a feed entity.
   * @param feedEntity Feed entity.
   * @returns
   */
  @processing(ProcessingKey.General)
  async updateFeedEntities(feedEntities: FeedEntity[]) {
    this.logService.info(
      `Updating ${feedEntities.length} feed entities...`,
      "",
      true,
      "Feed"
    );

    try {
      await this.dbRepository.updateFeedEntities(feedEntities);
    } catch (error) {
      this.logService.error(
        `Failed to update feed entities`,
        error as Error,
        true,
        "Feed"
      );
    }
  }

  /**
   * Add feed entities to library.
   * @param feedEntities
   * @returns
   */
  async addToLib(feedEntities: FeedEntity[]) {
    this.logService.info(
      `Adding ${feedEntities.length} feed entities to library...`,
      "",
      true,
      "Feed"
    );

    try {
      const addPromise = async (feedEntityDraft: FeedEntity) => {
        let paperEntityDraft = new PaperEntity(true);
        paperEntityDraft.fromFeed(feedEntityDraft);
        return await this.scraperRepository.scrape(paperEntityDraft, [
          "semanticscholar",
        ]);
      };

      const paperEntityDrafts = await Promise.all(
        feedEntities.map((feedEntity) => addPromise(feedEntity))
      );

      // NOTE: here we decide to not download the PDFs when adding to library.
      await this.dbRepository.updatePaperEntities(paperEntityDrafts);
    } catch (error) {
      this.logService.error(
        `Failed to add feed entities to library`,
        error as Error,
        true,
        "Feed"
      );
    }
  }

  // ========================
  // Delete
  // ========================
  /**
   * Delete a feed.
   * @param name Feed name.
   * @param feed Feed.
   * @returns
   */
  @processing(ProcessingKey.General)
  async deleteFeed(name?: string, feed?: Feed) {
    try {
      await this.dbRepository.deleteFeed(true, feed, name);
    } catch (e) {
      this.logService.error(`Failed to remove feed`, e as Error, true, "Feed");
    }
  }

  // TODO: routine task
}
