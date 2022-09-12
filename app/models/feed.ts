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

  _id: ObjectId | string = "";
  id: ObjectId | string = "";
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
    this._id = feed._id;
    this.id = feed.id;
    this._partition = feed._partition;
    this.name = feed.name;
    this.count = feed.count;
    this.color = feed.color;
    this.url = feed.url;

    return this;
  }
}
