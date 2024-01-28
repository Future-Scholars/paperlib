import { ObjectId } from "bson";
import { OID } from "./id";

export interface IQuerySentenceDraft {
  _id?: OID;
  _partition?: string;
  name: string;
  query?: string;
  color?: string;
  inEdgeNodes?: QuerySentence[];
  inEdgeNodeIds?: OID[];
  root: string;
}

export class QuerySentence {
  static schema = {
    name: "QuerySentence",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      _partition: "string?",
      name: "string",
      query: "string",
      color: "string?",
      root: "string",
      inEdgeNodes: "QuerySentence[]",
    },
  };

  _id: OID;
  _partition: string;
  name: string;
  query: string;
  color: string;
  inEdgeNodes: QuerySentence[];
  root: string;

  constructor(object: IQuerySentenceDraft, initObjectId = false) {
    this._id = object._id ? new ObjectId(object._id) : "";
    this._partition = object._partition || "";
    this.name = object.name;
    this.query = object.query || "true";
    this.color = object.color || Colors.red;
    this.inEdgeNodes = object.inEdgeNodes || [];
    this.root = object.root;

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

  initialize(object: IQuerySentenceDraft) {
    this._id = object._id ? new ObjectId(object._id) : "";
    this._partition = object._partition || "";
    this.name = object.name;
    this.query = object.query || "true";
    this.inEdgeNodes = object.inEdgeNodes || [];

    return this;
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
