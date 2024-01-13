import { XMLParser } from "fast-xml-parser";

import { createDecorator } from "@/base/injection/injection";
import { INetworkTool, NetworkTool } from "@/base/network";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";

export const IRSSRepository = createDecorator("rssRepository");

export class RSSRepository {
  xmlParser: XMLParser;

  constructor(@INetworkTool private _networkTool: NetworkTool) {
    this.xmlParser = new XMLParser({ ignoreAttributes: false });
  }

  async fetch(feed: Feed): Promise<FeedEntity[]> {
    const response = await this._networkTool.get(
      feed.url,
      {},
      1,
      10000,
      false,
      true
    );

    let feedEntityDrafts = this.parse(response.body);

    feedEntityDrafts = feedEntityDrafts.map((feedEntityDraft) => {
      feedEntityDraft.feed = feed;
      return feedEntityDraft;
    });

    return feedEntityDrafts;
  }

  parse(rawResponse: string) {
    const parsedXML = this.xmlParser.parse(rawResponse);
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
      const feedEntityDraft = new FeedEntity({}, true);
      feedEntityDraft.title = item.title || "";
      feedEntityDraft.mainURL = item.link || "";

      if (item.authors) {
        feedEntityDraft.authors = `${item.authors}` || "";
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
        feedEntityDraft.authors = author || "";
      }
      const dcDescription = item["dc:description"] || "";
      const descriptionProps = item.description || {};
      // @ts-ignore
      const description = descriptionProps["#text"]
        ? descriptionProps["#text"]
        : `${item.description}`;
      feedEntityDraft.abstract =
        (dcDescription.length > description.length
          ? dcDescription
          : description) || "";

      feedEntityDraft.feedTime = new Date(item["dc:date"] || new Date());

      if (item["pubDate"]) {
        feedEntityDraft.pubTime = `${new Date(item["pubDate"]).getFullYear()}`;
      } else if (item["prism:coverDate"]) {
        feedEntityDraft.pubTime = `${new Date(
          item["prism:coverDate"]
        ).getFullYear()}`;
      }

      if (item.link && item.link.includes("arxiv")) {
        const arxivIds = item.link.match(
          new RegExp(
            "(\\d{4}.\\d{4,5}|[a-z\\-] (\\.[A-Z]{2})?\\/\\d{7})(v\\d )?",
            "g"
          )
        );
        if (arxivIds) {
          feedEntityDraft.arxiv = arxivIds[0] || "";
        }
        feedEntityDraft.publication = "arXiv";
        if (feedEntityDraft.pubTime === "") {
          feedEntityDraft.pubTime = `20${feedEntityDraft.arxiv.slice(0, 2)}`;
        }
      }

      feedEntityDraft.doi = item["prism:doi"] || "";
      feedEntityDraft.publication = item["prism:publicationName"] || "";
      feedEntityDraft.volume = `${item["prism:volume"]}`;
      feedEntityDraft.number = `${item["prism:number"]}`;

      feedEntityDrafts.push(feedEntityDraft);
    }

    return feedEntityDrafts;
  }

  parseAtomItems(items: AtomItem[]) {
    let feedEntityDrafts: FeedEntity[] = [];
    for (const item of items) {
      const feedEntityDraft = new FeedEntity();
      feedEntityDraft.title = item.title;

      if (Array.isArray(item.link)) {
        for (const [i, link] of item.link.entries()) {
          if (
            link["@_type"] === "application/pdf" ||
            i === item.link.length - 1
          ) {
            feedEntityDraft.mainURL = link["@_href"] || "";
          }
        }
      } else {
        feedEntityDraft.mainURL = item.link["@_href"] || "";
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
      feedEntityDraft.authors = author || "";

      feedEntityDraft.abstract = item.summary || "";

      feedEntityDraft.feedTime = new Date(item["updated"] || new Date());

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
          feedEntityDraft.arxiv = arxivIds[0];
        }
        feedEntityDraft.publication = "arXiv";
      }

      if (item["published"]) {
        feedEntityDraft.pubTime = `${new Date(
          item["published"]
        ).getFullYear()}`;
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
