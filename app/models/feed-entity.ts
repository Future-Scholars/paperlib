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
}
