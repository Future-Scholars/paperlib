import Parser from "rss-parser";

import { Preference, ScraperPreference } from "../../utils/preference";
import { SharedState } from "../../utils/appstate";
import { Feed } from "../../models/Feed";
import { FeedDraft } from "../../models/FeedDraft";
import { FeedEntity } from "../../models/FeedEntity";
import { FeedEntityDraft } from "../../models/FeedEntityDraft";

export class RSSRepository {
  sharedState: SharedState;
  preference: Preference;

  parser: Parser;

  constructor(sharedState: SharedState, preference: Preference) {
    this.sharedState = sharedState;
    this.preference = preference;

    this.parser = new Parser();
  }

  async parse(feed: Feed): Promise<FeedEntityDraft[]> {
    const items = (await this.parser.parseURL(feed.url)).items;
    let feedEntityDrafts = [];
    for (const item of items) {
      const feedEntityDraft = new FeedEntityDraft();
      feedEntityDraft.feed = new FeedDraft();
      feedEntityDraft.feed.initialize(feed);
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
