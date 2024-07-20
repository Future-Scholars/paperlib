import { ObjectId } from "bson";
import Realm, { List, Results } from "realm";
import { OID } from "./id";

export interface IPaperSmartFilterDraft {
  _id?: OID;
  _partition?: string;
  name?: string;
  filter?: string;
  color?: string;
  children?: IPaperSmartFilterDraft[];
}

export class PaperSmartFilter {
  static schema = {
    name: "PaperSmartFilter",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      _partition: "string?",
      name: "string",
      filter: "string",
      color: "string?",
      children: "PaperSmartFilter[]",
    },
  };

  _id: OID = "";
  _partition: string = "";
  name: string = "";
  filter: string = "";
  color: string;
  children: PaperSmartFilter[] = [];

  constructor(object?: IPaperSmartFilterDraft, initObjectId = false) {
    this._id = object?._id ? new ObjectId(object._id) : "";
    this._partition = object?._partition || "";
    this.name = object?.name || "";
    this.filter = object?.filter || "";
    this.color = object?.color || "blue";
    this.children =
      object?.children?.map((child) => new PaperSmartFilter(child)) || [];

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
    this.color = object.color || "blue";
    this.children =
      object.children?.map((child) =>
        new PaperSmartFilter().initialize(child)
      ) || [];

    return this;
  }
}

export enum PaperSmartFilterType {
  smartfilter = "PaperSmartFilter",
}

export type IPaperSmartFilterRealmObject = PaperSmartFilter &
  Realm.Object<
    PaperSmartFilter,
    "_id" | "name" | "filter" | "color" | "children"
  >;

export type IPaperSmartFilterObject =
  | PaperSmartFilter
  | IPaperSmartFilterRealmObject;

export type IPaperSmartFilterCollection =
  | Results<IPaperSmartFilterObject>
  | List<IPaperSmartFilterObject>
  | Array<IPaperSmartFilterObject>;
