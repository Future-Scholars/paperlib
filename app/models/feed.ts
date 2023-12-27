import { ObjectId } from "bson";
import { OID } from "./id";

export interface IFeedDraft {
  _id?: OID;
  id?: OID;
  _partition?: string;
  name?: string;
  count?: number;
  color?: string;
  url?: string;
}

export class Feed {
  static schema = {
    name: "Feed",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      id: "objectId",
      _partition: "string?",
      name: "string",
      count: "int",
      color: "string?",
      url: "string",
    },
  };

  _id: OID;
  id: OID;
  _partition: string;
  name: string;
  count: number;
  color?: string;
  url: string;

  constructor(object?: IFeedDraft, initObjectId = false) {
    this._id = object?._id ? new ObjectId(object._id) : "";
    this.id = object?._id ? new ObjectId(object._id) : "";
    this.id = this.id ? this.id : this._id;
    this._id = this._id ? this._id : this.id;

    this._partition = object?._partition || "";
    this.name = object?.name || "";
    this.count = object?.count || 0;
    this.color = object?.color;
    this.url = object?.url || "";

    if (initObjectId) {
      this._id = new ObjectId();
      this.id = this._id;
    }
  }

  initialize(object: IFeedDraft) {
    this._id = object._id ? new ObjectId(object._id) : "";
    this.id = object._id ? new ObjectId(object._id) : "";
    this.id = this.id ? this.id : this._id;
    this._id = this._id ? this._id : this.id;

    this._partition = object._partition || "";
    this.name = object.name || "";
    this.count = object.count || 0;
    this.color = object.color;
    this.url = object.url || "";

    return this;
  }
}
