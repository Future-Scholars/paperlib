import { ObjectId } from "bson";

export class PaperSmartFilter {
  static schema = {
    name: "PaperPaperSmartFilter",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      _partition: "string?",
      name: "string",
      filter: "string",
      color: "string?",
    },
  };

  _id: string | ObjectId;
  _partition: string;
  name: string;
  filter: string;
  color?: string;

  constructor(
    name: string,
    filter: string,
    color?: string,
    partition?: string
  ) {
    this._id = new ObjectId();
    this._partition = partition || "";
    this.name = name;
    this.filter = filter;
    this.color = color;
  }

  initialize(smartfilter: PaperSmartFilter) {
    this._id = smartfilter._id;
    this._partition = smartfilter._partition;
    this.name = smartfilter.name;
    this.filter = smartfilter.filter;
    this.color = smartfilter.color;

    return this;
  }
}

export type PaperSmartFilterType = "PaperPaperSmartFilter";
