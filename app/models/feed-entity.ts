import { ObjectId } from "bson";

import { Feed } from "./feed";

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

  _id: ObjectId | string = "";
  id: ObjectId | string = "";
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

  constructor(initObjectId = false) {
    if (initObjectId) {
      this._id = new ObjectId();
      this.id = this._id;
    }
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
