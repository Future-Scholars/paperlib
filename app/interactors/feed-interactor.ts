import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { watch } from "vue";

import { Colors } from "@/models/categorizer";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { DBRepository } from "@/repositories/db-repository/db-repository";
import { FeedEntityResults } from "@/repositories/db-repository/feed-entity-repository";
import { RSSRepository } from "@/repositories/rss-repository/rss-repository";
import { ScraperRepository } from "@/repositories/scraper-repository/scraper-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

export class FeedInteractor {
  stateStore: MainRendererStateStore;
  preference: Preference;

  dbRepository: DBRepository;
  rssRepository: RSSRepository;
  scraperRepository: ScraperRepository;

  scheduler: ToadScheduler;

  constructor(
    stateStore: MainRendererStateStore,
    preference: Preference,
    dbRepository: DBRepository,
    rssRepository: RSSRepository,
    scraperRepository: ScraperRepository
  ) {
    this.stateStore = stateStore;
    this.preference = preference;

    this.dbRepository = dbRepository;
    this.rssRepository = rssRepository;
    this.scraperRepository = scraperRepository;

    this.scheduler = new ToadScheduler();
    watch(
      () => this.stateStore.viewState.realmReinited,
      () => {
        window.feedInteractor.setupRoutineRefreshScheduler();
      }
    );
  }

  // ========================
  // Read
  // ========================

  async loadFeedEntities(
    search: string,
    feed: string,
    unread: boolean,
    sortBy: string,
    sortOrder: string
  ) {
    let entities;
    this.stateStore.viewState.processingQueueCount += 1;
    if (
      (this.stateStore.viewState.searchMode === "fulltext" ||
        this.stateStore.viewState.searchMode === "advanced") &&
      search
    ) {
      this.stateStore.logState.alertLog = `Fulltext searching is not supported in the feeds view.`;
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
      console.error(e);
      this.stateStore.logState.alertLog = `Failed to load feed entities: ${e}`;
      entities = [] as FeedEntityResults;
    }

    this.stateStore.viewState.processingQueueCount -= 1;
    return entities;
  }

  async loadFeeds(sortBy: string, sortOrder: string) {
    return await this.dbRepository.feeds(sortBy, sortOrder);
  }

  // ========================
  // Create
  // ========================
  async createFeed(feeds: Feed[]) {
    this.stateStore.logState.infoLog = `Creating ${feeds.length} feeds...`;
    this.stateStore.viewState.processingQueueCount += feeds.length;

    try {
      const successes = await this.dbRepository.updateFeeds(feeds);

      this.refresh(
        feeds.filter((_, index) => successes[index]).map((feed) => feed.name)
      );
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Add feeds failed: ${
        error as string
      }`;
    }
    this.stateStore.viewState.processingQueueCount -= feeds.length;
  }

  // ========================
  // Update
  // ========================
  async refresh(feedNames: string[]) {
    this.stateStore.logState.infoLog = `Refreshing ${feedNames.length} feeds...`;
    this.stateStore.viewState.processingQueueCount += feedNames.length;

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

      let paperEntityDrafts = feedEntityDrafts.map((feedEntityDraft) => {
        const draft = new PaperEntity(false);
        draft.fromFeed(feedEntityDraft);
        return draft;
      });

      const scrapePromise = async (entityDraft: PaperEntity) => {
        return await this.scraperRepository.scrape(entityDraft, [
          "cvf",
          "dblp",
          "ieee",
          "openreview",
          "pwc",
          "googlescholar",
          "pdf",
          "crossref",
        ]);
      };

      // Scrape every 5 papers
      const n = paperEntityDrafts.length;

      let scrapedPaperEntityDrafts: PaperEntity[] = [];
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
      console.error(error);
      this.stateStore.logState.alertLog = `Refresh feeds failed: ${
        error as string
      }`;
    }
    this.stateStore.viewState.processingQueueCount -= feedNames.length;
  }

  async updateFeeds(feeds: Feed[]) {
    this.stateStore.logState.infoLog = `Updating ${feeds.length} feeds...`;
    this.stateStore.viewState.processingQueueCount += feeds.length;

    try {
      await this.dbRepository.updateFeeds(feeds);
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Updating feeds failed: ${
        error as string
      }`;
    }
    this.stateStore.viewState.processingQueueCount -= feeds.length;
  }

  async colorizeFeed(color: Colors, name?: string, feed?: Feed) {
    this.stateStore.viewState.processingQueueCount += 1;
    try {
      await this.dbRepository.colorizeFeed(color, feed, name);
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Failed to colorize feed ${name} ${feed}`;
    }
    this.stateStore.viewState.processingQueueCount -= 1;
  }

  async updateFeedEntities(feedEntities: FeedEntity[]) {
    this.stateStore.logState.infoLog = `Updating ${feedEntities.length} feed entities...`;
    this.stateStore.viewState.processingQueueCount += feedEntities.length;

    try {
      await this.dbRepository.updateFeedEntities(feedEntities);
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Updating feed entities failed: ${
        error as string
      }`;
    }
    this.stateStore.viewState.processingQueueCount -= feedEntities.length;
  }

  async addToLib(feedEntities: FeedEntity[]) {
    this.stateStore.logState.infoLog = `Adding ${feedEntities.length} feed entities to library...`;
    this.stateStore.viewState.processingQueueCount += feedEntities.length;

    try {
      const addPromise = async (feedEntityDraft: FeedEntity) => {
        let paperEntityDraft = new PaperEntity(true);
        paperEntityDraft.fromFeed(feedEntityDraft);
        return await this.scraperRepository.scrape(paperEntityDraft);
      };

      const paperEntityDrafts = await Promise.all(
        feedEntities.map((feedEntity) => addPromise(feedEntity))
      );

      // NOTE: here we decide to not download the PDFs when adding to library.
      await this.dbRepository.updatePaperEntities(paperEntityDrafts);
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Adding to library failed: ${
        error as string
      }`;
    }
    this.stateStore.viewState.processingQueueCount -= feedEntities.length;
  }

  // ========================
  // Delete
  // ========================
  async deleteFeed(name?: string, feed?: Feed) {
    this.stateStore.viewState.processingQueueCount += 1;
    try {
      await this.dbRepository.deleteFeed(true, feed, name);
    } catch (e) {
      console.error(e);
      this.stateStore.logState.alertLog = `Failed to remove feed  ${name} ${feed}`;
    }
    this.stateStore.viewState.processingQueueCount -= 1;
  }

  // ========================
  // Routine Task
  // ========================
  async routineRefresh() {
    this.stateStore.logState.processLog = "Routine feed refreshing...";
    this.stateStore.viewState.processingQueueCount += 1;
    try {
      this.preference.set("lastFeedRefreshTime", Math.round(Date.now() / 1000));
      const feeds = await this.dbRepository.feeds("name", "desc");
      await this.refresh(feeds.map((feed) => feed.name));
      await this.dbRepository.deleteOutdatedFeedEntities();
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Routine feed refreshing failed: ${
        error as string
      }`;
    }
    this.stateStore.viewState.processingQueueCount -= 1;
  }

  setupRoutineRefreshScheduler() {
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
