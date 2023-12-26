import { ObjectId } from "bson";
import { OID } from "./id";

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

  _id: OID = "";
  _partition: string = "";
  name: string = "";
  filter: string = "";
  color?: string;

  constructor(initObjectId = false) {
    if (initObjectId) {
      this._id = new ObjectId();
    }
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
