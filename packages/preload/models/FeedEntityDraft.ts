import { ObjectId } from "bson";
import { FeedEntity } from "./FeedEntity";
import { FeedDraft } from "./FeedDraft";
import { PaperEntity } from "./PaperEntity";
import { PaperEntityDraft } from "./PaperEntityDraft";

export class FeedEntityDraft {
  _id: ObjectId | string = "";
  id: ObjectId | string = "";
  _partition = "";
  addTime: Date = new Date();

  feed: FeedDraft = new FeedDraft();
  feedTime: Date = new Date();

  title = "";
  authors = "";
  abstract = "";
  publication = "";
  pubTime = "";
  pubType = 0;
  doi = "";
  arxiv = "";
  mainURL = "";
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

  initialize(feedEntity: FeedEntity | FeedEntityDraft) {
    this._id = feedEntity._id;
    this.id = feedEntity.id;
    this._partition = feedEntity._partition;
    this.addTime = feedEntity.addTime;
    this.feed.initialize(feedEntity.feed);
    this.feedTime = feedEntity.feedTime;
    this.title = feedEntity.title;
    this.authors = feedEntity.authors;
    this.abstract = feedEntity.abstract;
    this.publication = feedEntity.publication;
    this.pubTime = feedEntity.pubTime;
    this.pubType = feedEntity.pubType;
    this.doi = feedEntity.doi;
    this.arxiv = feedEntity.arxiv;
    this.mainURL = feedEntity.mainURL;
    this.pages = feedEntity.pages;
    this.volume = feedEntity.volume;
    this.number = feedEntity.number;
    this.publisher = feedEntity.publisher;
    this.read = feedEntity.read;
  }

  create(): FeedEntity {
    const id = this._id ? new ObjectId(this._id) : new ObjectId();
    this._id = id.toString();
    this.id = id.toString();

    const feedEntity = {
      _id: id,
      id: id,
      _partition: this._partition,
      addTime: this.addTime,
      feed: this.feed.create(),
      feedTime: this.feedTime,
      title: this.title,
      authors: this.authors,
      abstract: this.abstract,
      publication: this.publication,
      pubTime: this.pubTime,
      pubType: this.pubType,
      doi: this.doi,
      arxiv: this.arxiv,
      mainURL: this.mainURL,
      pages: this.pages,
      volume: this.volume,
      number: this.number,
      publisher: this.publisher,
      read: this.read,
    };
    return feedEntity;
  }

  setValue(key: string, value: unknown, allowEmpty = false) {
    if ((value || allowEmpty) && value !== "undefined") {
      this[key] = value;
    }
  }

  fromPaper(entity: PaperEntity | PaperEntityDraft) {
    this.title = entity.title;
    this.authors = entity.authors;
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
  }
}
