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
import { LogService } from '@/common/services/log-service'

/**
 * Merge paper fields using Last-Write-Wins (LWW) strategy
 * @param tx - Kysely transaction client
 * @param fieldChange - Field change to merge
 * @param logger - Optional logger for debugging
 * @returns Updated sqlite paper object
 * @throws SyncCrdtError if paper or version does not exist
 */
export async function mergePaperFieldLWW(
  tx: Transaction,
  fieldChange: FieldChange & { model: "paper" },
  logger?: LogService
): Promise<SqlitePaper> {
  logger?.info(
    `[CRDT] Starting LWW merge for paper field`,
    `paperId: ${fieldChange.data.paperId}, field: ${fieldChange.data.field}, incomingValue: ${fieldChange.data.value}, incomingTimestamp: ${fieldChange.data.timestamp}`,
    false,
    "CRDT"
  );

  const paperArray = await tx
    .selectFrom('paper')
    .selectAll()
    .where('id', '=', fieldChange.data.paperId)
    .execute()
  if (paperArray.length > 1) {
    const error = `Multiple papers found for id ${fieldChange.data.paperId}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }
  const paper = paperArray[0]
  if (!paper) {
    // Paper does not exist, cannot merge, throw error
    const error = `No paper found with id ${fieldChange.data.paperId}`;
    logger?.error(`[CRDT] ${error}`, new SyncCrdtError(error), false, "CRDT");
    throw new SyncCrdtError(error);
  }

  logger?.info(
    `[CRDT] Found paper`,
    `paperId: ${fieldChange.data.paperId}, currentValue: ${JSON.stringify(paper[fieldChange.data.field])}`,
    false,
    "CRDT"
  );

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
    const error = `No version found for paper ${fieldChange.data.paperId} field ${fieldChange.data.field}`;
    logger?.error(`[CRDT] ${error}`, new SyncCrdtError(error), false, "CRDT");
    throw new SyncCrdtError(error);
  }

  logger?.info(
    `[CRDT] Found field version`,
    `paperId: ${fieldChange.data.paperId}, field: ${fieldChange.data.field}, currentVersionTimestamp: ${version.timestamp}, currentVersionValue: ${version.value}`,
    false,
    "CRDT"
  );

  const currentValue = paper[fieldChange.data.field];
  const incomingValue = fieldChange.data.value ? JSON.parse(fieldChange.data.value) : null;
  const valuesEqual = (
    (fieldChange.data.value && currentValue === incomingValue) ||
    (!fieldChange.data.value && currentValue === null) ||
    (fieldChange.data.value === null && currentValue === null)
  );

  if (valuesEqual) {
    // No change in value, no need to merge
    logger?.info(
      `[CRDT] Values are equal, skipping merge`,
      `paperId: ${fieldChange.data.paperId}, field: ${fieldChange.data.field}`,
      false,
      "CRDT"
    );
    return paper
  }

  if (version.timestamp > fieldChange.data.timestamp) {
    // Current value is newer, ignore the change
    logger?.info(
      `[CRDT] Current version is newer, ignoring incoming change`,
      `paperId: ${fieldChange.data.paperId}, field: ${fieldChange.data.field}, currentTimestamp: ${version.timestamp}, incomingTimestamp: ${fieldChange.data.timestamp}`,
      false,
      "CRDT"
    );
    return paper
  }

  logger?.info(
    `[CRDT] Merging field change`,
    `paperId: ${fieldChange.data.paperId}, field: ${fieldChange.data.field}, oldValue: ${JSON.stringify(currentValue)}, newValue: ${fieldChange.data.value}`,
    false,
    "CRDT"
  );

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
    const error = `Failed to create paper ${fieldChange.data.paperId}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }

  logger?.info(
    `[CRDT] Successfully merged paper field`,
    `paperId: ${fieldChange.data.paperId}, field: ${fieldChange.data.field}`,
    false,
    "CRDT"
  );

  return created
}

/**
 * Merge feed fields using Last-Write-Wins (LWW) strategy
 * @param tx - Kysely transaction client
 * @param fieldChange - Field change to merge
 * @param logger - Optional logger for debugging
 * @returns Updated sqlite feed object
 * @throws SyncCrdtError if feed or version does not exist
 */
export async function mergeFeedFieldLWW(
  tx: Transaction,
  fieldChange: FieldChange & { model: "feed" },
  logger?: LogService
): Promise<SqliteFeed> {
  logger?.info(
    `[CRDT] Starting LWW merge for feed field`,
    `feedId: ${fieldChange.data.feedId}, field: ${fieldChange.data.field}, incomingValue: ${fieldChange.data.value}, incomingTimestamp: ${fieldChange.data.timestamp}`,
    false,
    "CRDT"
  );

  const feedArray = await tx
    .selectFrom('feed')
    .selectAll()
    .where('id', '=', fieldChange.data.feedId)
    .execute()
  if (feedArray.length > 1) {
    const error = `Multiple feeds found for id ${fieldChange.data.feedId}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }
  const feed = feedArray[0]

  if (!feed) {
    // Feed does not exist, cannot merge, throw error
    const error = `No feed found with id ${fieldChange.data.feedId}`;
    logger?.error(`[CRDT] ${error}`, new SyncCrdtError(error), false, "CRDT");
    throw new SyncCrdtError(error);
  }

  logger?.info(
    `[CRDT] Found feed`,
    `feedId: ${fieldChange.data.feedId}, currentValue: ${JSON.stringify(feed[fieldChange.data.field])}`,
    false,
    "CRDT"
  );

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
    const error = `No version found for feed ${fieldChange.data.feedId} field ${fieldChange.data.field}`;
    logger?.error(`[CRDT] ${error}`, new SyncCrdtError(error), false, "CRDT");
    throw new SyncCrdtError(error);
  }

  logger?.info(
    `[CRDT] Found field version`,
    `feedId: ${fieldChange.data.feedId}, field: ${fieldChange.data.field}, currentVersionTimestamp: ${version.timestamp}, currentVersionValue: ${version.value}`,
    false,
    "CRDT"
  );

  const currentValue = feed[fieldChange.data.field];
  const incomingValue = fieldChange.data.value ? JSON.parse(fieldChange.data.value) : null;
  const valuesEqual = (
    (fieldChange.data.value && currentValue === incomingValue) ||
    (!fieldChange.data.value && currentValue === null) ||
    (fieldChange.data.value === null && currentValue === null)
  );

  if (valuesEqual) {
    // No change in value, no need to merge
    logger?.info(
      `[CRDT] Values are equal, skipping merge`,
      `feedId: ${fieldChange.data.feedId}, field: ${fieldChange.data.field}`,
      false,
      "CRDT"
    );
    return feed
  }

  if (version.timestamp > fieldChange.data.timestamp) {
    // Current value is newer, ignore the change
    logger?.info(
      `[CRDT] Current version is newer, ignoring incoming change`,
      `feedId: ${fieldChange.data.feedId}, field: ${fieldChange.data.field}, currentTimestamp: ${version.timestamp}, incomingTimestamp: ${fieldChange.data.timestamp}`,
      false,
      "CRDT"
    );
    return feed
  }

  logger?.info(
    `[CRDT] Merging field change`,
    `feedId: ${fieldChange.data.feedId}, field: ${fieldChange.data.field}, oldValue: ${JSON.stringify(currentValue)}, newValue: ${fieldChange.data.value}`,
    false,
    "CRDT"
  );

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
    const error = `Failed to create feed ${fieldChange.data.feedId}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }

  logger?.info(
    `[CRDT] Successfully merged feed field`,
    `feedId: ${fieldChange.data.feedId}, field: ${fieldChange.data.field}`,
    false,
    "CRDT"
  );

  return created
}

/**
 * Merge author fields using Last-Write-Wins (LWW) strategy
 * @param tx - Kysely transaction client
 * @param fieldChange - Field change to merge
 * @param logger - Optional logger for debugging
 * @returns Updated sqlite author object
 * @throws SyncCrdtError if author or version does not exist
 */
export async function mergeAuthorFieldLWW(
  tx: Transaction,
  fieldChange: FieldChange & { model: "author" },
  logger?: LogService
): Promise<SqliteAuthor> {
  logger?.info(
    `[CRDT] Starting LWW merge for author field`,
    `authorId: ${fieldChange.data.authorId}, field: ${fieldChange.data.field}, incomingValue: ${fieldChange.data.value}, incomingTimestamp: ${fieldChange.data.timestamp}`,
    false,
    "CRDT"
  );

  const authorArray = await tx
    .selectFrom('author')
    .selectAll()
    .where('id', '=', fieldChange.data.authorId)
    .execute()
  if (authorArray.length > 1) {
    const error = `Multiple authors found for id ${fieldChange.data.authorId}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }
  const author = authorArray[0]

  if (!author) {
    // Author does not exist, cannot merge, throw error
    const error = `No author found with id ${fieldChange.data.authorId}`;
    logger?.error(`[CRDT] ${error}`, new SyncCrdtError(error), false, "CRDT");
    throw new SyncCrdtError(error);
  }

  logger?.info(
    `[CRDT] Found author`,
    `authorId: ${fieldChange.data.authorId}, currentValue: ${JSON.stringify(author[fieldChange.data.field])}`,
    false,
    "CRDT"
  );

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
    const error = `No version found for author ${fieldChange.data.authorId} field ${fieldChange.data.field}`;
    logger?.error(`[CRDT] ${error}`, new SyncCrdtError(error), false, "CRDT");
    throw new SyncCrdtError(error);
  }

  logger?.info(
    `[CRDT] Found field version`,
    `authorId: ${fieldChange.data.authorId}, field: ${fieldChange.data.field}, currentVersionTimestamp: ${version.timestamp}, currentVersionValue: ${version.value}`,
    false,
    "CRDT"
  );

  const currentValue = author[fieldChange.data.field];
  const incomingValue = fieldChange.data.value ? JSON.parse(fieldChange.data.value) : null;
  const valuesEqual = (
    (fieldChange.data.value && currentValue === incomingValue) ||
    (!fieldChange.data.value && currentValue === null) ||
    (fieldChange.data.value === null && currentValue === null)
  );

  if (valuesEqual) {
    // No change in value, no need to merge
    logger?.info(
      `[CRDT] Values are equal, skipping merge`,
      `authorId: ${fieldChange.data.authorId}, field: ${fieldChange.data.field}`,
      false,
      "CRDT"
    );
    return author
  }

  if (version.timestamp > fieldChange.data.timestamp) {
    // Current value is newer, ignore the change
    logger?.info(
      `[CRDT] Current version is newer, ignoring incoming change`,
      `authorId: ${fieldChange.data.authorId}, field: ${fieldChange.data.field}, currentTimestamp: ${version.timestamp}, incomingTimestamp: ${fieldChange.data.timestamp}`,
      false,
      "CRDT"
    );
    return author
  }

  logger?.info(
    `[CRDT] Merging field change`,
    `authorId: ${fieldChange.data.authorId}, field: ${fieldChange.data.field}, oldValue: ${JSON.stringify(currentValue)}, newValue: ${fieldChange.data.value}`,
    false,
    "CRDT"
  );

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
    const error = `Failed to create author ${fieldChange.data.authorId}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }

  logger?.info(
    `[CRDT] Successfully merged author field`,
    `authorId: ${fieldChange.data.authorId}, field: ${fieldChange.data.field}`,
    false,
    "CRDT"
  );

  return created
}

/**
 * Merge tag fields using Last-Write-Wins (LWW) strategy
 * @param tx - Kysely transaction client
 * @param fieldChange - Field change to merge
 * @param logger - Optional logger for debugging
 * @returns Updated sqlite tag object
 * @throws SyncCrdtError if tag or version does not exist
 */
export async function mergeTagFieldLWW(
  tx: Transaction,
  fieldChange: FieldChange & { model: "tag" },
  logger?: LogService
): Promise<SqliteTag> {
  logger?.info(
    `[CRDT] Starting LWW merge for tag field`,
    `tagId: ${fieldChange.data.tagId}, field: ${fieldChange.data.field}, incomingValue: ${fieldChange.data.value}, incomingTimestamp: ${fieldChange.data.timestamp}`,
    false,
    "CRDT"
  );

  const tagArray = await tx
    .selectFrom('tag')
    .selectAll()
    .where('id', '=', fieldChange.data.tagId)
    .execute()
  if (tagArray.length > 1) {
    const error = `Multiple tags found for id ${fieldChange.data.tagId}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }
  const tag = tagArray[0]

  if (!tag) {
    // Tag does not exist, cannot merge, throw error
    const error = `No tag found with id ${fieldChange.data.tagId}`;
    logger?.error(`[CRDT] ${error}`, new SyncCrdtError(error), false, "CRDT");
    throw new SyncCrdtError(error);
  }

  logger?.info(
    `[CRDT] Found tag`,
    `tagId: ${fieldChange.data.tagId}, currentValue: ${JSON.stringify(tag[fieldChange.data.field])}`,
    false,
    "CRDT"
  );

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
    const error = `No version found for tag ${fieldChange.data.tagId} field ${fieldChange.data.field}`;
    logger?.error(`[CRDT] ${error}`, new SyncCrdtError(error), false, "CRDT");
    throw new SyncCrdtError(error);
  }

  logger?.info(
    `[CRDT] Found field version`,
    `tagId: ${fieldChange.data.tagId}, field: ${fieldChange.data.field}, currentVersionTimestamp: ${version.timestamp}, currentVersionValue: ${version.value}`,
    false,
    "CRDT"
  );

  const currentValue = tag[fieldChange.data.field];
  const currentValueStr = JSON.stringify(currentValue);
  const valuesEqual = (
    (fieldChange.data.value && currentValueStr === fieldChange.data.value) ||
    (!fieldChange.data.value && currentValue === null) ||
    (fieldChange.data.value === null && currentValue === null)
  );

  if (valuesEqual) {
    // No change in value, no need to merge
    logger?.info(
      `[CRDT] Values are equal, skipping merge`,
      `tagId: ${fieldChange.data.tagId}, field: ${fieldChange.data.field}`,
      false,
      "CRDT"
    );
    return tag
  }

  if (version.timestamp > fieldChange.data.timestamp) {
    // Current value is newer, ignore the change
    logger?.info(
      `[CRDT] Current version is newer, ignoring incoming change`,
      `tagId: ${fieldChange.data.tagId}, field: ${fieldChange.data.field}, currentTimestamp: ${version.timestamp}, incomingTimestamp: ${fieldChange.data.timestamp}`,
      false,
      "CRDT"
    );
    return tag
  }

  logger?.info(
    `[CRDT] Merging field change`,
    `tagId: ${fieldChange.data.tagId}, field: ${fieldChange.data.field}, oldValue: ${currentValueStr}, newValue: ${fieldChange.data.value}`,
    false,
    "CRDT"
  );

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
    const error = `Failed to create tag ${fieldChange.data.tagId}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }

  logger?.info(
    `[CRDT] Successfully merged tag field`,
    `tagId: ${fieldChange.data.tagId}, field: ${fieldChange.data.field}`,
    false,
    "CRDT"
  );

  return created
}

/**
 * Merge folder fields using Last-Write-Wins (LWW) strategy
 * @param tx - Kysely transaction client
 * @param fieldChange - Field change to merge
 * @param logger - Optional logger for debugging
 * @returns Updated sqlite folder object
 * @throws SyncCrdtError if folder or version does not exist
 */
export async function mergeFolderFieldLWW(
  tx: Transaction,
  fieldChange: FieldChange & { model: "folder" },
  logger?: LogService
): Promise<SqliteFolder> {
  logger?.info(
    `[CRDT] Starting LWW merge for folder field`,
    `folderId: ${fieldChange.data.folderId}, field: ${fieldChange.data.field}, incomingValue: ${fieldChange.data.value}, incomingTimestamp: ${fieldChange.data.timestamp}`,
    false,
    "CRDT"
  );

  const folderArray = await tx
    .selectFrom('folder')
    .selectAll()
    .where('id', '=', fieldChange.data.folderId)
    .execute()
  if (folderArray.length > 1) {
    const error = `Multiple folders found for id ${fieldChange.data.folderId}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }
  const folder = folderArray[0]

  if (!folder) {
    // Folder does not exist, cannot merge, throw error
    const error = `No folder found with id ${fieldChange.data.folderId}`;
    logger?.error(`[CRDT] ${error}`, new SyncCrdtError(error), false, "CRDT");
    throw new SyncCrdtError(error);
  }

  logger?.info(
    `[CRDT] Found folder`,
    `folderId: ${fieldChange.data.folderId}, currentValue: ${JSON.stringify(folder[fieldChange.data.field])}`,
    false,
    "CRDT"
  );

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
    const error = `No version found for folder ${fieldChange.data.folderId} field ${fieldChange.data.field}`;
    logger?.error(`[CRDT] ${error}`, new SyncCrdtError(error), false, "CRDT");
    throw new SyncCrdtError(error);
  }

  logger?.info(
    `[CRDT] Found field version`,
    `folderId: ${fieldChange.data.folderId}, field: ${fieldChange.data.field}, currentVersionTimestamp: ${version.timestamp}, currentVersionValue: ${version.value}`,
    false,
    "CRDT"
  );

  const currentValue = folder[fieldChange.data.field];
  const currentValueStr = JSON.stringify(currentValue);
  const valuesEqual = (
    (fieldChange.data.value && currentValueStr === fieldChange.data.value) ||
    (!fieldChange.data.value && currentValue === null) ||
    (fieldChange.data.value === null && currentValue === null)
  );

  if (valuesEqual) {
    // No change in value, no need to merge
    logger?.info(
      `[CRDT] Values are equal, skipping merge`,
      `folderId: ${fieldChange.data.folderId}, field: ${fieldChange.data.field}`,
      false,
      "CRDT"
    );
    return folder
  }

  if (version.timestamp > fieldChange.data.timestamp) {
    // Current value is newer, ignore the change
    logger?.info(
      `[CRDT] Current version is newer, ignoring incoming change`,
      `folderId: ${fieldChange.data.folderId}, field: ${fieldChange.data.field}, currentTimestamp: ${version.timestamp}, incomingTimestamp: ${fieldChange.data.timestamp}`,
      false,
      "CRDT"
    );
    return folder
  }

  logger?.info(
    `[CRDT] Merging field change`,
    `folderId: ${fieldChange.data.folderId}, field: ${fieldChange.data.field}, oldValue: ${currentValueStr}, newValue: ${fieldChange.data.value}`,
    false,
    "CRDT"
  );

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
    const error = `Failed to create folder ${fieldChange.data.folderId}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }

  logger?.info(
    `[CRDT] Successfully merged folder field`,
    `folderId: ${fieldChange.data.folderId}, field: ${fieldChange.data.field}`,
    false,
    "CRDT"
  );

  return created
}

/**
 * Merge supplement fields using Last-Write-Wins (LWW) strategy
 * @param tx - Kysely transaction client
 * @param fieldChange - Field change to merge
 * @param logger - Optional logger for debugging
 * @returns Updated sqlite supplement object
 * @throws SyncCrdtError if supplement or version does not exist
 */
export async function mergeSupplementFieldLWW(
  tx: Transaction,
  fieldChange: FieldChange & { model: "supplement" },
  logger?: LogService
): Promise<SqliteSupplement> {
  logger?.info(
    `[CRDT] Starting LWW merge for supplement field`,
    `supplementId: ${fieldChange.data.supplementId}, field: ${fieldChange.data.field}, incomingValue: ${fieldChange.data.value}, incomingTimestamp: ${fieldChange.data.timestamp}`,
    false,
    "CRDT"
  );

  const supplementArray = await tx
    .selectFrom('supplement')
    .selectAll()
    .where('id', '=', fieldChange.data.supplementId)
    .execute()
  if (supplementArray.length > 1) {
    const error = `Multiple supplements found for id ${fieldChange.data.supplementId}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }
  const supplement = supplementArray[0]

  if (!supplement) {
    // Supplement does not exist, cannot merge, throw error
    const error = `No supplement found with id ${fieldChange.data.supplementId}`;
    logger?.error(`[CRDT] ${error}`, new SyncCrdtError(error), false, "CRDT");
    throw new SyncCrdtError(error);
  }

  logger?.info(
    `[CRDT] Found supplement`,
    `supplementId: ${fieldChange.data.supplementId}, currentValue: ${JSON.stringify(supplement[fieldChange.data.field])}`,
    false,
    "CRDT"
  );

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
    const error = `No version found for supplement ${fieldChange.data.supplementId} field ${fieldChange.data.field}`;
    logger?.error(`[CRDT] ${error}`, new SyncCrdtError(error), false, "CRDT");
    throw new SyncCrdtError(error);
  }

  logger?.info(
    `[CRDT] Found field version`,
    `supplementId: ${fieldChange.data.supplementId}, field: ${fieldChange.data.field}, currentVersionTimestamp: ${version.timestamp}, currentVersionValue: ${version.value}`,
    false,
    "CRDT"
  );

  const currentValue = supplement[fieldChange.data.field];
  const incomingValue = fieldChange.data.value ? JSON.parse(fieldChange.data.value) : null;
  const valuesEqual = (
    (fieldChange.data.value && currentValue === incomingValue) ||
    (!fieldChange.data.value && currentValue === null) ||
    (fieldChange.data.value === null && currentValue === null)
  );

  if (valuesEqual) {
    // No change in value, no need to merge
    logger?.info(
      `[CRDT] Values are equal, skipping merge`,
      `supplementId: ${fieldChange.data.supplementId}, field: ${fieldChange.data.field}`,
      false,
      "CRDT"
    );
    return supplement
  }

  if (version.timestamp > fieldChange.data.timestamp) {
    // Current value is newer, ignore the change
    logger?.info(
      `[CRDT] Current version is newer, ignoring incoming change`,
      `supplementId: ${fieldChange.data.supplementId}, field: ${fieldChange.data.field}, currentTimestamp: ${version.timestamp}, incomingTimestamp: ${fieldChange.data.timestamp}`,
      false,
      "CRDT"
    );
    return supplement
  }

  logger?.info(
    `[CRDT] Merging field change`,
    `supplementId: ${fieldChange.data.supplementId}, field: ${fieldChange.data.field}, oldValue: ${JSON.stringify(currentValue)}, newValue: ${fieldChange.data.value}`,
    false,
    "CRDT"
  );

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
    const error = `Failed to create supplement ${fieldChange.data.supplementId}`;
    logger?.error(`[CRDT] ${error}`, new Error(error), false, "CRDT");
    throw new Error(error);
  }

  logger?.info(
    `[CRDT] Successfully merged supplement field`,
    `supplementId: ${fieldChange.data.supplementId}, field: ${fieldChange.data.field}`,
    false,
    "CRDT"
  );

  return created
}
