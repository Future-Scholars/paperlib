import { ObjectId } from 'bson';

export const PaperEntityCacheSchema = {
  name: 'PaperEntityCache',
  primaryKey: '_id',
  properties: {
    _id: 'objectId',
    _partition: 'string?',
    fulltext: 'string',
  },
};

export interface PaperEntityCache {
  _id: ObjectId | string;
  _partition: string | null;
  fulltext: string;

  [Key: string]: unknown;
}
