import { z } from "zod";
import {
  authorFieldVersionConfig,
  entityModels,
  feedFieldVersionConfig,
  folderFieldVersionConfig,
  libraryFieldVersionConfig,
  paperAuthorRelationshipConfig,
  paperFieldVersionConfig,
  paperFolderRelationshipConfig,
  paperSupplementRelationshipConfig,
  paperTagRelationshipConfig,
  relationshipModels,
  supplementFieldVersionConfig,
  tagFieldVersionConfig,
  zBaseFieldVersionTable,
  zBaseRelationshipTable,
} from "../database/sqlite/models";

const zBaseFieldVersionDTO = zBaseFieldVersionTable
  .omit({
    timestamp: true,
    createdAt: true,
    deletedAt: true,
  })
  .extend({
    timestamp: z.string().datetime(),
    createdAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable(),
  });

export const zPaperFieldVersionDTO = zBaseFieldVersionDTO.extend(
  paperFieldVersionConfig
);

export const zAuthorFieldVersionDTO = zBaseFieldVersionDTO.extend(
  authorFieldVersionConfig
);

export const zTagFieldVersionDTO = zBaseFieldVersionDTO.extend(
  tagFieldVersionConfig
);

export const zFolderFieldVersionDTO = zBaseFieldVersionDTO.extend(
  folderFieldVersionConfig
);

export const zSupplementFieldVersionDTO = zBaseFieldVersionDTO.extend(
  supplementFieldVersionConfig
);

export const zLibraryFieldVersionDTO = zBaseFieldVersionDTO.extend(
  libraryFieldVersionConfig
);

export const zFeedFieldVersionDTO = zBaseFieldVersionDTO.extend(
  feedFieldVersionConfig
);

export const zBaseRelationshipDTO = zBaseRelationshipTable
  .omit({
    timestamp: true,
    createdAt: true,
    deletedAt: true,
  })
  .extend({
    timestamp: z.string().datetime(),
    createdAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable(),
  });

export const zPaperAuthorRelationshipDTO = zBaseRelationshipDTO.extend(
  paperAuthorRelationshipConfig
);

export const zPaperTagRelationshipDTO = zBaseRelationshipDTO.extend(
  paperTagRelationshipConfig
);

export const zPaperFolderRelationshipDTO = zBaseRelationshipDTO.extend(
  paperFolderRelationshipConfig
);

export const zPaperSupplementRelationshipDTO = zBaseRelationshipDTO.extend(
  paperSupplementRelationshipConfig
);

const zEntityModel = z.enum(entityModels);
const zFieldVersionDTO = z.union([
  zPaperFieldVersionDTO,
  zAuthorFieldVersionDTO,
  zTagFieldVersionDTO,
  zFolderFieldVersionDTO,
  zSupplementFieldVersionDTO,
  zLibraryFieldVersionDTO,
  zFeedFieldVersionDTO,
]);
const zRelationshipModel = z.enum(relationshipModels);
const zRelationshipDTO = z.union([
  zPaperAuthorRelationshipDTO,
  zPaperTagRelationshipDTO,
  zPaperFolderRelationshipDTO,
  zPaperSupplementRelationshipDTO,
]);
const zChangeRecord = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("field_version"),
    model: zEntityModel,
    data: zFieldVersionDTO,
  }),
  z.object({
    type: z.literal("or_set"),
    model: zRelationshipModel,
    data: zRelationshipDTO,
  }),
]);
const zContinuationToken = z.object({
  since_committed_at: z.string().datetime(),
  since_id: z.string().uuid(),
  limit: z.number().int().nonnegative().max(1000).default(1000).optional(),
});
const zSyncError = z.object({
  type: z.enum([
    "invalid_request",
    "internal_server_error",
    "permission_denied",
  ]),
  operation: z.string(),
  entityId: z.string().uuid().optional(),
  field: z.string().optional(),
  model: z.string(),
  errorCode: z.string().optional(),
  errorMessage: z.string(),
  prismaErrorCode: z.string().optional(),
  details: z.any().optional(),
});
export const zPushRequest = z.object({
  libraryId: z.string().uuid(),
  deviceId: z.string(),
  changes: z.array(zChangeRecord),
});
export const zPushResponse = z.discriminatedUnion("success", [
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
]);
export const zPullRequest = z.object({
  libraryId: z.string().uuid(),
  deviceId: z.string(),
  continuationToken: zContinuationToken.optional(),
});
export const zPullResponse = z.discriminatedUnion("success", [
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
]);

export const zAttachRequest = z.object({
  device: z.object({
    deviceId: z.string(),
  }),
  library: z.object({
    libraryId: z.string().uuid(),
    libraryName: z.string(),
  }),
});

const zAttachData = z.object({
  user: z.object({
    name: z.string(),
    defaultLibraryId: z.string().uuid(),
  }),
  attached: z.object({
    libraryId: z.string().uuid(),
    deviceId: z.string(),
    attachId: z.string().uuid(),
  }),
});

export const zAttachResponse = z.discriminatedUnion("success", [
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
]);
