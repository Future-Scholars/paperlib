import { ObjectId } from "bson";

export interface PaperCategorizer {
  _id: ObjectId;
  _partition: string;
  name: string;
  count: number;
  color: string;
}

export interface PaperTag extends PaperCategorizer {
  _id: ObjectId;
  _partition: string;
  name: string;
  count: number;
  color: string;
}

export interface PaperFolder extends PaperCategorizer {
  _id: ObjectId;
  _partition: string;
  name: string;
  count: number;
  color: string;
}

export type Categorizers = "PaperTag" | "PaperFolder";

export const PaperTagSchema = {
  name: "PaperTag",
  primaryKey: "_id",
  properties: {
    _id: "objectId",
    _partition: "string?",
    name: "string",
    count: "int",
    color: "string?",
  },
};

export const PaperFolderSchema = {
  name: "PaperFolder",
  primaryKey: "_id",
  properties: {
    _id: "objectId",
    _partition: "string?",
    name: "string",
    count: "int",
    color: "string?",
  },
};
