import {
  zAuthor,
  zAuthorFieldVersion,
  zFeed,
  zFeedFieldVersion,
  zFolder,
  zFolderFieldVersion,
  zLibrary,
  zPaper,
  zPaperAuthor,
  zPaperFieldVersion,
  zPaperFolder,
  zPaperSupplement,
  zPaperTag,
  zSupplement,
  zSupplementFieldVersion,
  zTag,
  zTagFieldVersion
} from "@/service/services/database/sqlite/models"
import { z } from "zod"

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
