import { ObjectId } from "bson";
import Realm, { List, Results } from "realm";

import { getFileType } from "@/base/url";

export interface ISupplementary {
  _id: string;
  url: string;
  name: string;
}

export class Supplementary implements ISupplementary {
  static schema = {
    name: "Supplementary",
    embedded: true,
    properties: {
      _id: "string",
      url: "string",
      name: "string",
    },
  };

  _id!: string;
  url!: string;
  name!: string;

  constructor(object?: Partial<ISupplementary>) {
    this.initialize(object || {});

    return new Proxy(this, {
      set: (target, prop, value) => {
        if ((prop === "_id") && value) {
            this._id = Date.now().toString(36);
        } else {
          target[prop] = value;
        }

        return true;
      },
    });
  }

  initialize(object: Partial<ISupplementary>) {
    this._id = object._id || new ObjectId().toString();
    this.url = object.url || "";
    this.name = object.name || getFileType(this.url);

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
