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
export const PaperSchema = z.object({
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
export type Paper = z.infer<typeof PaperSchema>;

// 其它模型定义（示例：PaperFieldVersion）
export const PaperFieldVersionSchema = z.object({
  id: z.string(),
  paperId: z.string(),
  field: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
  hash: z.string().nullable().optional(),
});
export type PaperFieldVersion = z.infer<typeof PaperFieldVersionSchema>;

// 其它模型请按类似方式补充（Author, Tag, Folder, Supplement, Library, Feed等）
export const AuthorSchema = z.object({
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
export type Author = z.infer<typeof AuthorSchema>;

export const AuthorFieldVersionSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  field: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
});
export type AuthorFieldVersion = z.infer<typeof AuthorFieldVersionSchema>;

export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  colour: z.string().nullable().optional(),
  createdAt: z.date(),
  createdByDeviceId: z.string().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  deletedByDeviceId: z.string().nullable().optional(),
});
export type Tag = z.infer<typeof TagSchema>;

export const TagFieldVersionSchema = z.object({
  id: z.string(),
  tagId: z.string(),
  field: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
});
export type TagFieldVersion = z.infer<typeof TagFieldVersionSchema>;

export const FolderSchema = z.object({
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
export type Folder = z.infer<typeof FolderSchema>;

export const FolderFieldVersionSchema = z.object({
  id: z.string(),
  folderId: z.string(),
  field: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
});
export type FolderFieldVersion = z.infer<typeof FolderFieldVersionSchema>;

export const SupplementSchema = z.object({
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
export type Supplement = z.infer<typeof SupplementSchema>;

export const SupplementFieldVersionSchema = z.object({
  id: z.string(),
  supplementId: z.string(),
  field: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
});
export type SupplementFieldVersion = z.infer<typeof SupplementFieldVersionSchema>;

export const LibrarySchema = z.object({
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
export type Library = z.infer<typeof LibrarySchema>;

export const LibraryFieldVersionSchema = z.object({
  id: z.string(),
  libraryId: z.string(),
  field: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
});
export type LibraryFieldVersion = z.infer<typeof LibraryFieldVersionSchema>;

export const FeedSchema = z.object({
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
export type Feed = z.infer<typeof FeedSchema>;

export const FeedFieldVersionSchema = z.object({
  id: z.string(),
  feedId: z.string(),
  field: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
  hash: z.string().nullable().optional(),
});
export type FeedFieldVersion = z.infer<typeof FeedFieldVersionSchema>;

export const PaperAuthorSchema = z.object({
  id: z.string(),
  paperId: z.string(),
  authorId: z.string(),
  op: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
});
export type PaperAuthor = z.infer<typeof PaperAuthorSchema>;

export const PaperTagSchema = z.object({
  id: z.string(),
  paperId: z.string(),
  tagId: z.string(),
  op: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
});
export type PaperTag = z.infer<typeof PaperTagSchema>;

export const PaperFolderSchema = z.object({
  id: z.string(),
  paperId: z.string(),
  folderId: z.string(),
  op: z.string(),
  timestamp: z.date(),
  deviceId: z.string(),
});
export type PaperFolder = z.infer<typeof PaperFolderSchema>;

export const LibraryShareSchema = z.object({
  id: z.string(),
  libraryId: z.string(),
  userId: z.string(),
  permission: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type LibraryShare = z.infer<typeof LibraryShareSchema>;
