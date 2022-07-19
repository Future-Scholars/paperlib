import { ObjectId } from "bson";

export interface Feed {
  _id: ObjectId;
  id: ObjectId;
  _partition: string;
  name: string;
  count: number;
  color: string;
  url: string;
}

export const FeedSchema = {
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
