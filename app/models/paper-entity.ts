import { ObjectId } from "bson";

import { PaperFolder, PaperTag } from "./categorizer";

export class PaperEntity {
  static schema = {
    name: "PaperEntity",
    primaryKey: "_id",
    properties: {
      id: "objectId",
      _id: "objectId",
      _partition: "string?",
      addTime: "date",

      title: "string",
      authors: "string",
      publication: "string",
      pubTime: "string",
      pubType: "int",
      doi: "string",
      arxiv: "string",
      mainURL: "string",
      supURLs: {
        type: "list",
        objectType: "string",
      },
      rating: "int",
      tags: {
        type: "list",
        objectType: "PaperTag",
      },
      folders: {
        type: "list",
        objectType: "PaperFolder",
      },
      flag: "bool",
      note: "string",
      codes: {
        type: "list",
        objectType: "string",
      },
      pages: "string",
      volume: "string",
      number: "string",
      publisher: "string",
    },
  };

  _id: ObjectId | string = "";
  id: ObjectId | string = "";
  _partition: string = "";
  addTime: Date = new Date();
  title: string = "";
  authors: string = "";
  publication: string = "";
  pubTime: string = "";
  pubType: number = 0;
  doi: string = "";
  arxiv: string = "";
  mainURL: string = "";
  supURLs: string[] = [];
  rating: number = 0;
  tags: PaperTag[] = [];
  folders: PaperFolder[] = [];
  flag: boolean = false;
  note: string = "";
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

  setValue(key: string, value: unknown, allowEmpty = false) {
    if ((value || allowEmpty) && value !== "undefined") {
      this[key] = value;
    }
  }

  initialize(entity: PaperEntity) {
    this._id = new ObjectId(entity._id);
    this.id = new ObjectId(entity.id);
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
    this.supURLs = JSON.parse(JSON.stringify(entity.supURLs));
    this.rating = entity.rating;
    this.tags = entity.tags.map((tag) => new PaperTag("", 0).initialize(tag));
    this.folders = entity.folders.map((folder) =>
      new PaperFolder("", 0).initialize(folder)
    );
    this.flag = entity.flag;
    this.note = entity.note;
    this.codes = JSON.parse(JSON.stringify(entity.codes));
    this.pages = entity.pages;
    this.volume = entity.volume;
    this.number = entity.number;
    this.publisher = entity.publisher;

    return this;
  }

  // =====================
  // Dev Functions
  // =====================

  dummyFill() {
    this.title = `Paper ${this._id}`;
    this.authors = "author1, author2, author3";
    this.publication =
      Math.random() > 0.5
        ? "Dummy Publication Journal Conference Proceedings Long Text Test Good Nice"
        : "Dummy Publication Journal Short";
    this.pubTime = `${2020 + Math.floor(Math.random() * 10)}`;
    this.pubType = Math.floor(Math.random() * 3);
    this.doi = "";
    this.arxiv = "";
    this.mainURL = "";
    this.supURLs = ["https://www.google.com"];
    this.rating = Math.floor(Math.random() * 5);
    this.tags = [];
    this.folders = [];
    this.flag = Math.random() > 0.5;
    this.note =
      "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec";
    this.codes = [
      JSON.stringify({ url: "www.google.com", isOfficial: true }),
      JSON.stringify({ url: "www.apple.com", isOfficial: false }),
    ];
    this.pages = "1-1";
    this.volume = "1";
    this.number = "1";
    this.publisher = "Dummy Publisher";
    return this;
  }
}
