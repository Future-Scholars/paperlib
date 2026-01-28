import { z } from "zod";

// ----------------------
// Enums
// ----------------------

export const paperTypes = [
  "article",
  "book",
  "booklet",
  "inproceedings",
  "incollection",
  "mastersthesis",
  "phdthesis",
  "inbook",
  "techreport",
  "proceedings",
  "unpublished",
  "misc",
  "manual",
  "online",
] as const;

export const supplementTypes = [
  "text",
  "file",
  "image",
  "video",
  "audio",
  "url",
  "pdf",
  "json",
  "note",
  "other",
  "unknown",
] as const;

export const feedTypes = ["rss", "atom", "json"] as const;

export const orSetOps = ["add", "remove"] as const;

// ----------------------
// Entity models
// ----------------------

export const paperFields = [
  "type",
  "title",
  "abstract",
  "journal",
  "booktitle",
  "year",
  "month",
  "volume",
  "number",
  "pages",
  "publisher",
  "series",
  "edition",
  "editor",
  "howPublished",
  "organization",
  "school",
  "institution",
  "address",
  "doi",
  "arxiv",
  "isbn",
  "issn",
  "notes",
  "flag",
  "rating",
  "read",
  "feedId",
  "feedItemId",
] as const;

export const zPaperModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  updatedAt: z.number().int().nullable(),
  updatedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  type: z.enum(paperTypes),
  title: z.string(),
  abstract: z.string().nullable(),
  journal: z.string().nullable(),
  booktitle: z.string().nullable(),
  year: z.number().int().nullable(),
  month: z.number().int().nullable(),
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
  flag: z.boolean().nullable(),
  rating: z.number().int().default(0),
  read: z.boolean().nullable(),
  feedId: z.string().uuid().nullable(),
  feedItemId: z.string().nullable(),
});

export const authorFields = [
  "name",
  "affiliation",
  "email",
  "orcid",
  "firstName",
  "lastName",
] as const;
export const zAuthorModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  updatedAt: z.number().int().nullable(),
  updatedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  name: z.string(),
  affiliation: z.string().nullable(),
  email: z.string().nullable(),
  orcid: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
});

export const tagFields = ["name", "description", "colour"] as const;
export const zTagModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  updatedAt: z.number().int().nullable(),
  updatedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  name: z.string(),
  description: z.string().nullable(),
  colour: z.string().nullable(),
});

export const folderFields = [
  "name",
  "description",
  "colour",
  "parentId",
] as const;
export const zFolderModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  updatedAt: z.number().int().nullable(),
  updatedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  name: z.string(),
  description: z.string().nullable(),
  colour: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
});

export const supplementFields = [
  "name",
  "value",
  "type",
  "description",
] as const;
export const zSupplementModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  updatedAt: z.number().int().nullable(),
  updatedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  name: z.string(),
  value: z.string(),
  type: z.enum(supplementTypes),
  description: z.string().nullable(),
});

export const libraryFields = ["name", "description", "ownedBy"] as const;
export const zLibraryModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  updatedAt: z.number().int().nullable(),
  updatedByDeviceId: z.string().nullable(),

  name: z.string(),
  description: z.string().nullable(),
  ownedBy: z.string().uuid(),
});

export const feedFields = [
  "name",
  "description",
  "type",
  "url",
  "count",
  "colour",
] as const;
export const zFeedModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  updatedAt: z.number().int().nullable(),
  updatedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  name: z.string(),
  description: z.string().nullable(),
  type: z.enum(feedTypes),
  url: z.string(),
  count: z.number().int().positive().default(0),
  colour: z.string().nullable(),
});

// ----------------------
// Field-version models
// ----------------------

export const zPaperFieldVersionModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  value: z.string().nullable(),
  hash: z.string().nullable(),
  timestamp: z.number().int(),
  deviceId: z.string(),
  localInsertedAt: z.number().int(),

  paperId: z.string().uuid(),
  field: z.enum(paperFields),
});

export const zAuthorFieldVersionModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  value: z.string().nullable(),
  hash: z.string().nullable(),
  timestamp: z.number().int(),
  deviceId: z.string(),
  localInsertedAt: z.number().int(),

  authorId: z.string().uuid(),
  field: z.enum(authorFields),
});

export const zTagFieldVersionModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  value: z.string().nullable(),
  hash: z.string().nullable(),
  timestamp: z.number().int(),
  deviceId: z.string(),
  localInsertedAt: z.number().int(),

  tagId: z.string().uuid(),
  field: z.enum(tagFields),
});

export const zFolderFieldVersionModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  value: z.string().nullable(),
  hash: z.string().nullable(),
  timestamp: z.number().int(),
  deviceId: z.string(),
  localInsertedAt: z.number().int(),

  folderId: z.string().uuid(),
  field: z.enum(folderFields),
});

export const zSupplementFieldVersionModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  value: z.string().nullable(),
  hash: z.string().nullable(),
  timestamp: z.number().int(),
  deviceId: z.string(),
  localInsertedAt: z.number().int(),

  supplementId: z.string().uuid(),
  field: z.enum(supplementFields),
});

export const zLibraryFieldVersionModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  value: z.string().nullable(),
  hash: z.string().nullable(),
  timestamp: z.number().int(),
  deviceId: z.string(),
  localInsertedAt: z.number().int(),

  field: z.enum(libraryFields),
});

export const zFeedFieldVersionModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  value: z.string().nullable(),
  hash: z.string().nullable(),
  timestamp: z.number().int(),
  deviceId: z.string(),
  localInsertedAt: z.number().int(),

  feedId: z.string().uuid(),
  field: z.enum(feedFields),
});

export const zFieldVersionModel = z.union([
  zPaperFieldVersionModel,
  zAuthorFieldVersionModel,
  zTagFieldVersionModel,
  zFolderFieldVersionModel,
  zSupplementFieldVersionModel,
  zLibraryFieldVersionModel,
  zFeedFieldVersionModel,
]);

// ----------------------
// Relationship (OR-Set) models
// ----------------------

const zOrSetOp = z.enum(orSetOps);

export const zPaperAuthorModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  op: zOrSetOp,
  timestamp: z.number().int(),
  deviceId: z.string(),
  localInsertedAt: z.number().int(),

  paperId: z.string().uuid(),
  authorId: z.string().uuid(),
});

export const zPaperTagModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  op: zOrSetOp,
  timestamp: z.number().int(),
  deviceId: z.string(),
  localInsertedAt: z.number().int(),

  paperId: z.string().uuid(),
  tagId: z.string().uuid(),
});

export const zPaperFolderModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  op: zOrSetOp,
  timestamp: z.number().int(),
  deviceId: z.string(),
  localInsertedAt: z.number().int(),

  paperId: z.string().uuid(),
  folderId: z.string().uuid(),
});

export const zPaperSupplementModel = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().int().nullable(),
  deletedByDeviceId: z.string().nullable(),
  libraryId: z.string().uuid(),

  op: zOrSetOp,
  timestamp: z.number().int(),
  deviceId: z.string(),
  localInsertedAt: z.number().int(),

  paperId: z.string().uuid(),
  supplementId: z.string().uuid(),
});

// ----------------------
// Change stream view
// ----------------------

export const entityModelNames = [
  "library",
  "paper",
  "author",
  "tag",
  "folder",
  "supplement",
  "feed",
] as const;
export const relationshipModelNames = [
  "paperAuthor",
  "paperTag",
  "paperFolder",
  "paperSupplement",
] as const;

export type EntityModelName = (typeof entityModelNames)[number];
export type RelationshipModelName = (typeof relationshipModelNames)[number];
export type ChangeStreamModelName = EntityModelName | RelationshipModelName;

export const zEntityModelName = z.enum(entityModelNames);
export const zRelationshipModelName = z.enum(relationshipModelNames);
export const zChangeStreamModelName = z.union([
  zEntityModelName,
  zRelationshipModelName,
]);

export const zChangeStreamType = z.enum(["field_version", "or_set"]);

// ----------------------
// Compatibility exports for legacy code
// ----------------------

export const zLibraryField = z.enum([...libraryFields, "entity"]);

export const entityModelSchemas = Object.fromEntries(
  entityModelNames.map((name) => [name, {}])
) as Record<EntityModelName, {}>;

export const relationshipModelSchemas = Object.fromEntries(
  relationshipModelNames.map((name) => [name, {}])
) as Record<RelationshipModelName, {}>;

const zChangeStreamViewRaw = z.object({
  libraryId: z.string().uuid(),
  type: zChangeStreamType,
  model: zChangeStreamModelName,
  id: z.string().uuid(),
  localInsertedAt: z.number().int(),
});

export const zChangeStreamRow = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("field_version"),
    model: zEntityModelName,
    libraryId: z.string().uuid(),
    id: z.string().uuid(),
    localInsertedAt: z.number().int(),
  }),
  z.object({
    type: z.literal("or_set"),
    model: zRelationshipModelName,
    libraryId: z.string().uuid(),
    id: z.string().uuid(),
    localInsertedAt: z.number().int(),
  }),
]);

// ----------------------
// Row schema maps (useful for services)
// ----------------------

export const entityRowSchemas = {
  paper: zPaperModel,
  author: zAuthorModel,
  tag: zTagModel,
  folder: zFolderModel,
  supplement: zSupplementModel,
  library: zLibraryModel,
  feed: zFeedModel,
} as const;

export const fieldVersionRowSchemas = {
  paper: zPaperFieldVersionModel,
  feed: zFeedFieldVersionModel,
  folder: zFolderFieldVersionModel,
  supplement: zSupplementFieldVersionModel,
  author: zAuthorFieldVersionModel,
  tag: zTagFieldVersionModel,
  library: zLibraryFieldVersionModel,
} as const;

export const relationshipRowSchemas = {
  paperAuthor: zPaperAuthorModel,
  paperTag: zPaperTagModel,
  paperFolder: zPaperFolderModel,
  paperSupplement: zPaperSupplementModel,
} as const;

// ----------------------
// Database interface (Kysely-friendly)
// ----------------------

const zDatabase = z.object({
  // Entities
  paper: zPaperModel,
  author: zAuthorModel,
  tag: zTagModel,
  folder: zFolderModel,
  supplement: zSupplementModel,
  library: zLibraryModel,
  feed: zFeedModel,
  // Field versions
  paperFieldVersion: zPaperFieldVersionModel,
  authorFieldVersion: zAuthorFieldVersionModel,
  tagFieldVersion: zTagFieldVersionModel,
  folderFieldVersion: zFolderFieldVersionModel,
  supplementFieldVersion: zSupplementFieldVersionModel,
  libraryFieldVersion: zLibraryFieldVersionModel,
  feedFieldVersion: zFeedFieldVersionModel,
  // Relationships
  paperAuthor: zPaperAuthorModel,
  paperTag: zPaperTagModel,
  paperFolder: zPaperFolderModel,
  paperSupplement: zPaperSupplementModel,

  // View
  changeStream: zChangeStreamViewRaw,
});

export type DatabaseSQLite = z.infer<typeof zDatabase>;

// Back-compat alias (matches `src/data/models.ts` export).
export type Database = DatabaseSQLite;
