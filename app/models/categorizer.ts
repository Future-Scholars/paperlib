import { ObjectId } from "bson";
import { OID } from "./id";

export class Categorizer {
  static schema: Record<string, any>;

  _id: OID;
  _partition: string;
  name: string;
  count: number;
  color?: string;

  constructor(
    name: string,
    count: number,
    color?: string,
    partition?: string,
    initObjectId = false
  ) {
    if (initObjectId) {
      this._id = new ObjectId();
    } else {
      this._id = "";
    }
    this._partition = partition || "";
    this.name = name;
    this.count = count;
    this.color = color;
  }

  initialize(categorizer: Categorizer) {
    this._id = categorizer._id;
    this._partition = categorizer._partition;
    this.name = categorizer.name;
    this.count = categorizer.count;
    this.color = categorizer.color;

    return this;
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

  constructor(
    name: string,
    count: number,
    color?: string,
    partition?: string,
    initObjectId = false
  ) {
    super(name, count, color, partition, initObjectId);
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

  constructor(
    name: string,
    count: number,
    color?: string,
    partition?: string,
    initObjectId = false
  ) {
    super(name, count, color, partition, initObjectId);
  }
}

export enum Colors {
  red = "red",
  green = "green",
  blue = "blue",
  yellow = "yellow",
  orange = "orange",
  cyan = "cyan",
  purple = "purple",
  pink = "pink",
}

export enum CategorizerType {
  PaperTag = "PaperTag",
  PaperFolder = "PaperFolder",
}
