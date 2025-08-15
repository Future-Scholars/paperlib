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
  libraryId: z.string(),
  type: PaperTypeEnum,
  title: z.string(),
  abstract: z.string().nullable().optional(),
  journal: z.string().nullable().optional(),
  booktitle: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  month: z.number().nullable().optional(),
  volume: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
  pages: z.string().nullable().optional(),
  publisher: z.string().nullable().optional(),
  series: z.string().nullable().optional(),
  edition: z.string().nullable().optional(),
  editor: z.string().nullable().optional(),
  howPublished: z.string().nullable().optional(),
  organization: z.string().nullable().optional(),
  school: z.string().nullable().optional(),
  institution: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  doi: z.string().nullable().optional(),
  arxiv: z.string().nullable().optional(),
  isbn: z.string().nullable().optional(),
  issn: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  flag: z.boolean().nullable().optional(),
  read: z.boolean().nullable().optional(),
  feedId: z.string().nullable().optional(),
  feedItemId: z.string().nullable().optional(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type Paper = z.infer<typeof zPaper>;

export const zPaperFieldVersion = z.object({
  id: z.string(),
  paperId: z.string(),
  field: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
  hash: z.string().nullable().optional(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type PaperFieldVersion = z.infer<typeof zPaperFieldVersion>;

// 其它模型定义（示例：PaperFieldVersion）
export const zAuthor = z.object({
  id: z.string(),
  name: z.string(),
  affiliation: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  orcid: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type Author = z.infer<typeof zAuthor>;

export const zAuthorFieldVersion = z.object({
  id: z.string(),
  authorId: z.string(),
  field: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type AuthorFieldVersion = z.infer<typeof zAuthorFieldVersion>;

export const zTag = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  colour: z.string().nullable().optional(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type Tag = z.infer<typeof zTag>;

export const zTagFieldVersion = z.object({
  id: z.string(),
  tagId: z.string(),
  field: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type TagFieldVersion = z.infer<typeof zTagFieldVersion>;

export const zFolder = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  libraryId: z.string(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type Folder = z.infer<typeof zFolder>;

export const zFolderFieldVersion = z.object({
  id: z.string(),
  folderId: z.string(),
  field: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type FolderFieldVersion = z.infer<typeof zFolderFieldVersion>;

export const zSupplement = z.object({
  id: z.string(),
  paperId: z.string(),
  name: z.string(),
  value: z.string(),
  type: SupplementTypeEnum,
  description: z.string().nullable().optional(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type Supplement = z.infer<typeof zSupplement>;

export const zSupplementFieldVersion = z.object({
  id: z.string(),
  supplementId: z.string(),
  field: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type SupplementFieldVersion = z.infer<typeof zSupplementFieldVersion>;

export const zLibrary = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  ownedBy: z.string(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type Library = z.infer<typeof zLibrary>;

export const zLibraryFieldVersion = z.object({
  id: z.string(),
  libraryId: z.string(),
  field: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type LibraryFieldVersion = z.infer<typeof zLibraryFieldVersion>;

export const zFeed = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  ownedBy: z.string(),
  libraryId: z.string(),
  type: FeedTypeEnum,
  url: z.string(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type Feed = z.infer<typeof zFeed>;

export const zFeedFieldVersion = z.object({
  id: z.string(),
  feedId: z.string(),
  field: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
  hash: z.string().nullable().optional(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type FeedFieldVersion = z.infer<typeof zFeedFieldVersion>;

export const zPaperAuthor = z.object({
  id: z.string(),
  paperId: z.string(),
  authorId: z.string(),
  op: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type PaperAuthor = z.infer<typeof zPaperAuthor>;

export const zPaperTag = z.object({
  id: z.string(),
  paperId: z.string(),
  tagId: z.string(),
  op: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type PaperTag = z.infer<typeof zPaperTag>;

export const zPaperFolder = z.object({
  id: z.string(),
  paperId: z.string(),
  folderId: z.string(),
  op: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type PaperFolder = z.infer<typeof zPaperFolder>;

export const zLibraryShare = z.object({
  id: z.string(),
  libraryId: z.string(),
  userId: z.string(),
  permission: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type LibraryShare = z.infer<typeof zLibraryShare>;
