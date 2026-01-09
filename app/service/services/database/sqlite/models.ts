import { z } from "zod";

// Base models
export const fieldVersionModels = [
  "paperFieldVersion",
  "authorFieldVersion",
  "tagFieldVersion",
  "folderFieldVersion",
  "supplementFieldVersion",
  "libraryFieldVersion",
  "feedFieldVersion",
] as const;
export const zBaseFieldVersionTable = z.object({
  id: z.string().uuid(),
  model: z.enum(fieldVersionModels),
  hash: z.string().nullable(),
  value: z.string().nullable(),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  createdAt: z.number().positive(),
  createdByDeviceId: z.string(),
  deletedAt: z.number().positive().nullable(),
  deletedByDeviceId: z.string().nullable(),
});

export const entityModels = [
  "paper",
  "feed",
  "folder",
  "supplement",
  "author",
  "tag",
  "library",
] as const;
const zBaseEntityTable = z.object({
  id: z.string().uuid(),
  legacyOid: z.string().nullable(),
  createdAt: z.number().positive(),
  createdByDeviceId: z.string(),
  updatedAt: z.number().positive().nullable(),
  updatedByDeviceId: z.string().nullable(),
  deletedAt: z.number().positive().nullable(),
  deletedByDeviceId: z.string().nullable(),
});

const zBaseLibraryEntityTable = zBaseEntityTable.extend({
  libraryId: z.string(),
});

export const relationshipModels = [
  "paperAuthor",
  "paperTag",
  "paperFolder",
  "paperSupplement",
] as const;
export const zOrSetOp = z.enum(["add", "remove"]);
export const zBaseRelationshipTable = z.object({
  id: z.string().uuid(),
  libraryId: z.string(),
  op: zOrSetOp,
  timestamp: z.number().positive(),
  deviceId: z.string(),
  createdAt: z.number().positive(),
  deletedAt: z.number().positive().nullable(),
});

// Models
export const PaperTypeEnum = z.enum([
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
]);
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
export const paperTableConfig = {
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
} as const;
export const zPaperTable = zBaseLibraryEntityTable.extend(paperTableConfig);
export const paperFieldVersionConfig = {
  paperId: z.string(),
  field: z.enum(paperFields),
};
export const zPaperFieldVersionTable = zBaseFieldVersionTable.extend(
  paperFieldVersionConfig
);
export const authorTableConfig = {
  name: z.string(),
  affiliation: z.string().nullable(),
  email: z.string().nullable(),
  orcid: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
};
export const zAuthorTable = zBaseEntityTable.extend(authorTableConfig);
export const authorFields = [
  "name",
  "affiliation",
  "email",
  "orcid",
  "firstName",
  "lastName",
] as const;
export const authorFieldVersionConfig = {
  authorId: z.string(),
  field: z.enum(authorFields),
};
export const zAuthorFieldVersionTable = zBaseFieldVersionTable.extend(
  authorFieldVersionConfig
);

export const tagFields = ["name", "description", "colour"] as const;
export const tagTableConfig = {
  name: z.string(),
  description: z.string().nullable(),
  colour: z.string().nullable(),
};
export const zTagTable = zBaseEntityTable.extend(tagTableConfig);

export const tagFieldVersionConfig = {
  tagId: z.string(),
  field: z.enum(tagFields),
} as const;
export const zTagFieldVersionTable = zBaseFieldVersionTable.extend(
  tagFieldVersionConfig
);

export const folderTableConfig = {
  name: z.string(),
  colour: z.string().nullable(),
  description: z.string().nullable(),
  parentId: z.string().nullable(),
} as const;
export const zFolderTable = zBaseLibraryEntityTable.extend(folderTableConfig);

export const folderFields = [
  "name",
  "colour",
  "description",
  "parentId",
] as const;

export const folderFieldVersionConfig = {
  folderId: z.string(),
  field: z.enum(folderFields),
} as const;
export const zFolderFieldVersionTable = zBaseFieldVersionTable.extend(
  folderFieldVersionConfig
);

export const SupplementTypeEnum = z.enum([
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
]);
export type SupplementType = z.infer<typeof SupplementTypeEnum>;
export const supplementTableConfig = {
  id: z.string(),
  name: z.string(),
  value: z.string(),
  type: SupplementTypeEnum,
  description: z.string().nullable(),
} as const;
export const zSupplementTable = zBaseLibraryEntityTable.extend(
  supplementTableConfig
);

export const supplementFields = [
  "name",
  "value",
  "type",
  "description",
] as const;

export const supplementFieldVersionConfig = {
  supplementId: z.string(),
  field: z.enum(supplementFields),
} as const;
export const zSupplementFieldVersionTable = zBaseFieldVersionTable.extend(
  supplementFieldVersionConfig
);

export const zLibraryTable = zBaseEntityTable.extend({
  name: z.string(),
  description: z.string().nullable(),
  ownedBy: z.string().nullable(),
});

export const libraryFields = ["name", "description", "ownedBy"] as const;
export const libraryFieldVersionConfig = {
  libraryId: z.string(),
  field: z.enum(libraryFields),
} as const;
export const zLibraryFieldVersionTable = zBaseFieldVersionTable.extend(
  libraryFieldVersionConfig
);

export const FeedTypeEnum = z.enum(["rss", "atom", "json"]);
export type FeedType = z.infer<typeof FeedTypeEnum>;
export const feedTableConfig = {
  name: z.string(),
  description: z.string().nullable(),
  ownedBy: z.string().nullable(),
  type: FeedTypeEnum,
  url: z.string(),
  count: z.number().nullable(),
  colour: z.string().nullable(),
} as const;
export const zFeedTable = zBaseLibraryEntityTable.extend(feedTableConfig);
export const feedFields = [
  "name",
  "description",
  "count",
  "colour",
  "url",
  "type",
] as const;
export const feedFieldVersionConfig = {
  feedId: z.string(),
  field: z.enum(feedFields),
} as const;
export const zFeedFieldVersionTable = zBaseFieldVersionTable.extend(
  feedFieldVersionConfig
);

export const paperAuthorRelationshipConfig = {
  paperId: z.string(),
  authorId: z.string(),
} as const;
export const zPaperAuthorTable = zBaseRelationshipTable.extend(
  paperAuthorRelationshipConfig
);

export const paperTagRelationshipConfig = {
  paperId: z.string(),
  tagId: z.string(),
} as const;
export const zPaperTagTable = zBaseRelationshipTable.extend(
  paperTagRelationshipConfig
);

export const paperFolderRelationshipConfig = {
  paperId: z.string(),
  folderId: z.string(),
} as const;
export const zPaperFolderTable = zBaseRelationshipTable.extend(
  paperFolderRelationshipConfig
);

export const paperSupplementRelationshipConfig = {
  paperId: z.string(),
  supplementId: z.string(),
} as const;
export const zPaperSupplementTable = zBaseRelationshipTable.extend(
  paperSupplementRelationshipConfig
);
