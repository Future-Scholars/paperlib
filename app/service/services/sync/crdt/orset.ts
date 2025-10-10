import type { Transaction } from '@/service/services/database/sqlite/db'
import type { RelationChange } from '@/service/services/sync/dto'
import type {
  PaperTag as SqlitePaperTag,
  PaperAuthor as SqlitePaperAuthor,
  PaperFolder as SqlitePaperFolder,
  PaperSupplement as SqlitePaperSupplement,
} from '@/service/services/database/sqlite/models'

/**
 * Merge Paper-Tag OR-Set
 * @param tx Kysely transaction client
 * @param relationChange RelationChange
 * @returns Updated sqlite paperTag object
 */
export async function mergePaperTagORSet(
  tx: Transaction,
  relationChange: RelationChange & { model: 'paperTag' }
): Promise<SqlitePaperTag> {
  const existing = await tx
    .selectFrom('paperTag')
    .selectAll()
    .where('paperId', '=', relationChange.data.paperId)
    .where('tagId', '=', relationChange.data.tagId)
    .orderBy('timestamp', 'desc')
    .executeTakeFirst()

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

  if (existing && existing.timestamp >= relationChange.data.timestamp) {
    // Existing operation is newer. Although the final state may change, we still need to record the operation.
    return existing
  }
  const created = await tx
    .selectFrom('paperTag')
    .selectAll()
    .where('id', '=', relationChange.data.id)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create paperTag ${relationChange.data.id}`)
  }
  return created
}

/**
 * Merge Paper-Author OR-Set
 * @param tx Kysely transaction client
 * @param relationChange RelationChange
 * @return Updated sqlite paperAuthor object
 */
export async function mergePaperAuthorORSet(
  tx: Transaction,
  relationChange: RelationChange & { model: 'paperAuthor' }
): Promise<SqlitePaperAuthor> {
  const existing = await tx
    .selectFrom('paperAuthor')
    .selectAll()
    .where('paperId', '=', relationChange.data.paperId)
    .where('authorId', '=', relationChange.data.authorId)
    .orderBy('timestamp', 'desc')
    .executeTakeFirst()

  await tx
    .insertInto('paperAuthor')
    .values({
      id: crypto.randomUUID(),
      paperId: relationChange.data.paperId,
      authorId: relationChange.data.authorId,
      op: relationChange.data.op,
      timestamp: relationChange.data.timestamp,
      deviceId: relationChange.data.deviceId,
      createdAt: new Date(relationChange.data.timestamp).getTime(),
      createdByDeviceId: relationChange.data.deviceId,
    })
    .execute()

  if (existing && existing.timestamp >= relationChange.data.timestamp) {
    // Existing operation is newer. Although the final state may change, we still need to record the operation.
    return existing
  }
  const created = await tx
    .selectFrom('paperAuthor')
    .selectAll()
    .where('id', '=', relationChange.data.id)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create paperAuthor ${relationChange.data.id}`)
  }
  return created
}

/**
 * Merge Paper-Folder OR-Set
 * @param tx Kysely transaction client
 * @param relationChange RelationChange
 * @return Updated sqlite paperFolder object
 */
export async function mergePaperFolderORSet(
  tx: Transaction,
  relationChange: RelationChange & { model: 'paperFolder' }
): Promise<SqlitePaperFolder> {
  const existing = await tx
    .selectFrom('paperFolder')
    .selectAll()
    .where('paperId', '=', relationChange.data.paperId)
    .where('folderId', '=', relationChange.data.folderId)
    .orderBy('timestamp', 'desc')
    .executeTakeFirst()

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

  if (existing && existing.timestamp >= relationChange.data.timestamp) {
    // Existing operation is newer. Although the final state may change, we still need to record the operation.
    return existing
  }
  const created = await tx
    .selectFrom('paperFolder')
    .selectAll()
    .where('id', '=', relationChange.data.id)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create paperFolder ${relationChange.data.id}`)
  }
  return created
}

/**
 * Merge Paper-Supplement OR-Set
 * @param tx Kysely transaction client
 * @param relationChange RelationChange
 * @return Updated sqlite paperSupplement object
 */
export async function mergePaperSupplementORSet(
  tx: Transaction,
  relationChange: RelationChange & { model: 'paperSupplement' }
): Promise<SqlitePaperSupplement> {
  const existing = await tx
    .selectFrom('paperSupplement')
    .selectAll()
    .where('paperId', '=', relationChange.data.paperId)
    .where('supplementId', '=', relationChange.data.supplementId)
    .orderBy('timestamp', 'desc')
    .executeTakeFirst()

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

  if (existing && existing.timestamp >= relationChange.data.timestamp) {
    // Existing operation is newer. Although the final state may change, we still need to record the operation.
    return existing
  }
  const created = await tx
    .selectFrom('paperSupplement')
    .selectAll()
    .where('id', '=', relationChange.data.id)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create paperSupplement ${relationChange.data.id}`)
  }
  return created
}
