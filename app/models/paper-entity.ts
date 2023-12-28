import { ObjectId } from "bson";
import Mathml2latex from "mathml-to-latex";

import { ICategorizerDraft, PaperFolder, PaperTag } from "./categorizer";
import { FeedEntity } from "./feed-entity";
import { OID } from "./id";

export interface IPaperEntityDraft {
  _id?: OID;
  id?: OID;
  _partition?: string;
  addTime?: Date;
  title?: string;
  authors?: string;
  publication?: string;
  pubTime?: string;
  pubType?: number;
  doi?: string;
  arxiv?: string;
  mainURL?: string;
  supURLs?: string[];
  rating?: number;
  tags?: ICategorizerDraft[];
  folders?: ICategorizerDraft[];
  flag?: boolean;
  note?: string;
  codes?: string[];
  pages?: string;
  volume?: string;
  number?: string;
  publisher?: string;
}

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

  _id: OID;
  id: OID;
  _partition: string;
  addTime: Date;
  title: string;
  authors: string;
  publication: string;
  pubTime: string;
  pubType: number;
  doi: string;
  arxiv: string;
  mainURL: string;
  supURLs: string[];
  rating: number;
  tags: PaperTag[];
  folders: PaperFolder[];
  flag: boolean;
  note: string;
  codes: string[];
  pages: string;
  volume: string;
  number: string;
  publisher: string;

  constructor(object?: IPaperEntityDraft, initObjectId = false) {
    this._id = object?._id ? new ObjectId(object._id) : "";
    this.id = object?._id ? new ObjectId(object._id) : "";
    this.id = this.id ? this.id : this._id;
    this._id = this._id ? this._id : this.id;

    this._partition = object?._partition || "";
    this.addTime = object?.addTime || new Date();
    this.title = object?.title || "";
    this.authors = object?.authors || "";
    this.publication = object?.publication || "";
    this.pubTime = object?.pubTime || "";
    this.pubType = object?.pubType || 0;
    this.doi = object?.doi || "";
    this.arxiv = object?.arxiv || "";
    this.mainURL = object?.mainURL || "";
    this.supURLs = object?.supURLs?.map((url) => url) || [];
    this.rating = object?.rating || 0;
    this.tags = object?.tags?.map((tag) => new PaperTag(tag, false)) || [];
    this.folders =
      object?.folders?.map((folder) => new PaperFolder(folder, false)) || [];
    this.flag = object?.flag || false;
    this.note = object?.note || "";
    this.codes = object?.codes?.map((code) => code) || [];
    this.pages = object?.pages || "";
    this.volume = object?.volume || "";
    this.number = object?.number || "";
    this.publisher = object?.publisher || "";

    if (initObjectId) {
      this._id = new ObjectId();
      this.id = this._id;
    }

    return new Proxy(this, {
      set: (target, prop, value) => {
        if (prop === "title") {
          target.setValue("title", value, true);
        } else if ((prop === "_id" || prop === "id") && value) {
          this._id = new ObjectId(value);
          this.id = this._id;
        } else {
          target[prop] = value;
        }

        return true;
      },
    });
  }

  setValue(key: keyof PaperEntity, value: unknown, format = false) {
    // Format the value
    if (format && value) {
      // Check if contains Mathml
      const mathmlRegex1 = /<math\b[^>]*>([\s\S]*?)<\/math>/gm;
      const mathmlRegex2 = /<mml:math\b[^>]*>([\s\S]*?)<\/mml:math>/gm;
      const mathmlRegex3 = /<mrow\b[^>]*>([\s\S]*?)<\/mrow>/gm;

      for (const regex of [mathmlRegex1, mathmlRegex2, mathmlRegex3]) {
        if (regex.test(value as string)) {
          const mathmls = (value as string).match(regex);
          if (mathmls) {
            for (const mathml of mathmls) {
              const latex = Mathml2latex.convert(mathml.replaceAll("mml:", ""));
              value = (value as string).replace(mathml, "$" + latex + "$");
            }
          }
        }
      }
    }
    this[key as any] = value;
  }

  initialize(object: IPaperEntityDraft) {
    this._id = object._id ? new ObjectId(object._id) : "";
    this.id = object._id ? new ObjectId(object._id) : "";
    this.id = this.id ? this.id : this._id;
    this._id = this._id ? this._id : this.id;

    this._partition = object._partition || "";
    this.addTime = object.addTime || new Date();
    this.title = object.title || "";
    this.authors = object.authors || "";
    this.publication = object.publication || "";
    this.pubTime = object.pubTime || "";
    this.pubType = object.pubType || 0;
    this.doi = object.doi || "";
    this.arxiv = object.arxiv || "";
    this.mainURL = object.mainURL || "";
    this.supURLs = object.supURLs || [];
    this.rating = object.rating || 0;
    this.tags = object.tags?.map((tag) => new PaperTag(tag, false)) || [];
    this.folders =
      object.folders?.map((folder) => new PaperFolder(folder, false)) || [];
    this.flag = object.flag || false;
    this.note = object.note || "";
    this.codes = object.codes || [];
    this.pages = object.pages || "";
    this.volume = object.volume || "";
    this.number = object.number || "";
    this.publisher = object.publisher || "";

    return this;
  }

  fromFeed(feedEntity: FeedEntity) {
    this.title = feedEntity.title;
    this.authors = feedEntity.authors;
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
    return this;
  }
}
