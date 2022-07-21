import { ToadScheduler, SimpleIntervalJob, Task } from "toad-scheduler";

import { SharedState } from "../utils/appstate";
import { Preference } from "../utils/preference";

import { DBRepository } from "../repositories/db-repository/db-repository";
import { ScraperRepository } from "../repositories/scraper-repository/scraper-repository";
import { RSSRepository } from "../repositories/rss-repository/rss-repository";

import { PaperEntityDraft } from "../models/PaperEntityDraft";
import { FeedDraft } from "../models/FeedDraft";
import { FeedEntityDraft } from "../models/FeedEntityDraft";
import { WebImporterRepository } from "../repositories/web-importer-repository/web-importer-repository";
import { EntityInteractor } from "./entity-interactor";

export class FeedInteractor {
  sharedState: SharedState;
  preference: Preference;

  dbRepository: DBRepository;
  scraperRepository: ScraperRepository;
  rssRepository: RSSRepository;
  webImporterRepository: WebImporterRepository;

  entityInteractor: EntityInteractor;

  scheduler: ToadScheduler;

  constructor(
    sharedState: SharedState,
    preference: Preference,
    dbRepository: DBRepository,
    scraperRepository: ScraperRepository,
    rssRepository: RSSRepository,
    webImporterRepository: WebImporterRepository,
    entityInteractor: EntityInteractor
  ) {
    this.sharedState = sharedState;
    this.preference = preference;

    this.dbRepository = dbRepository;
    this.scraperRepository = scraperRepository;
    this.rssRepository = rssRepository;
    this.webImporterRepository = webImporterRepository;

    this.entityInteractor = entityInteractor;

    this.scheduler = new ToadScheduler();
    this.setupRoutineScrapeScheduler();
  }

  // ============================================================
  // Read
  async loadFeeds(sortBy: string, sortOrder: string) {
    let feeds = await this.dbRepository.feeds(null, sortBy, sortOrder);
    return feeds;
  }

  async loadFeedEntities(
    search: string,
    feedName: string,
    unread: boolean,
    sortBy: string,
    sortOrder: string
  ) {
    if (this.sharedState.viewState.searchMode.get() === "fulltext" && search) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Fulltext searching is not supported in the feeds view.`
      );
      search = "";
    }

    let feedEntities = await this.dbRepository.feedEntities(
      search,
      feedName,
      unread,
      sortBy,
      sortOrder
    );
    return feedEntities;
  }

  // ============================================================
  // Create
  async update(feeds: string) {
    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) + 1
    );
    try {
      let feedDrafts = JSON.parse(feeds) as FeedDraft[];
      feedDrafts = feedDrafts.map((feedDraft) => {
        const draft = new FeedDraft();
        draft.initialize(feedDraft);
        return draft;
      });
      await this.dbRepository.updateFeeds(feedDrafts);

      for (const feedDraft of feedDrafts) {
        await this.refresh(feedDraft.name);
      }
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Update feed failed: ${error as string}`
      );
    }

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) - 1
    );
  }

  async addFeedEntities(feedEntities: string) {
    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) + 1
    );

    try {
      let feedEntityDrafts = JSON.parse(feedEntities) as FeedEntityDraft[];

      const addPromise = async (feedEntityDraft: FeedEntityDraft) => {
        const webContent = await this.webImporterRepository.getWebContent(
          feedEntityDraft.mainURL
        );
        const importedPaperEntityDraft = await this.webImporterRepository.parse(
          webContent
        );

        if (importedPaperEntityDraft) {
          await this.entityInteractor.scrape(
            JSON.stringify([importedPaperEntityDraft])
          );
        } else {
          const paperEntityDraft = new PaperEntityDraft();
          paperEntityDraft.fromFeed(feedEntityDraft);
          await this.dbRepository.update([paperEntityDraft]);
        }
      };

      await Promise.all(
        feedEntityDrafts.map((feedEntityDraft) => addPromise(feedEntityDraft))
      );
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Add paper from feed failed: ${error as string}`
      );
    }

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) - 1
    );
  }

  async updateFeedEntities(feedEntities: string) {
    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) + 1
    );

    try {
      let feedEntityDrafts = JSON.parse(feedEntities) as FeedEntityDraft[];

      await this.dbRepository.updateFeedEntities(feedEntityDrafts);
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Update feed failed: ${error as string}`
      );
    }

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) - 1
    );
  }

  // ============================================================
  // Delete
  async delete(feedName: string) {
    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) + 1
    );

    try {
      await this.dbRepository.deleteFeeds([feedName]);
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Delete feed failed: ${error as string}`
      );
    }

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) - 1
    );
  }

  async deleteOutdatedFeedEntities() {
    this.dbRepository.deleteOutdatedFeedEntities();
  }

  // ============================================================
  // Update
  async refresh(feedName: string) {
    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) + 1
    );
    try {
      const feed = await this.dbRepository.feeds(feedName, "name", "desc");
      let feedEntityDrafts: FeedEntityDraft[] = [];
      if (feed.length !== 0) {
        feedEntityDrafts = await this.rssRepository.parse(feed[0]);
      }

      let paperEntityDrafts = feedEntityDrafts.map((feedEntityDraft) => {
        const draft = new PaperEntityDraft();
        draft.fromFeed(feedEntityDraft);
        return draft;
      });

      const scrapePromise = async (entityDraft: PaperEntityDraft) => {
        return await this.scraperRepository.scrape(entityDraft, [
          "cvf",
          "dblp",
          "ieee",
          "openreview",
          "pwc",
          "googlescholar",
          "pdf",
        ]);
      };

      // Scrape every 5 papers
      const n = paperEntityDrafts.length;

      let scrapedPaperEntityDrafts: PaperEntityDraft[] = [];
      for (let i = 0; i < n; i += 5) {
        const paperEntityDraftsChunk = paperEntityDrafts.slice(i, i + 5);
        const scrapedPaperEntityChunk = await Promise.all(
          paperEntityDraftsChunk.map((paperEntityDraft) =>
            scrapePromise(paperEntityDraft)
          )
        );
        scrapedPaperEntityDrafts = scrapedPaperEntityDrafts.concat(
          scrapedPaperEntityChunk
        );
      }

      for (const i in feedEntityDrafts) {
        if (scrapedPaperEntityDrafts[i]) {
          feedEntityDrafts[i].fromPaper(scrapedPaperEntityDrafts[i]);
        }
      }

      await this.dbRepository.updateFeedEntities(feedEntityDrafts);
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Refresh feed failed: ${error as string}`
      );
    }

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) - 1
    );
  }

  async routineRefresh() {
    this.sharedState.set(
      "viewState.processInformation",
      "Routine feed refreshing..."
    );
    this.preference.set("lastFeedRefreshTime", Math.round(Date.now() / 1000));
    const feeds = await this.dbRepository.feeds(null, "name", "desc");
    for (const feed of feeds) {
      await this.refresh(feed.name);
    }
    await this.deleteOutdatedFeedEntities();
  }

  setupRoutineScrapeScheduler() {
    const lastFeedRefreshTime = this.preference.get(
      "lastFeedRefreshTime"
    ) as number;

    if (Math.round(Date.now() / 1000) - lastFeedRefreshTime > 86400) {
      void this.routineRefresh();
    }

    if (this.scheduler == null) {
      this.scheduler = new ToadScheduler();
    } else {
      this.scheduler.stop();
      this.scheduler.removeById("routineFeedRefresh");
    }

    const task = new Task("routineFeedRefresh", () => {
      void this.routineRefresh();
    });

    const job = new SimpleIntervalJob(
      { seconds: 86400, runImmediately: false },
      task,
      "routineFeedRefresh"
    );

    this.scheduler.addSimpleIntervalJob(job);
  }
}