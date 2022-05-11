import { ObjectId } from "bson";
import { PaperEntity } from "./PaperEntity";

export class PaperEntityDraft {
  _id: ObjectId | string = "";
  id: ObjectId | string = "";
  _partition = "";
  addTime: Date = new Date();
  title = "";
  authors = "";
  publication = "";
  pubTime = "";
  pubType = 0;
  doi = "";
  arxiv = "";
  mainURL = "";
  supURLs: string[] = [];
  rating = 0;
  tags = "";
  folders = "";
  flag = false;
  note = "";
  codes: string[] = [];
  pages: string = "";
  volume: string = "";
  number: string = "";
  publisher: string = "";

  [Key: string]: unknown;

  constructor(initObjectId = false) {
    if (initObjectId) {
      this._id = new ObjectId();
      this.id = this._id;
    }
  }

  initialize(entity: PaperEntity | PaperEntityDraft) {
    this._id = entity._id;
    this.id = entity.id;
    this._partition = entity._partition;
    this.addTime = entity.addTime;
    this.title = entity.title;
    this.authors = entity.authors;
    this.publication = entity.publication;
    this.pubTime = entity.pubTime;
    this.pubType = entity.pubType;
    this.doi = entity.doi;
    this.arxiv = entity.arxiv;
    this.mainURL = entity.mainURL;
    this.supURLs = entity.supURLs;
    this.rating = entity.rating;
    if (typeof entity.tags === "string") {
      this.tags = entity.tags;
    } else {
      this.tags = entity.tags.map((tag) => tag.name).join("; ");
    }
    if (typeof entity.folders === "string") {
      this.folders = entity.folders;
    } else {
      this.folders = entity.folders.map((folder) => folder.name).join("; ");
    }
    this.flag = entity.flag;
    this.note = entity.note;
    this.codes = entity.codes;
    this.pages = entity.pages;
    this.volume = entity.volume;
    this.number = entity.number;
    this.publisher = entity.publisher;
  }

  create(): PaperEntity {
    const id = this._id ? new ObjectId(this._id) : new ObjectId();
    this._id = id.toString();
    this.id = id.toString();

    const entity = {
      _id: id,
      id: id,
      _partition: this._partition,
      addTime: this.addTime,
      title: this.title,
      authors: this.authors,
      publication: this.publication,
      pubTime: this.pubTime,
      pubType: this.pubType,
      doi: this.doi,
      arxiv: this.arxiv,
      mainURL: this.mainURL,
      supURLs: this.supURLs,
      rating: this.rating,
      tags: [],
      folders: [],
      flag: this.flag,
      note: this.note,
      codes: this.codes,
      pages: this.pages,
      volume: this.volume,
      number: this.number,
      publisher: this.publisher,
    };
    return entity;
  }

  setValue(key: string, value: unknown) {
    if (value && value !== "undefined") {
      this[key] = value;
    }
  }
}
