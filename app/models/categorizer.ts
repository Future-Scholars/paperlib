import { ObjectId } from "bson";

export class Categorizer {
  static schema: Record<string, any>;

  _id: string | ObjectId;
  _partition: string;
  name: string;
  count: number;
  color?: string;

  constructor(name: string, count: number, color?: string, partition?: string) {
    this._id = new ObjectId();
    this._partition = partition || "";
    this.name = name;
    this.count = count;
    this.color = color;
  }
}

export class PaperTag extends Categorizer {
  static schema = {
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

  constructor(name: string, count: number, color?: string, partition?: string) {
    super(name, count, color, partition);
  }
}

export class PaperFolder extends Categorizer {
  static schema = {
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

  constructor(name: string, count: number, color?: string, partition?: string) {
    super(name, count, color, partition);
  }
}

export type CategorizerType = "PaperTag" | "PaperFolder";
export type Colors = "red" | "green" | "blue" | "yellow";
