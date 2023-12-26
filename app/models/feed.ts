import { ObjectId } from "bson";

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

  _id: OID = "";
  id: OID = "";
  _partition: string = "";
  name: string = "";
  count: number = 0;
  color?: string;
  url: string = "";

  constructor(initObjectId = false) {
    if (initObjectId) {
      this._id = new ObjectId();
      this.id = this._id;
    }
  }

  initialize(feed: Feed) {
    this._id = feed._id ? feed._id : this._id || new ObjectId();
    this.id = feed.id ? feed.id : this.id || this._id;
    this._partition = feed._partition || this._partition;
    this.name = feed.name || this.name;
    this.count = feed.count || this.count;
    this.color = feed.color || this.color;
    this.url = feed.url || this.url;

    return this;
  }
}
