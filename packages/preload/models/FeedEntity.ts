import { ObjectId } from "bson";

import { Feed } from "./Feed";
import { FeedDraft } from "./FeedDraft";

export const FeedEntitySchema = {
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

export interface FeedEntity {
  _id: ObjectId | string;
  id: ObjectId | string;
  _partition: string;
  addTime: Date;
  feed: Feed;
  feedTime: Date;
  title: string;
  authors: string;
  abstract: string;
  publication: string;
  pubTime: string;
  pubType: number;
  doi: string;
  arxiv: string;
  mainURL: string;
  pages: string;
  volume: string;
  number: string;
  publisher: string;
  read: boolean;

  [Key: string]: unknown;
}

export const FeedEntityPlaceholder = {
  _id: "",
  id: "",
  _partition: "",
  feed: new FeedDraft(),
  title: "",
  authors: "",
  publication: "",
  abstract: "",
  pubTime: "",
  pubType: 0,
  doi: "",
  arxiv: "",
  mainURL: "",
  pages: "",
  volume: "",
  number: "",
  publisher: "",
  read: false,
};
