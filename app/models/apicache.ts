import { ObjectId } from "bson";

import { PaperEntity } from "./paper-entity";

export class APICache {
  _id: ObjectId | string = "";
  _partition: string = "";
  addTime: Date = new Date();

  title: string = "";
  minifiedtitle: string = "";
  authors: string = "";
  publication: string = "";
  pubTime: string = "";
  pubType: number = 0;
  doi: string = "";
  arxiv: string = "";
  pages: string = "";
  volume: string = "";
  number: string = "";
  publisher: string = "";
  source: string = "";
  hits: number = 0;
  permission = 1;

  [Key: string]: unknown;

  constructor(initObjectId = false) {
    if (initObjectId) {
      this._id = new ObjectId();
      this.id = this._id;
    }
  }

  setValue(key: string, value: unknown, allowEmpty = false) {
    if ((value || allowEmpty) && value !== "undefined") {
      this[key] = value;
    }
  }

  initialize(entity: PaperEntity, source: string) {
    this._id = new ObjectId(entity._id);
    this.addTime = new Date();
    this.title = entity.title;
    this.minifiedtitle = this.title
      .toLowerCase()
      .replaceAll(/[^\p{L}]/gu, "");
    this.authors = entity.authors;
    this.publication = entity.publication;
    this.pubTime = entity.pubTime;
    this.pubType = entity.pubType;
    this.doi = entity.doi;
    this.arxiv = entity.arxiv ? "arxiv:" + entity.arxiv.toLowerCase().replaceAll("arxiv:", "") : "";
    this.pages = entity.pages;
    this.volume = entity.volume;
    this.number = entity.number;
    this.publisher = entity.publisher;

    this.source = source;

    return this;
  }
}
