import type { Transaction } from '@/service/services/database/sqlite/db'
import type { RelationChange } from '@/service/services/sync/dto'
import type {
  PaperTag as SqlitePaperTag,
  PaperAuthor as SqlitePaperAuthor,
  PaperFolder as SqlitePaperFolder,
  PaperSupplement as SqlitePaperSupplement,
} from '@/service/services/database/sqlite/models'
import { LogService } from '@/common/services/log-service'

/**
 * Merge Paper-Tag OR-Set
 * @param tx Kysely transaction client
 * @param relationChange RelationChange
 * @param logger - Optional logger for debugging
 * @returns Updated sqlite paperTag object
 */
export async function mergePaperTagORSet(
  tx: Transaction,
  relationChange: RelationChange & { model: 'paperTag' },
  logger?: LogService
): Promise<SqlitePaperTag> {
  logger?.info(
    `[CRDT] Starting OR-Set merge for paperTag`,
    `paperId: ${relationChange.data.paperId}, tagId: ${relationChange.data.tagId}, op: ${relationChange.data.op}, timestamp: ${relationChange.data.timestamp}`,
    false,
    "CRDT"
  );

  const existing = await tx
    .selectFrom('paperTag')
    .selectAll()
    .where('paperId', '=', relationChange.data.paperId)
    .where('tagId', '=', relationChange.data.tagId)
    .orderBy('timestamp', 'desc')
    .executeTakeFirst()

  if (existing) {
    logger?.info(
      `[CRDT] Found existing paperTag operation`,
      `paperId: ${relationChange.data.paperId}, tagId: ${relationChange.data.tagId}, existingTimestamp: ${existing.timestamp}, existingOp: ${existing.op}`,
      false,
      "CRDT"
    );
  } else {
    logger?.info(
      `[CRDT] No existing paperTag operation found`,
      `paperId: ${relationChange.data.paperId}, tagId: ${relationChange.data.tagId}`,
      false,
      "CRDT"
    );
  }

  await tx
    .insertInto('paperTag')
    .values({
      id: crypto.randomUUID(),
      paperId: relationChange.data.paperId,
      tagId: relationChange.data.tagId,
      op: relationChange.data.op,
      timestamp: relationChange.data.timestamp,
      deviceId: relationChange.data.deviceId,
      createdAt: new Date(relationChange.data.timestamp).getTime(),
      createdByDeviceId: relationChange.data.deviceId,
    })
    .execute()

  logger?.info(
    `[CRDT] Inserted new paperTag operation`,
    `paperId: ${relationChange.data.paperId}, tagId: ${relationChange.data.tagId}, op: ${relationChange.data.op}`,
    false,
    "CRDT"
  );

  if (existing && existing.timestamp >= relationChange.data.timestamp) {
    // Existing operation is newer. Although the final state may change, we still need to record the operation.
    logger?.info(
      `[CRDT] Existing operation is newer, returning existing`,
      `paperId: ${relationChange.data.paperId}, tagId: ${relationChange.data.tagId}, existingTimestamp: ${existing.timestamp}, incomingTimestamp: ${relationChange.data.timestamp}`,
      false,
      "CRDT"
    );
    return existing
  }
  const created = await tx
    .selectFrom('paperTag')
    .selectAll()
    .where('id', '=', relationChange.data.id)
    .executeTakeFirst()
  if (!created) {
    const error = `Failed to create paperTag ${relationChange.data.id}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }

  logger?.info(
    `[CRDT] Successfully merged paperTag OR-Set`,
    `paperId: ${relationChange.data.paperId}, tagId: ${relationChange.data.tagId}, op: ${relationChange.data.op}`,
    false,
    "CRDT"
  );

  return created
}

/**
 * Merge Paper-Author OR-Set
 * @param tx Kysely transaction client
 * @param relationChange RelationChange
 * @param logger - Optional logger for debugging
 * @return Updated sqlite paperAuthor object
 */
export async function mergePaperAuthorORSet(
  tx: Transaction,
  relationChange: RelationChange & { model: 'paperAuthor' },
  logger?: LogService
): Promise<SqlitePaperAuthor> {
  logger?.info(
    `[CRDT] Starting OR-Set merge for paperAuthor`,
    `paperId: ${relationChange.data.paperId}, authorId: ${relationChange.data.authorId}, op: ${relationChange.data.op}, timestamp: ${relationChange.data.timestamp}`,
    false,
    "CRDT"
  );

  const existing = await tx
    .selectFrom('paperAuthor')
    .selectAll()
    .where('paperId', '=', relationChange.data.paperId)
    .where('authorId', '=', relationChange.data.authorId)
    .orderBy('timestamp', 'desc')
    .executeTakeFirst()

  if (existing) {
    logger?.info(
      `[CRDT] Found existing paperAuthor operation`,
      `paperId: ${relationChange.data.paperId}, authorId: ${relationChange.data.authorId}, existingTimestamp: ${existing.timestamp}, existingOp: ${existing.op}`,
      false,
      "CRDT"
    );
  } else {
    logger?.info(
      `[CRDT] No existing paperAuthor operation found`,
      `paperId: ${relationChange.data.paperId}, authorId: ${relationChange.data.authorId}`,
      false,
      "CRDT"
    );
  }

  await tx
    .insertInto('paperAuthor')
    .values({
      id: relationChange.data.id,
      paperId: relationChange.data.paperId,
      authorId: relationChange.data.authorId,
      op: relationChange.data.op,
      timestamp: relationChange.data.timestamp,
      deviceId: relationChange.data.deviceId,
      createdAt: new Date(relationChange.data.timestamp).getTime(),
      createdByDeviceId: relationChange.data.deviceId,
    })
    .execute()

  logger?.info(
    `[CRDT] Inserted new paperAuthor operation`,
    `paperId: ${relationChange.data.paperId}, authorId: ${relationChange.data.authorId}, op: ${relationChange.data.op}`,
    false,
    "CRDT"
  );

  if (existing && existing.timestamp >= relationChange.data.timestamp) {
    // Existing operation is newer. Although the final state may change, we still need to record the operation.
    logger?.info(
      `[CRDT] Existing operation is newer, returning existing`,
      `paperId: ${relationChange.data.paperId}, authorId: ${relationChange.data.authorId}, existingTimestamp: ${existing.timestamp}, incomingTimestamp: ${relationChange.data.timestamp}`,
      false,
      "CRDT"
    );
    return existing
  }
  const created = await tx
    .selectFrom('paperAuthor')
    .selectAll()
    .where('id', '=', relationChange.data.id)
    .executeTakeFirst()
  if (!created) {
    const error = `Failed to create paperAuthor ${relationChange.data.id}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }

  logger?.info(
    `[CRDT] Successfully merged paperAuthor OR-Set`,
    `paperId: ${relationChange.data.paperId}, authorId: ${relationChange.data.authorId}, op: ${relationChange.data.op}`,
    false,
    "CRDT"
  );

  return created
}

/**
 * Merge Paper-Folder OR-Set
 * @param tx Kysely transaction client
 * @param relationChange RelationChange
 * @param logger - Optional logger for debugging
 * @return Updated sqlite paperFolder object
 */
export async function mergePaperFolderORSet(
  tx: Transaction,
  relationChange: RelationChange & { model: 'paperFolder' },
  logger?: LogService
): Promise<SqlitePaperFolder> {
  logger?.info(
    `[CRDT] Starting OR-Set merge for paperFolder`,
    `paperId: ${relationChange.data.paperId}, folderId: ${relationChange.data.folderId}, op: ${relationChange.data.op}, timestamp: ${relationChange.data.timestamp}`,
    false,
    "CRDT"
  );

  const existing = await tx
    .selectFrom('paperFolder')
    .selectAll()
    .where('paperId', '=', relationChange.data.paperId)
    .where('folderId', '=', relationChange.data.folderId)
    .orderBy('timestamp', 'desc')
    .executeTakeFirst()

  if (existing) {
    logger?.info(
      `[CRDT] Found existing paperFolder operation`,
      `paperId: ${relationChange.data.paperId}, folderId: ${relationChange.data.folderId}, existingTimestamp: ${existing.timestamp}, existingOp: ${existing.op}`,
      false,
      "CRDT"
    );
  } else {
    logger?.info(
      `[CRDT] No existing paperFolder operation found`,
      `paperId: ${relationChange.data.paperId}, folderId: ${relationChange.data.folderId}`,
      false,
      "CRDT"
    );
  }

  await tx
    .insertInto('paperFolder')
    .values({
      id: crypto.randomUUID(),
      paperId: relationChange.data.paperId,
      folderId: relationChange.data.folderId,
      op: relationChange.data.op,
      timestamp: relationChange.data.timestamp,
      deviceId: relationChange.data.deviceId,
      createdAt: new Date(relationChange.data.timestamp).getTime(),
      createdByDeviceId: relationChange.data.deviceId,
    })
    .execute()

  logger?.info(
    `[CRDT] Inserted new paperFolder operation`,
    `paperId: ${relationChange.data.paperId}, folderId: ${relationChange.data.folderId}, op: ${relationChange.data.op}`,
    false,
    "CRDT"
  );

  if (existing && existing.timestamp >= relationChange.data.timestamp) {
    // Existing operation is newer. Although the final state may change, we still need to record the operation.
    logger?.info(
      `[CRDT] Existing operation is newer, returning existing`,
      `paperId: ${relationChange.data.paperId}, folderId: ${relationChange.data.folderId}, existingTimestamp: ${existing.timestamp}, incomingTimestamp: ${relationChange.data.timestamp}`,
      false,
      "CRDT"
    );
    return existing
  }
  const created = await tx
    .selectFrom('paperFolder')
    .selectAll()
    .where('id', '=', relationChange.data.id)
    .executeTakeFirst()
  if (!created) {
    const error = `Failed to create paperFolder ${relationChange.data.id}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }

  logger?.info(
    `[CRDT] Successfully merged paperFolder OR-Set`,
    `paperId: ${relationChange.data.paperId}, folderId: ${relationChange.data.folderId}, op: ${relationChange.data.op}`,
    false,
    "CRDT"
  );

  return created
}

/**
 * Merge Paper-Supplement OR-Set
 * @param tx Kysely transaction client
 * @param relationChange RelationChange
 * @param logger - Optional logger for debugging
 * @return Updated sqlite paperSupplement object
 */
export async function mergePaperSupplementORSet(
  tx: Transaction,
  relationChange: RelationChange & { model: 'paperSupplement' },
  logger?: LogService
): Promise<SqlitePaperSupplement> {
  logger?.info(
    `[CRDT] Starting OR-Set merge for paperSupplement`,
    `paperId: ${relationChange.data.paperId}, supplementId: ${relationChange.data.supplementId}, op: ${relationChange.data.op}, timestamp: ${relationChange.data.timestamp}`,
    false,
    "CRDT"
  );

  const existing = await tx
    .selectFrom('paperSupplement')
    .selectAll()
    .where('paperId', '=', relationChange.data.paperId)
    .where('supplementId', '=', relationChange.data.supplementId)
    .orderBy('timestamp', 'desc')
    .executeTakeFirst()

  if (existing) {
    logger?.info(
      `[CRDT] Found existing paperSupplement operation`,
      `paperId: ${relationChange.data.paperId}, supplementId: ${relationChange.data.supplementId}, existingTimestamp: ${existing.timestamp}, existingOp: ${existing.op}`,
      false,
      "CRDT"
    );
  } else {
    logger?.info(
      `[CRDT] No existing paperSupplement operation found`,
      `paperId: ${relationChange.data.paperId}, supplementId: ${relationChange.data.supplementId}`,
      false,
      "CRDT"
    );
  }

  await tx
    .insertInto('paperSupplement')
    .values({
      id: crypto.randomUUID(),
      paperId: relationChange.data.paperId,
      supplementId: relationChange.data.supplementId,
      op: relationChange.data.op,
      timestamp: relationChange.data.timestamp,
      deviceId: relationChange.data.deviceId,
      createdAt: new Date(relationChange.data.timestamp).getTime(),
      createdByDeviceId: relationChange.data.deviceId,
    })
    .execute()

  logger?.info(
    `[CRDT] Inserted new paperSupplement operation`,
    `paperId: ${relationChange.data.paperId}, supplementId: ${relationChange.data.supplementId}, op: ${relationChange.data.op}`,
    false,
    "CRDT"
  );

  if (existing && existing.timestamp >= relationChange.data.timestamp) {
    // Existing operation is newer. Although the final state may change, we still need to record the operation.
    logger?.info(
      `[CRDT] Existing operation is newer, returning existing`,
      `paperId: ${relationChange.data.paperId}, supplementId: ${relationChange.data.supplementId}, existingTimestamp: ${existing.timestamp}, incomingTimestamp: ${relationChange.data.timestamp}`,
      false,
      "CRDT"
    );
    return existing
  }
  const created = await tx
    .selectFrom('paperSupplement')
    .selectAll()
    .where('id', '=', relationChange.data.id)
    .executeTakeFirst()
  if (!created) {
    const error = `Failed to create paperSupplement ${relationChange.data.id}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }

  logger?.info(
    `[CRDT] Successfully merged paperSupplement OR-Set`,
    `paperId: ${relationChange.data.paperId}, supplementId: ${relationChange.data.supplementId}, op: ${relationChange.data.op}`,
    false,
    "CRDT"
  );

  return created
}
