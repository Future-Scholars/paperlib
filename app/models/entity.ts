import { ObjectId } from "bson";
import Mathml2latex from "mathml-to-latex";
import Realm, { List, Results } from "realm";

import { ICategorizerDraft, PaperFolder, PaperTag } from "./categorizer";
import { Feed, IFeedDraft } from "./feed";
import { OID } from "./id";
import { ISupplementary, Supplementary } from "./supplementary";

export type EntityType =
  | "article"
  | "book"
  | "booklet"
  | "inbook"
  | "incollection"
  | "inproceedings"
  | "manual"
  | "mastersthesis"
  | "misc"
  | "phdthesis"
  | "proceedings"
  | "techreport";

export interface IEntity {
  // General
  _id: OID;
  _partition?: string; // deprecated, for old realm cloud only, will be removed in the future
  addTime: Date;
  library: string;
  type: EntityType;
  abstract?: string;
  defaultSup?: string;
  supplementaries: Record<string, ISupplementary>;

  // Identifiers
  doi?: string;
  arxiv?: string;
  issn?: string;
  isbn?: string;

  // Bibtex
  title: string;
  authors: string;
  journal?: string;
  booktitle?: string;
  year: string;
  month?: string;
  volume?: string;
  number?: string;
  pages?: string;
  publisher?: string;
  series?: string;
  edition?: string;
  editor?: string;
  howpublished?: string;
  organization?: string;
  school?: string;
  institution?: string;
  address?: string;

  // For papers
  rating?: number;
  tags: ICategorizerDraft[];
  folders: ICategorizerDraft[];
  flag?: boolean;
  note?: string;

  // For feed entities
  read?: boolean;
  feed?: IFeedDraft;
}

export class Entity implements IEntity {
  static schema = {
    name: "Entity",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      _partition: "string?", // deprecated, for old realm cloud only, will be removed in the future
      addTime: "date",
      library: "string",
      type: "string",
      abstract: "string?",
      defaultSup: "string?",
      supplementaries: "Supplementary{}",
      doi: "string?",
      arxiv: "string?",
      issn: "string?",
      isbn: "string?",

      title: "string",
      authors: "string",
      journal: "string?",
      booktitle: "string?",
      year: "string",
      month: "string?",
      volume: "string?",
      number: "string?",
      pages: "string?",
      publisher: "string?",
      series: "string?",
      edition: "string?",
      editor: "string?",
      howpublished: "string?",
      organization: "string?",
      school: "string?",
      institution: "string?",
      address: "string?",

      rating: "int?",
      tags: {
        type: "list",
        objectType: "PaperTag",
      },
      folders: {
        type: "list",
        objectType: "PaperFolder",
      },
      flag: "bool?",
      note: "string?",

      read: "bool?",
      feed: "Feed?",
    },
  };

  _id!: OID;
  _partition?: string; // deprecated, for old realm cloud only, will be removed in the future
  addTime!: Date;
  library!: string;
  type!: EntityType;
  abstract?: string;
  defaultSup?: string;
  supplementaries!: Record<string, Supplementary>;
  doi?: string;
  arxiv?: string;
  issn?: string;
  isbn?: string;
  title!: string;
  authors!: string;
  journal?: string;
  booktitle?: string;
  year!: string;
  month?: string;
  volume?: string;
  number?: string;
  pages?: string;
  publisher?: string;
  series?: string;
  edition?: string;
  editor?: string;
  howpublished?: string;
  organization?: string;
  school?: string;
  institution?: string;
  address?: string;
  rating?: number;
  tags!: PaperTag[];
  folders!: PaperFolder[];
  flag?: boolean;
  note?: string;
  read?: boolean;
  feed?: Feed;

  constructor(object?: Partial<IEntity>, initObjectId = false) {
    this.initialize(object || {}, initObjectId);

    return new Proxy(this, {
      set: (target, prop, value) => {
        if (prop === "title") {
          target.setValue("title", value, true);
        } else if ((prop === "_id") && value) {
          this._id = new ObjectId(value);
        } else {
          target[prop] = value;
        }

        return true;
      },
    });
  }

  setValue(key: keyof Entity, value: unknown, format = false) {
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

  initialize(object: Partial<IEntity>, initObjectId = true) {
    this._id = object?._id ? new ObjectId(object._id) : "";
    this._partition = object?._partition; // deprecated, for old realm cloud only, will be removed in the future
    this.addTime = object?.addTime || new Date();
    this.library = object?.library || "main";
    this.type = object?.type || "article";
    this.abstract = object?.abstract;
    this.defaultSup = object?.defaultSup
      ? object.defaultSup
      : undefined;
    this.supplementaries = object?.supplementaries
      ? Object.entries(object.supplementaries).reduce(
          (acc, [key, value]) => {
            acc[key] = new Supplementary(value);
            return acc;
          },
          {} as Record<string, Supplementary>
        ) : {};

    this.doi = object?.doi;
    this.arxiv = object?.arxiv;
    this.issn = object?.issn;
    this.isbn = object?.isbn;

    this.title = object?.title || "";
    this.authors = object?.authors || "";
    this.journal = object?.journal;
    this.booktitle = object?.booktitle;
    this.year = object?.year || "";
    this.month = object?.month;
    this.volume = object?.volume;
    this.number = object?.number;
    this.pages = object?.pages;
    this.publisher = object?.publisher;
    this.series = object?.series;
    this.edition = object?.edition;
    this.editor = object?.editor;
    this.howpublished = object?.howpublished;
    this.organization = object?.organization;
    this.school = object?.school;
    this.institution = object?.institution;
    this.address = object?.address;

    this.rating = object?.rating;
    this.tags = object?.tags?.map((tag) => new PaperTag(tag, false)) || [];
    this.folders =
      object?.folders?.map((folder) => new PaperFolder(folder, false)) || [];
    this.flag = object?.flag;
    this.note = object?.note;

    this.read = object?.read;
    this.feed = object?.feed ? new Feed(object.feed, false) : undefined;

    if (initObjectId) {
      this._id = new ObjectId();
    }

    return this;
  }
}

export type IEntityRealmObject = Entity &
  Realm.Object<
    Entity,
    | "_id"
    | "_partition"
    | "addTime"
    | "library"
    | "type"
    | "abstract"
    | "defaultSup"
    | "supplementaries"
    | "doi"
    | "arxiv"
    | "issn"
    | "isbn"
    | "title"
    | "authors"
    | "journal"
    | "booktitle"
    | "year"
    | "month"
    | "volume"
    | "number"
    | "pages"
    | "publisher"
    | "series"
    | "edition"
    | "editor"
    | "howpublished"
    | "organization"
    | "school"
    | "institution"
    | "address"
    | "rating"
    | "tags"
    | "folders"
    | "flag"
    | "note"
    | "read"
    | "feed"
  >;

export type IEntityObject = Entity | IEntityRealmObject;

export type IEntityCollection =
  | Results<IEntityObject>
  | List<IEntityObject>
  | Array<IEntityObject>;
