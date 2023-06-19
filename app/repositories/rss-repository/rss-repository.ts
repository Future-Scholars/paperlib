import { XMLParser } from "fast-xml-parser";
import { Response } from "got";

import { createDecorator } from "@/base/injection/injection";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

export const IRSSRepository = createDecorator("rssRepository");

export class RSSRepository {
  stateStore: MainRendererStateStore;
  preference: Preference;

  xmlParser: XMLParser;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;
    this.xmlParser = new XMLParser({ ignoreAttributes: false });
  }

  async fetch(feed: Feed): Promise<FeedEntity[]> {
    const response = (await window.networkTool.get(
      feed.url
    )) as Response<string>;

    let feedEntityDrafts = this.parse(response);

    feedEntityDrafts = feedEntityDrafts.map((feedEntityDraft) => {
      feedEntityDraft.feed = feed;
      return feedEntityDraft;
    });

    return feedEntityDrafts;
  }

  parse(rawResponse: Response<string>) {
    const parsedXML = this.xmlParser.parse(rawResponse.body);
    if (parsedXML["rdf:RDF"]) {
      return this.parseRSSItems((parsedXML as RSS1)["rdf:RDF"].item);
    } else if (parsedXML.rss) {
      return this.parseRSSItems((parsedXML as RSS2).rss.channel.item);
    } else if (parsedXML.feed) {
      return this.parseAtomItems((parsedXML as Atom).feed.entry);
    } else {
      return [];
    }
  }

  parseRSSItems(items: RSSItem[]) {
    let feedEntityDrafts: FeedEntity[] = [];
    for (const item of items) {
      const feedEntityDraft = new FeedEntity(true);
      feedEntityDraft.setValue("title", item.title, false);
      feedEntityDraft.setValue("mainURL", item.link, false);

      if (item.authors) {
        feedEntityDraft.setValue("authors", `${item.authors}`, false);
      } else {
        let rawAuthor = item["dc:creator"];
        let author;
        if (rawAuthor && Array.isArray(rawAuthor)) {
          author = (rawAuthor as string[])
            .join(", ")
            .replaceAll(/<[^>]*>/g, "");
        } else {
          author =
            (item["dc:creator"] as string)?.replaceAll(/<[^>]*>/g, "") || "";
        }
        feedEntityDraft.setValue("authors", author, false);
      }
      const dcDescription = item["dc:description"] || "";
      const descriptionProps = item.description || {};
      // @ts-ignore
      const description = descriptionProps["#text"]
        ? descriptionProps["#text"]
        : `${item.description}`;
      feedEntityDraft.setValue(
        "abstract",
        dcDescription.length > description.length ? dcDescription : description,
        false
      );

      feedEntityDraft.setValue(
        "feedTime",
        new Date(item["dc:date"] || new Date())
      );

      if (item["pubDate"]) {
        feedEntityDraft.setValue(
          "pubTime",
          `${new Date(item["pubDate"]).getFullYear()}`
        );
      } else if (item["prism:coverDate"]) {
        feedEntityDraft.setValue(
          "pubTime",
          `${new Date(item["prism:coverDate"]).getFullYear()}`
        );
      }

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
        feedEntityDraft.setValue("publication", "arXiv", false);
        if (feedEntityDraft.pubTime === "") {
          feedEntityDraft.setValue(
            "pubTime",
            `20${feedEntityDraft.arxiv.slice(0, 2)}`
          );
        }
      }

      feedEntityDraft.setValue("doi", item["prism:doi"], false);
      feedEntityDraft.setValue(
        "publication",
        item["prism:publicationName"],
        false
      );
      feedEntityDraft.setValue("volume", `${item["prism:volume"]}`, false);
      feedEntityDraft.setValue("number", `${item["prism:number"]}`, false);

      feedEntityDrafts.push(feedEntityDraft);
    }

    return feedEntityDrafts;
  }

  parseAtomItems(items: AtomItem[]) {
    let feedEntityDrafts: FeedEntity[] = [];
    for (const item of items) {
      const feedEntityDraft = new FeedEntity(true);
      feedEntityDraft.setValue("title", item.title, false);

      if (Array.isArray(item.link)) {
        for (const [i, link] of item.link.entries()) {
          if (
            link["@_type"] === "application/pdf" ||
            i === item.link.length - 1
          ) {
            feedEntityDraft.setValue("mainURL", link["@_href"], false);
          }
        }
      } else {
        feedEntityDraft.setValue("mainURL", item.link["@_href"], false);
      }

      let rawAuthor = item.author;
      let author;
      if (rawAuthor && Array.isArray(rawAuthor)) {
        author = rawAuthor
          .map((a) => a.name)
          .join(", ")
          .replaceAll(/<[^>]*>/g, "");
      } else {
        author = rawAuthor?.name?.replaceAll(/<[^>]*>/g, "") || "";
      }
      feedEntityDraft.setValue("authors", author, false);

      feedEntityDraft.setValue("abstract", item.summary, false);

      feedEntityDraft.setValue(
        "feedTime",
        new Date(item["updated"] || new Date())
      );

      if (
        feedEntityDraft.mainURL &&
        feedEntityDraft.mainURL.includes("arxiv")
      ) {
        const arxivIds = feedEntityDraft.mainURL.match(
          new RegExp(
            "(\\d{4}.\\d{4,5}|[a-z\\-] (\\.[A-Z]{2})?\\/\\d{7})(v\\d )?",
            "g"
          )
        );
        if (arxivIds) {
          feedEntityDraft.setValue("arxiv", arxivIds[0]);
        }
        feedEntityDraft.setValue("publication", "arXiv", false);
      }

      if (item["published"]) {
        feedEntityDraft.setValue(
          "pubTime",
          `${new Date(item["published"]).getFullYear()}`
        );
      }
      feedEntityDrafts.push(feedEntityDraft);
    }

    return feedEntityDrafts;
  }
}

interface RSSItem {
  "dc:creator"?: string | string[];
  "dc:date"?: string;
  "dc:type"?: string;
  "dc:description"?: string;
  description?: string | { "#text": string; "@_rdf:parseType": string };
  link?: string;
  "prism:coverDate"?: string;
  "prism:doi"?: string;
  "prism:number"?: number;
  "prism:publicationName"?: string;
  "prism:url"?: string;
  "prism:volume"?: number;
  title?: string;
  pubDate?: string;
  authors?: string;
}

interface AtomItem {
  author: { name: string }[] | { name: string };
  link:
    | { "@_href": string; "@_type": string }[]
    | { "@_href": string; "@_type": string };
  id: string;
  published: string;
  summary: string;
  title: string;
  updated: string;
}

interface RSS1 {
  "rdf:RDF": {
    item: RSSItem[];
  };
}

interface RSS2 {
  rss: {
    channel: {
      item: RSSItem[];
    };
  };
}

interface Atom {
  feed: {
    entry: AtomItem[];
  };
}
