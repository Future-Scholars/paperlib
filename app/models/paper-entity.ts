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
    this.title = `Paper ${this._id}`;
    this.authors = "author1, author2, author3";
    this.publication = "Dummy Publication";
    this.pubTime = `${2020 + Math.floor(Math.random() * 10)}`;
    this.pubType = Math.floor(Math.random() * 3);
    this.doi = "";
    this.arxiv = "";
    this.mainURL = "";
    this.supURLs = ["https://www.google.com"];
    this.rating = Math.floor(Math.random() * 5);
    this.tags = [];
    this.folders = [];
    this.flag = false;
    this.note = "Dummy Note";
    this.codes = ["https://www.google.com", "https://www.apple.com"];
    this.pages = "1-1";
    this.volume = "1";
    this.number = "1";
    this.publisher = "Dummy Publisher";
  }
}
