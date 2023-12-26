import { ObjectId } from "bson";

import { Feed } from "./feed";
import { PaperEntity } from "./paper-entity";

export class FeedEntity {
  static schema = {
    name: "FeedEntity",
    primaryKey: "_id",
    properties: {
      id: "objectId",
      _id: "objectId",
      _partition: "string?",
      addTime: "date",

      feed: "Feed",
      feedTime: "date",

      title: "string",
      authors: "string",
      abstract: "string",
      publication: "string",
      pubTime: "string",
      pubType: "int",
      doi: "string",
      arxiv: "string",
      mainURL: "string",
      pages: "string",
      volume: "string",
      number: "string",
      publisher: "string",
      read: "bool",
    },
  };

  _id: OID = "";
  id: OID = "";
  _partition: string = "";
  addTime: Date = new Date();
  feed: Feed = new Feed();
  feedTime: Date = new Date();
  title: string = "";
  authors: string = "";
  abstract: string = "";
  publication: string = "";
  pubTime: string = "";
  pubType: number = 0;
  doi: string = "";
  arxiv: string = "";
  mainURL: string = "";
  pages: string = "";
  volume: string = "";
  number: string = "";
  publisher: string = "";
  read: boolean = false;

  [Key: string]: unknown;

  constructor(initObjectId = false) {
    if (initObjectId) {
      this._id = new ObjectId();
      this.id = this._id;
    }
  }

  initialize(entity: FeedEntity) {
    this._id = new ObjectId(entity._id);
    this.id = new ObjectId(entity.id);
    this._partition = entity._partition;
    this.addTime = entity.addTime;
    this.feed = entity.feed;
    this.feedTime = entity.feedTime;
    this.title = entity.title;
    this.authors = entity.authors;
    this.abstract = entity.abstract;
    this.publication = entity.publication;
    this.pubTime = entity.pubTime;
    this.pubType = entity.pubType;
    this.doi = entity.doi;
    this.arxiv = entity.arxiv;
    this.mainURL = entity.mainURL;
    this.pages = entity.pages;
    this.volume = entity.volume;
    this.number = entity.number;
    this.publisher = entity.publisher;
    this.read = entity.read;

    return this;
  }

  setValue(key: string, value: unknown, allowEmpty = false) {
    if ((value || allowEmpty) && value !== "undefined") {
      this[key] = value;
    }
  }

  fromPaper(paperEntity: PaperEntity) {
    this.title = paperEntity.title;
    this.authors = paperEntity.authors;
    this.publication = paperEntity.publication;
    this.pubTime = paperEntity.pubTime;
    this.pubType = paperEntity.pubType;
    this.doi = paperEntity.doi;
    this.arxiv = paperEntity.arxiv;
    this.mainURL = paperEntity.mainURL;
    this.pages = paperEntity.pages;
    this.volume = paperEntity.volume;
    this.number = paperEntity.number;
    this.publisher = paperEntity.publisher;
  }

  // =====================
  // Dev Functions
  // =====================

  dummyFill() {
    this.title = `Feed ${this._id}`;
    this.authors = "author1, author2, author3";
    this.publication =
      Math.random() > 0.5
        ? "Dummy Publication Journal Conference Proceedings Long Text Test Good Nice"
        : "Dummy Publication Journal Short";
    this.abstract =
      "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
    this.pubTime = `${2020 + Math.floor(Math.random() * 10)}`;
    this.pubType = Math.floor(Math.random() * 3);
    this.doi = "";
    this.arxiv = "";
    this.mainURL = "";
    this.read = Math.random() > 0.5;
    this.pages = "1-1";
    this.volume = "1";
    this.number = "1";
    this.publisher = "Dummy Publisher";
    this.feed = new Feed(true);
    return this;
  }
}
