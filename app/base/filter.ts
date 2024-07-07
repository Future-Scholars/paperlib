import { OID } from "@/models/id";
import { formatString } from "./string";

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

export interface IPaperFilterOptions {
  search?: string;
  searchMode?: "general" | "fulltext" | "advanced";
  flaged?: boolean;
  tag?: string;
  folder?: string;
  limit?: number;
}

export class PaperFilterOptions implements IPaperFilterOptions {
  public filters: string[] = [];
  public search?: string;
  public searchMode?: "general" | "fulltext" | "advanced";
  public flaged?: boolean;
  public tag?: string;
  public folder?: string;
  public limit?: number;

  constructor(options?: Partial<IPaperFilterOptions>) {
    if (options) {
      this.update(options);
    }
  }

  update(options: Partial<IPaperFilterOptions>) {
    for (const key in options) {
      this[key] = options[key];
    }

    this.filters = [];

    if (this.search) {
      let formatedSearch = formatString({
        str: this.search,
        removeNewline: true,
        trimWhite: true,
      });

      if (!this.searchMode || this.searchMode === "general") {
        const fuzzyFormatedSearch = `*${formatedSearch
          .trim()
          .split(" ")
          .join("*")}*`;
        this.filters.push(
          `(title LIKE[c] \"${fuzzyFormatedSearch}\" OR authors LIKE[c] \"${fuzzyFormatedSearch}\" OR publication LIKE[c] \"${fuzzyFormatedSearch}\" OR note LIKE[c] \"${fuzzyFormatedSearch}\")`
        );
      } else if (this.searchMode === "advanced") {
        formatedSearch = PaperFilterOptions.parseDateFilter(formatedSearch);
        this.filters.push(formatedSearch);
      } else if (this.searchMode === "fulltext") {
        this.filters.push(`(fulltext contains[c] \"${formatedSearch}\")`);
      }
    }

    if (this.flaged) {
      this.filters.push(`(flag == true)`);
    }
    if (this.tag) {
      this.filters.push(`(ANY tags.name == \"${this.tag}\")`);
    }
    if (this.folder) {
      this.filters.push(`(ANY folders.name == \"${this.folder}\")`);
    }
  }

  static checkIsDateFilter(dateFilter: string) {
    return dateFilter.match(/(<|<=|>|>=)\s*\[\d+ DAYS\]/g);
  }

  static parseDateFilter(dateFilter: string) {
    const compareDateMatch = dateFilter.match(/(<|<=|>|>=)\s*\[\d+ DAYS\]/g);
    if (compareDateMatch) {
      for (const match of compareDateMatch) {
        if (dateFilter.includes("<")) {
          dateFilter = dateFilter.replaceAll(match, match.replaceAll("<", ">"));
        } else if (dateFilter.includes(">")) {
          dateFilter = dateFilter.replaceAll(match, match.replaceAll(">", "<"));
        }
      }
    }

    // Replace Date string
    const dateRegex = /\[\d+ DAYS\]/g;
    const dateMatch = dateFilter.match(dateRegex);
    if (dateMatch) {
      const date = new Date();
      // replace with date like: 2021-02-20@17:30:15:00
      date.setDate(date.getDate() - parseInt(dateMatch[0].slice(1, -6)));
      dateFilter = dateFilter.replace(
        dateRegex,
        date.toISOString().slice(0, -5).replace("T", "@")
      );
    }

    return dateFilter;
  }

  toString() {
    const filterStr = this.filters.join(" AND ");
    if (this.limit) {
      return `${filterStr} LIMIT(${this.limit})`;
    } else {
      return filterStr;
    }
  }
}
