import { z } from 'zod';

// Enums
export const PaperTypeEnum = z.enum([
  'article', 'book', 'booklet', 'inproceedings', 'incollection', 'mastersthesis', 'phdthesis', 'inbook', 'techreport', 'proceedings', 'unpublished', 'misc', 'manual', 'online',
]);
export type PaperType = z.infer<typeof PaperTypeEnum>;

export const SupplementTypeEnum = z.enum([
  'text', 'file', 'image', 'video', 'audio', 'url', 'pdf', 'json', 'note', 'other', 'unknown',
]);
export type SupplementType = z.infer<typeof SupplementTypeEnum>;

export const FeedTypeEnum = z.enum(['rss', 'atom', 'json']);
export type FeedType = z.infer<typeof FeedTypeEnum>;

// Models
export const zPaper = z.object({
  id: z.string(),
  legacyOid: z.string().nullable(),
  libraryId: z.string(),
  type: PaperTypeEnum,
  title: z.string(),
  abstract: z.string().nullable(),
  journal: z.string().nullable(),
  booktitle: z.string().nullable(),
  year: z.number().nullable(),
  month: z.number().nullable(),
  volume: z.string().nullable(),
  number: z.string().nullable(),
  pages: z.string().nullable(),
  publisher: z.string().nullable(),
  series: z.string().nullable(),
  edition: z.string().nullable(),
  editor: z.string().nullable(),
  howPublished: z.string().nullable(),
  organization: z.string().nullable(),
  school: z.string().nullable(),
  institution: z.string().nullable(),
  address: z.string().nullable(),
  doi: z.string().nullable(),
  arxiv: z.string().nullable(),
  isbn: z.string().nullable(),
  issn: z.string().nullable(),
  notes: z.string().nullable(),
  flag: z.number().nullable(),
  rating: z.number().nullable(),
  read: z.number().nullable(),
  feedId: z.string().nullable(),
  feedItemId: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  updatedAt: z.string().datetime(),
  updatedByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type Paper = z.infer<typeof zPaper>;

export const zPaperFieldVersion = z.object({
  id: z.string(),
  paperId: z.string(),
  field: z.enum([
    'type',
    'title',
    'abstract',
    'journal',
    'booktitle',
    'year',
    'month',
    'volume',
    'number',
    'pages',
    'publisher',
    'series',
    'edition',
    'editor',
    'howPublished',
    'organization',
    'school',
    'institution',
    'address',
    'doi',
    'arxiv',
    'isbn',
    'issn',
    'notes',
    'flag',
    'rating',
    'read',
    'feedId',
    'feedItemId',
  ]),
  value: z.string().nullable(),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  hash: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type PaperFieldVersion = z.infer<typeof zPaperFieldVersion>;

export const zAuthor = z.object({
  id: z.string(),
  name: z.string(),
  affiliation: z.string().nullable(),
  email: z.string().nullable(),
  orcid: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type Author = z.infer<typeof zAuthor>;

export const zAuthorFieldVersion = z.object({
  id: z.string(),
  authorId: z.string(),
  field: z.string(),
  value: z.string().nullable(),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  createdAt: z.string(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type AuthorFieldVersion = z.infer<typeof zAuthorFieldVersion>;

export const zTag = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  colour: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  updatedAt: z.string().datetime(),
  updatedByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type Tag = z.infer<typeof zTag>;

export const zTagFieldVersion = z.object({
  id: z.string(),
  tagId: z.string(),
  field: z.enum([
    'name',
    'description',
    'colour',
  ]),
  value: z.string().nullable(),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type TagFieldVersion = z.infer<typeof zTagFieldVersion>;

export const zFolder = z.object({
  id: z.string(),
  legacyOid: z.string().nullable(),
  name: z.string(),
  colour: z.string().nullable(),
  description: z.string().nullable(),
  parentId: z.string().nullable(),
  libraryId: z.string(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  updatedAt: z.string().datetime(),
  updatedByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type Folder = z.infer<typeof zFolder>;

export const zFolderFieldVersion = z.object({
  id: z.string(),
  folderId: z.string(),
  field: z.enum([
    'name',
    'colour',
    'description',
    'parentId',
  ]),
  value: z.string().nullable(),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type FolderFieldVersion = z.infer<typeof zFolderFieldVersion>;

export const zSupplement = z.object({
  id: z.string(),
  paperId: z.string(),
  name: z.string(),
  value: z.string(),
  type: SupplementTypeEnum,
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type Supplement = z.infer<typeof zSupplement>;

export const zSupplementFieldVersion = z.object({
  id: z.string(),
  supplementId: z.string(),
  field: z.string(),
  value: z.string().nullable(),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type SupplementFieldVersion = z.infer<typeof zSupplementFieldVersion>;

export const zLibrary = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  ownedBy: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  updatedAt: z.string().datetime(),
  updatedByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type Library = z.infer<typeof zLibrary>;

export const zLibraryFieldVersion = z.object({
  id: z.string(),
  libraryId: z.string(),
  field: z.enum([
    'name',
    'description',
    'ownedBy',
  ]),
  value: z.string().nullable(),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type LibraryFieldVersion = z.infer<typeof zLibraryFieldVersion>;

export const zFeed = z.object({
  id: z.string(),
  legacyOid: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  ownedBy: z.string().nullable(),
  libraryId: z.string(),
  type: FeedTypeEnum,
  url: z.string(),
  count: z.number().nullable(),
  color: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  updatedAt: z.string().datetime(),
  updatedByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type Feed = z.infer<typeof zFeed>;

export const zFeedFieldVersion = z.object({
  id: z.string(),
  feedId: z.string(),
  field: z.enum([
    'name',
    'description',
    'count',
    'color',
    'url',
    'type',
  ]),
  value: z.string().nullable(),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  hash: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type FeedFieldVersion = z.infer<typeof zFeedFieldVersion>;

export const zPaperAuthor = z.object({
  id: z.string(),
  paperId: z.string(),
  authorId: z.string(),
  op: z.enum(['add', 'remove']),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type PaperAuthor = z.infer<typeof zPaperAuthor>;

export const zPaperTag = z.object({
  id: z.string(),
  paperId: z.string(),
  tagId: z.string(),
  op: z.enum(['add', 'remove']),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type PaperTag = z.infer<typeof zPaperTag>;

export const zPaperFolder = z.object({
  id: z.string(),
  paperId: z.string(),
  folderId: z.string(),
  op: z.enum(['add', 'remove']),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type PaperFolder = z.infer<typeof zPaperFolder>;

export const zLibraryShare = z.object({
  id: z.string(),
  libraryId: z.string(),
  userId: z.string(),
  permission: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
export type LibraryShare = z.infer<typeof zLibraryShare>;
