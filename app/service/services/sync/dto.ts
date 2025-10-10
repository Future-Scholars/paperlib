
import { z } from "zod"

const PaperTypeEnum = z.enum([
  'article', 'book', 'booklet', 'inproceedings', 'incollection', 'mastersthesis', 'phdthesis', 'inbook', 'techreport', 'proceedings', 'unpublished', 'misc', 'manual', 'online',
]);

type PaperType = z.infer<typeof PaperTypeEnum>;

const SupplementTypeEnum = z.enum([
  'text', 'file', 'image', 'video', 'audio', 'url', 'pdf', 'json', 'note', 'other', 'unknown',
]);

type SupplementType = z.infer<typeof SupplementTypeEnum>;

const FeedTypeEnum = z.enum(['rss', 'atom', 'json']);

type FeedType = z.infer<typeof FeedTypeEnum>;

const zPaper = z.object({
  id: z.string().uuid(),
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
  flag: z.boolean().nullable(),
  read: z.boolean().nullable(),
  rating: z.number().min(0).max(5).default(0),
  feedId: z.string().nullable(),
  feedItemId: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  updatedAt: z.string().datetime().nullable(),
  updatedByDeviceId: z.string().nullable(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});

type Paper = z.infer<typeof zPaper>;

const paperFields = [
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
] as const;

const zPaperFieldVersion = z.object({
  id: z.string().uuid(),
  paperId: z.string(),
  field: z.enum(paperFields),
  value: z.string().nullable(),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  hash: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});

type PaperFieldVersion = z.infer<typeof zPaperFieldVersion>;

const zAuthor = z.object({
  id: z.string().uuid(),
  name: z.string(),
  affiliation: z.string().nullable(),
  email: z.string().nullable(),
  orcid: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  updatedAt: z.string().datetime().nullable(),
  updatedByDeviceId: z.string().nullable(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});

type Author = z.infer<typeof zAuthor>;

const authorFields = [
  'name',
  'affiliation',
  'email',
  'orcid',
  'firstName',
  'lastName',
] as const;

const zAuthorFieldVersion = z.object({
  id: z.string().uuid(),
  authorId: z.string(),
  field: z.enum(authorFields),
  value: z.string().nullable(),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  createdAt: z.string(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});

type AuthorFieldVersion = z.infer<typeof zAuthorFieldVersion>;

const zTag = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  colour: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  updatedAt: z.string().datetime().nullable(),
  updatedByDeviceId: z.string().nullable(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});

type Tag = z.infer<typeof zTag>;

const tagFields = [
  'name',
  'description',
  'colour',
] as const;


const zTagFieldVersion = z.object({
  id: z.string().uuid(),
  tagId: z.string(),
  field: z.enum(tagFields),
  value: z.string().nullable(),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});

type TagFieldVersion = z.infer<typeof zTagFieldVersion>;

const zFolder = z.object({
  id: z.string().uuid(),
  name: z.string(),
  colour: z.string().nullable(),
  description: z.string().nullable(),
  parentId: z.string().nullable(),
  libraryId: z.string(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  updatedAt: z.string().datetime().nullable(),
  updatedByDeviceId: z.string().nullable(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});

type Folder = z.infer<typeof zFolder>;

const folderFields = [
  'name',
  'colour',
  'description',
  'parentId',
] as const;

const zFolderFieldVersion = z.object({
  id: z.string().uuid(),
  folderId: z.string(),
  field: z.enum(folderFields),
  value: z.string().nullable(),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
type FolderFieldVersion = z.infer<typeof zFolderFieldVersion>;

const zSupplement = z.object({
  id: z.string().uuid(),
  name: z.string(),
  value: z.string(),
  type: SupplementTypeEnum,
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  updatedAt: z.string().datetime().nullable(),
  updatedByDeviceId: z.string().nullable(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});

type Supplement = z.infer<typeof zSupplement>;

const supplementFields = [
  'name',
  'value',
  'type',
  'description',
] as const;

const zSupplementFieldVersion = z.object({
  id: z.string().uuid(),
  supplementId: z.string(),
  field: z.enum(supplementFields),
  value: z.string().nullable(),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});
type SupplementFieldVersion = z.infer<typeof zSupplementFieldVersion>;

const zLibrary = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  ownedBy: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  updatedAt: z.string().datetime().nullable(),
  updatedByDeviceId: z.string().nullable(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});

type Library = z.infer<typeof zLibrary>;

const libraryFields = [
  'name',
  'description',
  'ownedBy',
] as const;

const zLibraryFieldVersion = z.object({
  id: z.string().uuid(),
  libraryId: z.string(),
  field: z.enum(libraryFields),
  value: z.string().nullable(),
  timestamp: z.number().positive(),
  deviceId: z.string(),
});

type LibraryFieldVersion = z.infer<typeof zLibraryFieldVersion>;

const zFeed = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  libraryId: z.string(),
  type: FeedTypeEnum,
  url: z.string(),
  count: z.number().default(0),
  colour: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  updatedAt: z.string().datetime().nullable(),
  updatedByDeviceId: z.string().nullable(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});

type Feed = z.infer<typeof zFeed>;

const feedFields = [
  'name',
  'description',
  'count',
  'colour',
  'url',
  'type',
] as const;

const zFeedFieldVersion = z.object({
  id: z.string().uuid(),
  feedId: z.string(),
  field: z.enum(feedFields),
  value: z.string().nullable(),
  timestamp: z.number().positive(),
  deviceId: z.string(),
  hash: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
});

type FeedFieldVersion = z.infer<typeof zFeedFieldVersion>;

const zPaperAuthor = z.object({
  id: z.string().uuid(),
  paperId: z.string(),
  authorId: z.string(),
  op: z.enum(['add', 'remove']),
  timestamp: z.number().positive(),
  deviceId: z.string(),
});
type PaperAuthor = z.infer<typeof zPaperAuthor>;

const zPaperTag = z.object({
  id: z.string().uuid(),
  paperId: z.string(),
  tagId: z.string(),
  op: z.enum(['add', 'remove']),
  timestamp: z.number().positive(),
  deviceId: z.string(),
});
type PaperTag = z.infer<typeof zPaperTag>;

const zPaperFolder = z.object({
  id: z.string().uuid(),
  paperId: z.string(),
  folderId: z.string(),
  op: z.enum(['add', 'remove']),
  timestamp: z.number().positive(),
  deviceId: z.string(),
});
type PaperFolder = z.infer<typeof zPaperFolder>;

const zPaperSupplement = z.object({
  id: z.string().uuid(),
  paperId: z.string(),
  supplementId: z.string(),
  op: z.enum(['add', 'remove']),
  timestamp: z.number().positive(),
  deviceId: z.string(),
});
type PaperSupplement = z.infer<typeof zPaperSupplement>;

const cslSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  title: z.string().optional(),
  authors: z.array(z.object({
      family: z.string().optional(),
      given: z.string().optional(),
  })),
  issued: z.object({
      'date-parts': z.array(z.array(z.number())),
  }).optional(),
  "container-title": z.string().optional(),
  publichser: z.string(),
  page: z.string().optional(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  DOI: z.string().optional(),
});



export const zEntityModel = z.enum([
  "paper",
  "feed",
  "folder",
  "supplement",
  "author",
  "tag",
  "library"
])

export type EntityModel = z.infer<typeof zEntityModel>

export const zEntityField = zPaperFieldVersion
  .or(zFeedFieldVersion)
  .or(zFolderFieldVersion)
  .or(zSupplementFieldVersion)
  .or(zTagFieldVersion)
  .or(zAuthorFieldVersion)

export const zEntityData = zPaper
  .or(zFolder)
  .or(zFeed)
  .or(zAuthor)
  .or(zSupplement)
  .or(zTag)
  .or(zLibrary)

export const zRelationshipModel = z.enum([
  "paperAuthor",
  "paperTag",
  "paperFolder",
  "paperSupplement"
])

export type RelationshipModel = z.infer<typeof zRelationshipModel>

export const zRelationData = zPaperAuthor.or(zPaperTag).or(zPaperFolder)

// 实体创建操作
export const zEntityCreate = z.object({
  model: z.literal("paper"),
  data: zPaper
}).or(z.object({
  model: z.literal("feed"),
  data: zFeed
})).or(z.object({
  model: z.literal("folder"),
  data: zFolder
})).or(z.object({
  model: z.literal("author"),
  data: zAuthor
})).or(z.object({
  model: z.literal("supplement"),
  data: zSupplement
})).or(z.object({
  model: z.literal("tag"),
  data: zTag
})).or(z.object({
  model: z.literal("feed"),
  data: zFeed
}))

export type EntityCreate = z.infer<typeof zEntityCreate>

// 实体删除操作（软删除）
export const zEntityDelete = z.object({
  model: z.literal("paper"),
  data: zPaper
}).or(z.object({
  model: z.literal("feed"),
  data: zFeed
})).or(z.object({
  model: z.literal("folder"),
  data: zFolder
})).or(z.object({
  model: z.literal("author"),
  data: zAuthor
})).or(z.object({
  model: z.literal("supplement"),
  data: zSupplement
})).or(z.object({
  model: z.literal("tag"),
  data: zTag
})).or(z.object({
  model: z.literal("feed"),
  data: zFeed
}))

export type EntityDelete = z.infer<typeof zEntityDelete>

export const zFieldChange = z.object({
  model: z.literal("paper"),
  data: zPaperFieldVersion
}).or(z.object({
  model: z.literal("feed"),
  data: zFeedFieldVersion
})).or(z.object({
  model: z.literal("folder"),
  data: zFolderFieldVersion
})).or(z.object({
  model: z.literal("author"),
  data: zAuthorFieldVersion
})).or(z.object({
  model: z.literal("supplement"),
  data: zSupplementFieldVersion
})).or(z.object({
  model: z.literal("tag"),
  data: zTagFieldVersion
}))

export type FieldChange = z.infer<typeof zFieldChange>

export const zRelationChange = z.object({
  model: z.literal("paperAuthor"),
  data: zPaperAuthor
}).or(z.object({
  model: z.literal("paperTag"),
  data: zPaperTag
})).or(z.object({
  model: z.literal("paperFolder"),
  data: zPaperFolder
})).or(z.object({
  model: z.literal("paperSupplement"),
  data: zPaperSupplement
}))

export type RelationChange = z.infer<typeof zRelationChange>

const syncData = z.object({
  entityCreates: z.array(zEntityCreate).default([]),
  entityDeletes: z.array(zEntityDelete).default([]),
  fieldsChanges: z.array(zFieldChange).default([]),
  relationChanges: z.array(zRelationChange).default([]),
})

export const zPushRequest = z.object({
  libraryId: z.string().uuid(),
  deviceId: z.string(),
}).merge(syncData)

export type PushRequest = z.infer<typeof zPushRequest>


export const zPullRequest = z.object({
  libraryId: z.string().uuid(),
  since: z.string().datetime(),  // Last sync timestamp
  deviceId: z.string(),
})

export type PullRequest = z.infer<typeof zPullRequest>

// 同步错误类型定义
export const zSyncError = z.object({
  type: z.enum(['entityCreate', 'entityDelete', 'fieldChange', 'relationChange']),
  operation: z.string(),
  entityId: z.string().uuid().optional(),
  field: z.string().optional(),
  model: z.string(),
  errorCode: z.string().optional(),
  errorMessage: z.string(),
  prismaErrorCode: z.string().optional(),
  details: z.any().optional()
})

export type SyncError = z.infer<typeof zSyncError>

// 同步响应类型
export const zSyncPushResponse = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string().optional(),
  errors: z.array(zSyncError).optional()
})

export type SyncPushResponse = z.infer<typeof zSyncPushResponse>

export const zPullResponse = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string().optional(),
  errors: z.array(z.any()).optional()
}).merge(syncData)

export type PullResponse = z.infer<typeof zPullResponse>

export const zAttachRequest = z.object({
  device: z.object({
      deviceId: z.string(),
  }),
  library: z.object({
      libraryId: z.string().uuid(),
      libraryName: z.string()
  })
})

export type AttachRequest = z.infer<typeof zAttachRequest>

export const zAttachResponse = z.object({
  user: z.object({
      name: z.string(),
      defaultLibraryId: z.string().uuid()
  }),
  attached: z.object({
      libraryId: z.string().uuid(),
      deviceId: z.string(),
      attachId: z.string().uuid()
  })
})

export type AttachResponse = z.infer<typeof zAttachResponse>
