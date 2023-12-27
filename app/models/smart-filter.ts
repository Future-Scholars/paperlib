import { ObjectId } from "bson";
import { OID } from "./id";

export interface IPaperSmartFilterDraft {
  _id?: OID;
  _partition?: string;
  name?: string;
  filter?: string;
  color?: string;
}

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

  constructor(object?: IPaperSmartFilterDraft, initObjectId = false) {
    this._id = object?._id ? new ObjectId(object._id) : "";
    this._partition = object?._partition || "";
    this.name = object?.name || "";
    this.filter = object?.filter || "";
    this.color = object?.color;

    if (initObjectId) {
      this._id = new ObjectId();
    }

    return new Proxy(this, {
      set: (target, prop, value) => {
        if (prop === "_id" && value) {
          this._id = new ObjectId(value);
        } else {
          target[prop] = value;
        }

        return true;
      },
    });
  }

  initialize(object: IPaperSmartFilterDraft) {
    this._id = object._id ? new ObjectId(object._id) : "";
    this._partition = object._partition || "";
    this.name = object.name || "";
    this.filter = object.filter || "";
    this.color = object.color;

    return this;
  }
}

export type PaperSmartFilterType = "PaperPaperSmartFilter";
