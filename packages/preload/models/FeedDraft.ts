import { ObjectId } from "bson";
import { Feed } from "./Feed";

export class FeedDraft {
  _id: ObjectId | string = "";
  id: ObjectId | string = "";
  _partition = "";

  name: string = "";
  count = 0;
  color: string = "blue";
  url: string = "";

  [Key: string]: unknown;

  constructor(initObjectId = false) {
    if (initObjectId) {
      this._id = new ObjectId();
      this.id = this._id;
    }
  }

  initialize(feed: Feed | FeedDraft) {
    this._id = feed._id;
    this.id = feed.id;
    this._partition = feed._partition;
    this.name = feed.name;
    this.count = feed.count;
    this.color = feed.color;
    this.url = feed.url;
  }

  create(): Feed {
    const id = this._id ? new ObjectId(this._id) : new ObjectId();
    this._id = id.toString();
    this.id = id.toString();

    const feed = {
      _id: id,
      id: id,
      _partition: this._partition,
      name: this.name,
      count: this.count,
      color: this.color,
      url: this.url,
    };
    return feed;
  }

  setValue(key: string, value: unknown, allowEmpty = false) {
    if ((value || allowEmpty) && value !== "undefined") {
      this[key] = value;
    }
  }
}
