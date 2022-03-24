import { ObjectId } from 'bson';

import { PaperTag, PaperFolder } from './PaperCategorizer';

export const PaperEntitySchema = {
  name: 'PaperEntity',
  primaryKey: '_id',
  properties: {
    id: 'objectId',
    _id: 'objectId',
    _partition: 'string?',
    addTime: 'date',

    title: 'string',
    authors: 'string',
    publication: 'string',
    pubTime: 'string',
    pubType: 'int',
    doi: 'string',
    arxiv: 'string',
    mainURL: 'string',
    supURLs: {
      type: 'list',
      objectType: 'string',
    },
    rating: 'int',
    tags: {
      type: 'list',
      objectType: 'PaperTag',
    },
    folders: {
      type: 'list',
      objectType: 'PaperFolder',
    },
    flag: 'bool',
    note: 'string',
    codes: {
      type: 'list',
      objectType: 'string',
    },
  },
};

export interface PaperEntity {
  _id: ObjectId | string;
  id: ObjectId | string;
  _partition: string;
  addTime: Date;
  title: string;
  authors: string;
  publication: string;
  pubTime: string;
  pubType: number;
  doi: string;
  arxiv: string;
  mainURL: string;
  supURLs: string[];
  rating: number;
  tags: PaperTag[];
  folders: PaperFolder[];
  flag: boolean;
  note: string;
  codes: string[];

  [Key: string]: unknown;
}

export const PaperEntityPlaceholder = {
  _id: '',
  id: '',
  _partition: '',
  addTime: new Date(),
  title: '',
  authors: '',
  publication: '',
  pubTime: '',
  pubType: 0,
  doi: '',
  arxiv: '',
  mainURL: '',
  supURLs: [],
  rating: 0,
  tags: [],
  folders: [],
  flag: false,
  note: '',
  codes: [],
};
