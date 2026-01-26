
import {
  authorFields,
  entityModelSchemas,
  feedFields,
  folderFields,
  libraryFields,
  orSetOps,
  paperFields,
  relationshipModelSchemas,
  supplementFields,
  tagFields,
  zChangeStreamType,
  zFieldVersionModel
} from "@/service/services/database/sqlite/models"
import { z } from "zod"

function isOneOf<const T extends readonly string[]>(arr: T, val: string): val is T[number] {
  return (arr as readonly string[]).includes(val)
}

function zEntityField<const T extends readonly string[]>(fields: T) {
  return z.custom<T[number] | 'entity'>((val) =>
      typeof val === 'string' && (val === 'entity' || isOneOf(fields, val))
  )
}


// Field Version DTOs - Derived from database models, removing server-side fields and converting date types
const zBaseFieldVersionDTO = z.object({
  id: z.string().uuid(),
  libraryId: z.string().uuid(),
  value: z.string().nullable(),
  hash: z.string().nullable(),
  timestamp: z.string().datetime(),
  deviceId: z.string(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
  localInsertedAt: z.number().int(),
})

export const zPaperFieldVersion = zBaseFieldVersionDTO.extend({
  field: zEntityField(paperFields),
  paperId: z.string().uuid(),
})

export const zAuthorFieldVersion = zBaseFieldVersionDTO.extend({
  field: zEntityField(authorFields),
  authorId: z.string().uuid(),
})

export const zTagFieldVersion = zBaseFieldVersionDTO.extend({
  field: zEntityField(tagFields),
  tagId: z.string().uuid(),
})

export const zFolderFieldVersion = zBaseFieldVersionDTO.extend({
  field: zEntityField(folderFields),
  folderId: z.string().uuid(),
})

export const zSupplementFieldVersion = zBaseFieldVersionDTO.extend({
  field: zEntityField(supplementFields),
  supplementId: z.string().uuid(),
})

export const zLibraryFieldVersion = zBaseFieldVersionDTO.extend({
  field: zEntityField(libraryFields),
  libraryId: z.string().uuid(),
})

export const zFeedFieldVersion = zBaseFieldVersionDTO.extend({
  field: zEntityField(feedFields),
  feedId: z.string().uuid(),
})

// Relationship DTOs - Derived from database models, removing server-side fields and converting date types
const zBaseRelationshipDTO = z.object({
  id: z.string().uuid(),
  libraryId: z.string().uuid(),
  op: z.custom<(typeof orSetOps)[number] | 'entity'>((val) =>
      typeof val === 'string' && (val === 'entity' || isOneOf(orSetOps, val))
  ),
  timestamp: z.string().datetime(),
  deviceId: z.string(),
  createdAt: z.string().datetime(),
  createdByDeviceId: z.string(),
  deletedAt: z.string().datetime().nullable(),
  deletedByDeviceId: z.string().nullable(),
})
export const zPaperAuthor = zBaseRelationshipDTO.extend({
  paperId: z.string().uuid(),
  authorId: z.string().uuid(),
})

export const zPaperTag = zBaseRelationshipDTO.extend({
  paperId: z.string().uuid(),
  tagId: z.string().uuid(),
})

export const zPaperFolder = zBaseRelationshipDTO.extend({
  paperId: z.string().uuid(),
  folderId: z.string().uuid(),
})

export const zPaperSupplement = zBaseRelationshipDTO.extend({
  paperId: z.string().uuid(),
  supplementId: z.string().uuid(),
})

export const zFieldVersionDto = z.union([
  zPaperFieldVersion,
  zFeedFieldVersion,
  zFolderFieldVersion,
  zSupplementFieldVersion,
  zTagFieldVersion,
  zAuthorFieldVersion,
  zLibraryFieldVersion,
]);

export const zRelationshipDto = z.union([
  zPaperAuthor,
  zPaperTag,
  zPaperFolder,
  zPaperSupplement,
]);

export type EntityModel = keyof typeof entityModelSchemas
export type RelationshipModel = keyof typeof relationshipModelSchemas
export type FieldVersionTable = `${EntityModel}FieldVersion`

export const zEntityModel = z.custom<EntityModel>((val) =>
  typeof val === 'string' && val in entityModelSchemas
)

export const zRelationshipModel = z.custom<RelationshipModel>((val) =>
  typeof val === 'string' && val in relationshipModelSchemas
)

export type ChangeType = z.infer<typeof zChangeStreamType>

const zContinuationToken = z.object({
  since_committed_at: z.string().datetime(),
  since_id: z.string().uuid(),
  limit: z.number().int().nonnegative().max(1000).default(1000).optional(),
});

export type ContinuationToken = z.infer<typeof zContinuationToken>;

const zChangeRecord = z.discriminatedUnion('type', [
  // Field version changes - 为每个 entity model 创建独立的 schema
  z.object({
    type: z.literal("field_version"),
    model: z.literal("paper"),
    data: zPaperFieldVersion,
  }),
  z.object({
    type: z.literal("field_version"),
    model: z.literal("author"),
    data: zAuthorFieldVersion,
  }),
  z.object({
    type: z.literal("field_version"),
    model: z.literal("tag"),
    data: zTagFieldVersion,
  }),
  z.object({
    type: z.literal("field_version"),
    model: z.literal("folder"),
    data: zFolderFieldVersion,
  }),
  z.object({
    type: z.literal("field_version"),
    model: z.literal("supplement"),
    data: zSupplementFieldVersion,
  }),
  z.object({
    type: z.literal("field_version"),
    model: z.literal("library"),
    data: zLibraryFieldVersion,
  }),
  z.object({
    type: z.literal("field_version"),
    model: z.literal("feed"),
    data: zFeedFieldVersion,
  }),
  
  // Relationship changes - 为每个 relationship model 创建独立的 schema
  z.object({
    type: z.literal("or_set"),
    model: z.literal("paperAuthor"),
    data: zPaperAuthor,
  }),
  z.object({
    type: z.literal("or_set"),
    model: z.literal("paperTag"),
    data: zPaperTag,
  }),
  z.object({
    type: z.literal("or_set"),
    model: z.literal("paperFolder"),
    data: zPaperFolder,
  }),
  z.object({
    type: z.literal("or_set"),
    model: z.literal("paperSupplement"),
    data: zPaperSupplement,
  }),
]);


export type ChangeRecord = z.infer<typeof zChangeRecord>

// Helper functions to convert DTO format (dates as strings) to database model format (dates as numbers)
export function toFieldVersionModel<T extends z.infer<typeof zFieldVersionDto>>(dto: T) {
  return {
    ...dto,
    timestamp: new Date(dto.timestamp).getTime(),
    createdAt: new Date(dto.createdAt).getTime(),
    deletedAt: dto.deletedAt ? new Date(dto.deletedAt).getTime() : null,
  };
}

export function toRelationshipModel<T extends z.infer<typeof zRelationshipDto>>(dto: T) {
  return {
    ...dto,
    timestamp: new Date(dto.timestamp).getTime(),
    createdAt: new Date(dto.createdAt).getTime(),
    deletedAt: dto.deletedAt ? new Date(dto.deletedAt).getTime() : null,
  };
}

// Sync error type
const zSyncError = z.object({
  type: z.enum(["invalid_request", "internal_server_error", "permission_denied"]),
  operation: z.string(),
  entityId: z.string().uuid().optional(),
  field: z.string().optional(),
  model: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string(),
  details: z.any().optional()
})

export type SyncError = z.infer<typeof zSyncError>

export const zPushRequest = z.object({
  libraryId: z.string().uuid(),
  deviceId: z.string(),
  changes: z.array(zChangeRecord),
});

export type PushRequest = z.infer<typeof zPushRequest>

// Sync push response type
export const zPushResponse = z.discriminatedUnion('success', [
  z.object({
      success: z.literal(true),
      code: z.number(),
      message: z.string().optional(),
  }),
  z.object({
      success: z.literal(false),
      code: z.number(),
      message: z.string().optional(),
      errors: z.array(zSyncError),
  }),
])

export type PushResponse = z.infer<typeof zPushResponse>



export const zPullRequest = z.object({
  libraryId: z.string().uuid(),
  deviceId: z.string(),
  continuationToken: zContinuationToken.optional(),
})

export type PullRequest = z.infer<typeof zPullRequest>

export const zPullResponse = z.discriminatedUnion('success', [
  z.object({
      success: z.literal(true),
      code: z.number(),
      message: z.string().optional(),
      continuationToken: zContinuationToken.nullable(),
      data: z.array(zChangeRecord),
  }),
  z.object({
      success: z.literal(false),
      code: z.number(),
      message: z.string().optional(),
      errors: z.array(zSyncError),
  }),
])

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

const zAttachData = z.object({
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

export type AttachData = z.infer<typeof zAttachData>

export const zAttachResponse = z.discriminatedUnion('success', [
  z.object({
      success: z.literal(true),
      code: z.number(),
      message: z.string().optional(),
      data: zAttachData,
  }),
  z.object({
      success: z.literal(false),
      code: z.number(),
      message: z.string().optional(),
      errors: z.array(zSyncError),
  }),
])

export type AttachResponse = z.infer<typeof zAttachResponse>
