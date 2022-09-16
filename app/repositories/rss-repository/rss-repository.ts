import Parser from "rss-parser";

import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

export class RSSRepository {
  stateStore: MainRendererStateStore;
  preference: Preference;

  parser: Parser;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;

    this.parser = new Parser();
  }

  async fetch(feed: Feed): Promise<FeedEntity[]> {
    const items = (await this.parser.parseURL(feed.url)).items;
    let feedEntityDrafts = [];
    for (const item of items) {
      const feedEntityDraft = new FeedEntity(true);
      feedEntityDraft.feed = feed;
      feedEntityDraft.setValue("title", item.title);
      feedEntityDraft.setValue("mainURL", item.link);
      feedEntityDraft.setValue("authors", item.author);
      if (item.summary) {
        feedEntityDraft.setValue("abstract", item.summary);
      }
      if (item.contentSnippet) {
        feedEntityDraft.setValue("abstract", item.contentSnippet);
      }
      feedEntityDraft.setValue(
        "feedTime",
        new Date(item.isoDate ? item.isoDate : new Date())
      );

      if (item.link && item.link.includes("arxiv")) {
        const arxivIds = item.link.match(
          new RegExp(
            "(\\d{4}.\\d{4,5}|[a-z\\-] (\\.[A-Z]{2})?\\/\\d{7})(v\\d )?",
            "g"
          )
        );
        if (arxivIds) {
          feedEntityDraft.setValue("arxiv", arxivIds[0]);
        }
      }

      if (item.id && item.id.includes("arxiv")) {
        const arxivIds = item.id.match(
          new RegExp(
            "(\\d{4}.\\d{4,5}|[a-z\\-] (\\.[A-Z]{2})?\\/\\d{7})(v\\d )?",
            "g"
          )
        );
        if (arxivIds) {
          feedEntityDraft.setValue("arxiv", arxivIds[0]);
        }
      }
      feedEntityDrafts.push(feedEntityDraft);
    }
    return feedEntityDrafts;
  }
}
