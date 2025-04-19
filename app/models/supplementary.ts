import { ObjectId } from "bson";
import Realm, { List, Results } from "realm";

import { OID } from "./id";

export interface ISupplementaryDraft {
  _id?: OID;
  url?: string;
  name?: string;
}

export class Supplementary {
  static schema = {
    name: "Supplementary",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      url: "string",
      name: "string",
    },
  };

  _id: OID;
  url: string;
  name: string;

  constructor(object?: ISupplementaryDraft, initObjectId = false) {
    this._id = object?._id ? new ObjectId(object._id) : "";
    this.url = object?.url || "";
    this.name = object?.name || "";

    if (initObjectId) {
      this._id = new ObjectId();
    }

    return new Proxy(this, {
      set: (target, prop, value) => {
        if ((prop === "_id") && value) {
          this._id = new ObjectId(value);
        } else {
          target[prop] = value;
        }

        return true;
      },
    });
  }

  initialize(object: ISupplementaryDraft) {
    this._id = object._id ? new ObjectId(object._id) : "";
    this.url = object.url || "";
    this.name = object.name || "";

    return this;
  }
}

export type ISupplementaryRealmObject = Supplementary &
  Realm.Object<
  Supplementary,
    | "_id"
    | "url"
    | "name"
  >;

export type ISupplementaryObject = Supplementary | ISupplementaryRealmObject;

export type IPaperEntityCollection =
  | Results<ISupplementaryObject>
  | List<ISupplementaryObject>
  | Array<ISupplementaryObject>;
