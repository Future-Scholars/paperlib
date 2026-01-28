
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
} from "@/service/services/database/sqlite/models"
import { z } from "zod"


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
  // DTO should not include localInsertedAt because it is not a server-side field
})

export const zPaperFieldVersion = zBaseFieldVersionDTO.extend({
  field: z.enum(paperFields),
  paperId: z.string().uuid(),
})

export const zAuthorFieldVersion = zBaseFieldVersionDTO.extend({
  field: z.enum(authorFields),
  authorId: z.string().uuid(),
})

export const zTagFieldVersion = zBaseFieldVersionDTO.extend({
  field: z.enum(tagFields),
  tagId: z.string().uuid(),
})

export const zFolderFieldVersion = zBaseFieldVersionDTO.extend({
  field: z.enum(folderFields),
  folderId: z.string().uuid(),
})

export const zSupplementFieldVersion = zBaseFieldVersionDTO.extend({
  field: z.enum(supplementFields),
  supplementId: z.string().uuid(),
})

export const zLibraryFieldVersion = zBaseFieldVersionDTO.extend({
  field: z.enum(libraryFields),
  // libraryId is not included in the DTO because it is the same as the libraryId in the base DTO
})

export const zFeedFieldVersion = zBaseFieldVersionDTO.extend({
  field: z.enum(feedFields),
  feedId: z.string().uuid(),
})

// Relationship DTOs - Derived from database models, removing server-side fields and converting date types
const zBaseRelationshipDTO = z.object({
  id: z.string().uuid(),
  libraryId: z.string().uuid(),
  op: z.enum(orSetOps),
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
  z.object({
    type: z.literal("field_version"),
    model: zEntityModel,
    data: zFieldVersionDto,
  }),
  z.object({
    type: z.literal("or_set"),
    model: zRelationshipModel,
    data: zRelationshipDto,
  }),
]);


export type ChangeRecord = z.infer<typeof zChangeRecord>


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
