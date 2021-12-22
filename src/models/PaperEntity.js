import { ObjectId } from "bson";
import { formatString } from "../utils/misc";

export const PaperEntitySchema = {
  name: "PaperEntity",
  primaryKey: "id",
  properties: {
    id: "objectId",
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
  },
};

export class PaperEntityDraft {
  constructor(entity) {
    if (!entity) {
      this.id = new ObjectId();
      this.addTime = new Date();
      this.title = "";
      this.authors = "";
      this.publication = "";
      this.pubTime = "";
      this.pubType = 2;
      this.doi = "";
      this.arxiv = "";
      this.mainURL = "";
      this.supURLs = [];
      this.rating = 0;
      this.tags = "";
      this.folders = "";
      this.flag = false;
      this.note = "";
    } else {
      this.id = entity.id;
      this.addTime = entity.addTime;
      this.title = entity.title;
      this.authors = entity.authors;
      this.publication = entity.publication;
      this.pubTime = entity.pubTime;
      this.pubType = entity.pubType;
      this.doi = entity.doi;
      this.arxiv = entity.arxiv;
      this.mainURL = entity.mainURL;
      this.rating = entity.rating;
      this.flag = entity.flag;
      this.note = entity.note;

      this.supURLs = [];
      for (let url of entity.supURLs) {
        this.supURLs.push(url);
      }
      this.tags = [];
      if (typeof entity.tags === "string") {
        this.tags = entity.tags;
      } else {
        for (let tag of entity.tags) {
          this.tags.push(tag.name);
        }
        this.tags = this.tags.join("; ");
      }
      this.folders = [];
      if (typeof entity.folders === "string") {
        this.folders = entity.folders;
      } else {
        for (let folder of entity.folders) {
          this.folders.push(folder.name);
        }
        this.folders = this.folders.join("; ");
      }
    }
  }

  setValue(key, value, allowEmpty) {
    if (value != null) {
      var formatedValue = value;
      if (
        typeof formatedValue === "string" ||
        formatedValue instanceof String
      ) {
        if (key == "title" || key == "authors") {
          formatedValue = formatString({
            str: formatedValue,
            removeNewline: true,
            removeStr: ".",
          });
        }
        if (formatedValue) {
          this[key] = formatedValue;
        } else {
          if (allowEmpty) {
            this[key] = formatedValue;
          }
        }
      } else {
        this[key] = formatedValue;
      }
    } else {
      if (allowEmpty) {
        this[key] = value;
      }
    }
  }
}
