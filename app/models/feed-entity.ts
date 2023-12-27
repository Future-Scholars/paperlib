import { ObjectId } from "bson";

import { Feed } from "./feed";
import { OID } from "./id";
import { PaperEntity } from "./paper-entity";

export interface IFeedEntityDraft {
  _id?: OID;
  id?: OID;
  _partition?: string;
  addTime?: Date;
  feed?: Feed;
  feedTime?: Date;
  title?: string;
  authors?: string;
  abstract?: string;
  publication?: string;
  pubTime?: string;
  pubType?: number;
  doi?: string;
  arxiv?: string;
  mainURL?: string;
  pages?: string;
  volume?: string;
  number?: string;
  publisher?: string;
  read?: boolean;
}

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

  _id: OID;
  id: OID;
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

  constructor(object?: IFeedEntityDraft, initObjectId = false) {
    this._id = object?._id ? new ObjectId(object?._id) : "";
    this.id = object?.id ? new ObjectId(object?.id) : "";
    this.id = this.id ? this.id : this._id;
    this._id = this._id ? this._id : this.id;

    this._partition = object?._partition || "";
    this.addTime = object?.addTime || new Date();
    this.feed = object?.feed || new Feed({}, initObjectId);
    this.feedTime = object?.feedTime || new Date();
    this.title = object?.title || "";
    this.authors = object?.authors || "";
    this.abstract = object?.abstract || "";
    this.publication = object?.publication || "";
    this.pubTime = object?.pubTime || "";
    this.pubType = object?.pubType || 0;
    this.doi = object?.doi || "";
    this.arxiv = object?.arxiv || "";
    this.mainURL = object?.mainURL || "";
    this.pages = object?.pages || "";
    this.volume = object?.volume || "";
    this.number = object?.number || "";
    this.publisher = object?.publisher || "";
    this.read = object?.read || false;

    if (initObjectId) {
      this._id = new ObjectId();
      this.id = this._id;
    }

    return new Proxy(this, {
      set: (target, prop, value) => {
        if ((prop === "_id" || prop === "id") && value) {
          this._id = new ObjectId(value);
          this.id = this._id;
        } else {
          target[prop] = value;
        }

        return true;
      },
    });
  }

  initialize(object: IFeedEntityDraft) {
    this._id = object._id ? new ObjectId(object._id) : "";
    this.id = object._id ? new ObjectId(object._id) : "";
    this.id = this.id ? this.id : this._id;
    this._id = this._id ? this._id : this.id;

    this._partition = object._partition || "";
    this.addTime = object.addTime || new Date();
    this.feed = object.feed || new Feed({}, true);
    this.feedTime = object.feedTime || new Date();
    this.title = object.title || "";
    this.authors = object.authors || "";
    this.abstract = object.abstract || "";
    this.publication = object.publication || "";
    this.pubTime = object.pubTime || "";
    this.pubType = object.pubType || 0;
    this.doi = object.doi || "";
    this.arxiv = object.arxiv || "";
    this.mainURL = object.mainURL || "";
    this.pages = object.pages || "";
    this.volume = object.volume || "";
    this.number = object.number || "";
    this.publisher = object.publisher || "";
    this.read = object.read || false;

    return this;
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
}
