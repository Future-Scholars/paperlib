import type { Transaction } from '@/service/services/database/sqlite/db'
import type { FieldChange } from '@/service/services/sync/dto'
import { SyncCrdtError } from './utils'
import type {
  Paper as SqlitePaper,
  Feed as SqliteFeed,
  Author as SqliteAuthor,
  Tag as SqliteTag,
  Folder as SqliteFolder,
  Supplement as SqliteSupplement,
} from '@/service/services/database/sqlite/models'

/**
 * Merge paper fields using Last-Write-Wins (LWW) strategy
 * @param tx - Kysely transaction client
 * @param fieldChange - Field change to merge
 * @returns Updated sqlite paper object
 * @throws SyncCrdtError if paper or version does not exist
 */
export async function mergePaperFieldLWW(
  tx: Transaction,
  fieldChange: FieldChange & { model: "paper" }
): Promise<SqlitePaper> {
  const paperArray = await tx
    .selectFrom('paper')
    .selectAll()
    .where('id', '=', fieldChange.data.paperId)
    .execute()
  if (paperArray.length > 1) {
    throw new Error(`Multiple papers found for id ${fieldChange.data.paperId}`)
  }
  const paper = paperArray[0]
  if (!paper) {
    // Paper does not exist, cannot merge, throw error
    throw new SyncCrdtError(`No paper found with id ${fieldChange.data.paperId}`)
  }

  // Check if the change is newer than the current value
  const version = await tx
    .selectFrom('paperFieldVersion')
    .selectAll()
    .where('paperId', '=', fieldChange.data.paperId)
    .where('field', '=', fieldChange.data.field)
    .orderBy('timestamp', 'desc')
    .executeTakeFirst()

  if (!version) {
    // No version exists, cannot merge, throw error
    throw new SyncCrdtError(`No version found for paper ${fieldChange.data.paperId} field ${fieldChange.data.field}`)
  }

  if (
    (fieldChange.data.value && paper[fieldChange.data.field] === JSON.parse(fieldChange.data.value)) ||
    (!fieldChange.data.value && paper[fieldChange.data.field] === null) ||
    (fieldChange.data.value === null && paper[fieldChange.data.field] === null)
  ) {
    // No change in value, no need to merge
    return paper
  }

  if (version.timestamp > fieldChange.data.timestamp) {
    // Current value is newer, ignore the change
    return paper
  }

  // Merge the field change
  await tx
    .updateTable('paper')
    .set({ [fieldChange.data.field]: fieldChange.data.value })
    .where('id', '=', fieldChange.data.paperId)
    .execute()

  await tx
    .updateTable('paperFieldVersion')
    .set({
      value: fieldChange.data.value,
      timestamp: fieldChange.data.timestamp,
      deviceId: fieldChange.data.deviceId,
      createdAt: new Date(fieldChange.data.createdAt).getTime(),
      createdByDeviceId: fieldChange.data.createdByDeviceId,
    })
    .where('paperId', '=', fieldChange.data.paperId)
    .where('field', '=', fieldChange.data.field)
    .execute()

  const created = await tx
    .selectFrom('paper')
    .selectAll()
    .where('id', '=', fieldChange.data.paperId)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create paper ${fieldChange.data.paperId}`)
  }
  return created
}

/**
 * Merge feed fields using Last-Write-Wins (LWW) strategy
 * @param tx - Kysely transaction client
 * @param fieldChange - Field change to merge
 * @returns Updated sqlite feed object
 * @throws SyncCrdtError if feed or version does not exist
 */
export async function mergeFeedFieldLWW(
  tx: Transaction,
  fieldChange: FieldChange & { model: "feed" }
): Promise<SqliteFeed> {
  const feedArray = await tx
    .selectFrom('feed')
    .selectAll()
    .where('id', '=', fieldChange.data.feedId)
    .execute()
  if (feedArray.length > 1) {
    throw new Error(`Multiple feeds found for id ${fieldChange.data.feedId}`)
  }
  const feed = feedArray[0]

  if (!feed) {
    // Feed does not exist, cannot merge, throw error
    throw new SyncCrdtError(`No feed found with id ${fieldChange.data.feedId}`)
  }

  // Check if the change is newer than the current value
  const version = await tx
    .selectFrom('feedFieldVersion')
    .selectAll()
    .where('feedId', '=', fieldChange.data.feedId)
    .where('field', '=', fieldChange.data.field)
    .orderBy('timestamp', 'desc')
    .executeTakeFirst()

  if (!version) {
    // No version exists, cannot merge, throw error
    throw new SyncCrdtError(`No version found for feed ${fieldChange.data.feedId} field ${fieldChange.data.field}`)
  }

  if (
    (fieldChange.data.value && feed[fieldChange.data.field] === JSON.parse(fieldChange.data.value)) ||
    (!fieldChange.data.value && feed[fieldChange.data.field] === null) ||
    (fieldChange.data.value === null && feed[fieldChange.data.field] === null)
  ) {
    // No change in value, no need to merge
    return feed
  }

  if (version.timestamp > fieldChange.data.timestamp) {
    // Current value is newer, ignore the change
    return feed
  }

  // Merge the field change
  await tx
    .updateTable('feed')
    .set({ [fieldChange.data.field]: fieldChange.data.value })
    .where('id', '=', fieldChange.data.feedId)
    .execute()

  await tx
    .updateTable('feedFieldVersion')
    .set({
      value: fieldChange.data.value,
      timestamp: fieldChange.data.timestamp,
      deviceId: fieldChange.data.deviceId,
      hash: fieldChange.data.hash,
      createdAt: new Date(fieldChange.data.createdAt).getTime(),
      createdByDeviceId: fieldChange.data.createdByDeviceId,
    })
    .where('feedId', '=', fieldChange.data.feedId)
    .where('field', '=', fieldChange.data.field)
    .execute()

  const created = await tx
    .selectFrom('feed')
    .selectAll()
    .where('id', '=', fieldChange.data.feedId)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create feed ${fieldChange.data.feedId}`)
  }
  return created
}

/**
 * Merge author fields using Last-Write-Wins (LWW) strategy
 * @param tx - Kysely transaction client
 * @param fieldChange - Field change to merge
 * @returns Updated sqlite author object
 * @throws SyncCrdtError if author or version does not exist
 */
export async function mergeAuthorFieldLWW(
  tx: Transaction,
  fieldChange: FieldChange & { model: "author" }
): Promise<SqliteAuthor> {
  const authorArray = await tx
    .selectFrom('author')
    .selectAll()
    .where('id', '=', fieldChange.data.authorId)
    .execute()
  if (authorArray.length > 1) {
    throw new Error(`Multiple authors found for id ${fieldChange.data.authorId}`)
  }
  const author = authorArray[0]

  if (!author) {
    // Author does not exist, cannot merge, throw error
    throw new SyncCrdtError(`No author found with id ${fieldChange.data.authorId}`)
  }

  // Check if the change is newer than the current value
  const version = await tx
    .selectFrom('authorFieldVersion')
    .selectAll()
    .where('authorId', '=', fieldChange.data.authorId)
    .where('field', '=', fieldChange.data.field)
    .orderBy('timestamp', 'desc')
    .executeTakeFirst()

  if (!version) {
    // No version exists, cannot merge, throw error
    throw new SyncCrdtError(`No version found for author ${fieldChange.data.authorId} field ${fieldChange.data.field}`)
  }

  if (
    (fieldChange.data.value && author[fieldChange.data.field] === JSON.parse(fieldChange.data.value)) ||
    (!fieldChange.data.value && author[fieldChange.data.field] === null) ||
    (fieldChange.data.value === null && author[fieldChange.data.field] === null)
  ) {
    // No change in value, no need to merge
    return author
  }

  if (version.timestamp > fieldChange.data.timestamp) {
    // Current value is newer, ignore the change
    return author
  }

  // Merge the field change
  await tx
    .updateTable('author')
    .set({ [fieldChange.data.field]: fieldChange.data.value })
    .where('id', '=', fieldChange.data.authorId)
    .execute()

  await tx
    .updateTable('authorFieldVersion')
    .set({
      value: fieldChange.data.value,
      timestamp: fieldChange.data.timestamp,
      deviceId: fieldChange.data.deviceId,
      createdAt: new Date(fieldChange.data.createdAt).getTime(),
      createdByDeviceId: fieldChange.data.createdByDeviceId,
    })
    .where('authorId', '=', fieldChange.data.authorId)
    .where('field', '=', fieldChange.data.field)
    .execute()

  const created = await tx
    .selectFrom('author')
    .selectAll()
    .where('id', '=', fieldChange.data.authorId)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create author ${fieldChange.data.authorId}`)
  }
  return created
}

/**
 * Merge tag fields using Last-Write-Wins (LWW) strategy
 * @param tx - Kysely transaction client
 * @param fieldChange - Field change to merge
 * @returns Updated sqlite tag object
 * @throws SyncCrdtError if tag or version does not exist
 */
export async function mergeTagFieldLWW(
  tx: Transaction,
  fieldChange: FieldChange & { model: "tag" }
): Promise<SqliteTag> {
  const tagArray = await tx
    .selectFrom('tag')
    .selectAll()
    .where('id', '=', fieldChange.data.tagId)
    .execute()
  if (tagArray.length > 1) {
    throw new Error(`Multiple tags found for id ${fieldChange.data.tagId}`)
  }
  const tag = tagArray[0]

  if (!tag) {
    // Tag does not exist, cannot merge, throw error
    throw new SyncCrdtError(`No tag found with id ${fieldChange.data.tagId}`)
  }

  // Check if the change is newer than the current value
  const version = await tx
    .selectFrom('tagFieldVersion')
    .selectAll()
    .where('tagId', '=', fieldChange.data.tagId)
    .where('field', '=', fieldChange.data.field)
    .orderBy('timestamp', 'desc')
    .executeTakeFirst()

  if (!version) {
    // No version exists, cannot merge, throw error
    throw new SyncCrdtError(`No version found for tag ${fieldChange.data.tagId} field ${fieldChange.data.field}`)
  }

  if (
    (fieldChange.data.value && tag[fieldChange.data.field] === JSON.parse(fieldChange.data.value)) ||
    (!fieldChange.data.value && tag[fieldChange.data.field] === null) ||
    (fieldChange.data.value === null && tag[fieldChange.data.field] === null)
  ) {
    // No change in value, no need to merge
    return tag
  }

  if (version.timestamp > fieldChange.data.timestamp) {
    // Current value is newer, ignore the change
    return tag
  }

  // Merge the field change
  await tx
    .updateTable('tag')
    .set({ [fieldChange.data.field]: fieldChange.data.value })
    .where('id', '=', fieldChange.data.tagId)
    .execute()

  await tx
    .updateTable('tagFieldVersion')
    .set({
      value: fieldChange.data.value,
      timestamp: fieldChange.data.timestamp,
      deviceId: fieldChange.data.deviceId,
      createdAt: new Date(fieldChange.data.createdAt).getTime(),
      createdByDeviceId: fieldChange.data.createdByDeviceId,
    })
    .where('tagId', '=', fieldChange.data.tagId)
    .where('field', '=', fieldChange.data.field)
    .execute()

  const created = await tx
    .selectFrom('tag')
    .selectAll()
    .where('id', '=', fieldChange.data.tagId)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create tag ${fieldChange.data.tagId}`)
  }
  return created
}

/**
 * Merge folder fields using Last-Write-Wins (LWW) strategy
 * @param tx - Kysely transaction client
 * @param fieldChange - Field change to merge
 * @returns Updated sqlite folder object
 * @throws SyncCrdtError if folder or version does not exist
 */
export async function mergeFolderFieldLWW(
  tx: Transaction,
  fieldChange: FieldChange & { model: "folder" }
): Promise<SqliteFolder> {
  const folderArray = await tx
    .selectFrom('folder')
    .selectAll()
    .where('id', '=', fieldChange.data.folderId)
    .execute()
  if (folderArray.length > 1) {
    throw new Error(`Multiple folders found for id ${fieldChange.data.folderId}`)
  }
  const folder = folderArray[0]

  if (!folder) {
    // Folder does not exist, cannot merge, throw error
    throw new SyncCrdtError(`No folder found with id ${fieldChange.data.folderId}`)
  }

  // Check if the change is newer than the current value
  const version = await tx
    .selectFrom('folderFieldVersion')
    .selectAll()
    .where('folderId', '=', fieldChange.data.folderId)
    .where('field', '=', fieldChange.data.field)
    .orderBy('timestamp', 'desc')
    .executeTakeFirst()

  if (!version) {
    // No version exists, cannot merge, throw error
    throw new SyncCrdtError(`No version found for folder ${fieldChange.data.folderId} field ${fieldChange.data.field}`)
  }

  if (
    (fieldChange.data.value && folder[fieldChange.data.field] === JSON.parse(fieldChange.data.value)) ||
    (!fieldChange.data.value && folder[fieldChange.data.field] === null) ||
    (fieldChange.data.value === null && folder[fieldChange.data.field] === null)
  ) {
    // No change in value, no need to merge
    return folder
  }

  if (version.timestamp > fieldChange.data.timestamp) {
    // Current value is newer, ignore the change
    return folder
  }

  // Merge the field change
  await tx
    .updateTable('folder')
    .set({ [fieldChange.data.field]: fieldChange.data.value })
    .where('id', '=', fieldChange.data.folderId)
    .execute()

  await tx
    .updateTable('folderFieldVersion')
    .set({
      value: fieldChange.data.value,
      timestamp: fieldChange.data.timestamp,
      deviceId: fieldChange.data.deviceId,
      createdAt: new Date(fieldChange.data.createdAt).getTime(),
      createdByDeviceId: fieldChange.data.createdByDeviceId,
    })
    .where('folderId', '=', fieldChange.data.folderId)
    .where('field', '=', fieldChange.data.field)
    .execute()

  const created = await tx
    .selectFrom('folder')
    .selectAll()
    .where('id', '=', fieldChange.data.folderId)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create folder ${fieldChange.data.folderId}`)
  }
  return created
}

/**
 * Merge supplement fields using Last-Write-Wins (LWW) strategy
 * @param tx - Kysely transaction client
 * @param fieldChange - Field change to merge
 * @returns Updated sqlite supplement object
 * @throws SyncCrdtError if supplement or version does not exist
 */
export async function mergeSupplementFieldLWW(
  tx: Transaction,
  fieldChange: FieldChange & { model: "supplement" }
): Promise<SqliteSupplement> {
  const supplementArray = await tx
    .selectFrom('supplement')
    .selectAll()
    .where('id', '=', fieldChange.data.supplementId)
    .execute()
  if (supplementArray.length > 1) {
    throw new Error(`Multiple supplements found for id ${fieldChange.data.supplementId}`)
  }
  const supplement = supplementArray[0]

  if (!supplement) {
    // Supplement does not exist, cannot merge, throw error
    throw new SyncCrdtError(`No supplement found with id ${fieldChange.data.supplementId}`)
  }

  // Check if the change is newer than the current value
  const version = await tx
    .selectFrom('supplementFieldVersion')
    .selectAll()
    .where('supplementId', '=', fieldChange.data.supplementId)
    .where('field', '=', fieldChange.data.field)
    .orderBy('timestamp', 'desc')
    .executeTakeFirst()

  if (!version) {
    // No version exists, cannot merge, throw error
    throw new SyncCrdtError(`No version found for supplement ${fieldChange.data.supplementId} field ${fieldChange.data.field}`)
  }

  if (
    (fieldChange.data.value && supplement[fieldChange.data.field] === JSON.parse(fieldChange.data.value)) ||
    (!fieldChange.data.value && supplement[fieldChange.data.field] === null) ||
    (fieldChange.data.value === null && supplement[fieldChange.data.field] === null)
  ) {
    // No change in value, no need to merge
    return supplement
  }

  if (version.timestamp > fieldChange.data.timestamp) {
    // Current value is newer, ignore the change
    return supplement
  }

  // Merge the field change
  await tx
    .updateTable('supplement')
    .set({ [fieldChange.data.field]: fieldChange.data.value })
    .where('id', '=', fieldChange.data.supplementId)
    .execute()

  await tx
    .updateTable('supplementFieldVersion')
    .set({
      value: fieldChange.data.value,
      timestamp: fieldChange.data.timestamp,
      deviceId: fieldChange.data.deviceId,
      createdAt: new Date(fieldChange.data.createdAt).getTime(),
      createdByDeviceId: fieldChange.data.createdByDeviceId,
    })
    .where('supplementId', '=', fieldChange.data.supplementId)
    .where('field', '=', fieldChange.data.field)
    .execute()

  const created = await tx
    .selectFrom('supplement')
    .selectAll()
    .where('id', '=', fieldChange.data.supplementId)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create supplement ${fieldChange.data.supplementId}`)
  }
  return created
}
