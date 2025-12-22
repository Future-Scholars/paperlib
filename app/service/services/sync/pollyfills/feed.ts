import { Feed, IFeedObject } from "@/models/feed";
import { zFeed, zFeedFieldVersion, Feed as SqliteFeed } from "@/service/services/database/sqlite/models";
import { syncStateStore } from "@/service/services/sync/states";
import { db, Transaction } from "@/service/services/database/sqlite/db";
import { v4 as uuidv4 } from 'uuid';
import z from "zod";
import { createFieldVersionValue, ensureUndefinedToNull, ensureLibraryId } from "./utils";
import { LogService } from "@/common/services/log-service";

/**
 * Convert the feed to sqlite object. If the feed is not in database, insert it to database.
 * Otherwise, update the database feed according to the feed.
 * Finally, return the sqlite object.
 * @param feed The feed to be converted to sqlite object.
 * @param library Optional library name
 * @param logger Optional logger for debugging
 * @returns The sqlite object. Guaranteed in database.
 */
export async function toSqliteFeed(feed: Feed, library?: string, logger?: LogService): Promise<z.infer<typeof zFeed>> {
  logger?.info(
    `[Polyfill] Starting Realm to SQLite conversion for feed`,
    `legacyOid: ${feed._id.toString()}, name: ${feed.name}`,
    false,
    "Polyfill"
  );

  const deviceId = syncStateStore.get("deviceId");

  // Try get the existed sqlite feed by legacy oid.
  // If there's no legacy oid, it means the feed is either new or from sync and there's no existed feed in realm.
  const existedSqliteFeed: SqliteFeed | undefined = await db.selectFrom("feed")
    .where("legacyOid", "=", feed._id.toString())
    .selectAll()
    .executeTakeFirst();

  if (existedSqliteFeed) {
    logger?.info(
      `[Polyfill] Found existing SQLite feed`,
      `legacyOid: ${feed._id.toString()}, sqliteId: ${existedSqliteFeed.id}`,
      false,
      "Polyfill"
    );
    // There's an existed feed in realm
    let updated = false;
    const createdAtDate = new Date();
    const createdAtTimestamp = createdAtDate.getTime();
    // Update the sqlite feed if any field is different
    const feedFieldVersions: z.infer<typeof zFeedFieldVersion>[] = [];
    if (existedSqliteFeed.name !== feed.name) {
      existedSqliteFeed.name = feed.name;
      updated = true;
      feedFieldVersions.push({
        id: uuidv4(),
        feedId: existedSqliteFeed.id,
        field: "name",
        value: createFieldVersionValue('update', existedSqliteFeed.name, ensureUndefinedToNull(feed.name)),
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteFeed.count !== feed.count) {
      existedSqliteFeed.count = feed.count;
      updated = true;
      feedFieldVersions.push({
        id: uuidv4(),
        feedId: existedSqliteFeed.id,
        field: "count",
        value: createFieldVersionValue('update', existedSqliteFeed.count, ensureUndefinedToNull(feed.count)),
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteFeed.colour !== feed.color) {
      existedSqliteFeed.colour = ensureUndefinedToNull(feed.color);
      updated = true;
      feedFieldVersions.push({
        id: uuidv4(),
        feedId: existedSqliteFeed.id,
        field: "colour",
        value: createFieldVersionValue('update', existedSqliteFeed.colour, ensureUndefinedToNull(feed.color)),
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteFeed.url !== feed.url) {
      existedSqliteFeed.url = feed.url;
      updated = true;
      feedFieldVersions.push({
        id: uuidv4(),
        feedId: existedSqliteFeed.id,
        field: "url",
        value: createFieldVersionValue('update', existedSqliteFeed.url, ensureUndefinedToNull(feed.url)),
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (updated) {
      logger?.info(
        `[Polyfill] Updating SQLite feed with ${feedFieldVersions.length} field changes`,
        `legacyOid: ${feed._id.toString()}, sqliteId: ${existedSqliteFeed.id}, changedFields: ${feedFieldVersions.map(v => v.field).join(', ')}`,
        false,
        "Polyfill"
      );
      existedSqliteFeed.updatedAt = new Date().getTime();
      existedSqliteFeed.updatedByDeviceId = deviceId;
      await db.insertInto("feedFieldVersion").values(feedFieldVersions).execute();
      await db.updateTable("feed").set(existedSqliteFeed).where("id", "=", existedSqliteFeed.id).execute();
      logger?.info(
        `[Polyfill] Successfully updated SQLite feed`,
        `legacyOid: ${feed._id.toString()}, sqliteId: ${existedSqliteFeed.id}`,
        false,
        "Polyfill"
      );
    } else {
      logger?.info(
        `[Polyfill] No field changes detected, skipping update`,
        `legacyOid: ${feed._id.toString()}, sqliteId: ${existedSqliteFeed.id}`,
        false,
        "Polyfill"
      );
    }

    return existedSqliteFeed;
  }
  // Insert the feed to database
  logger?.info(
    `[Polyfill] Creating new SQLite feed`,
    `legacyOid: ${feed._id.toString()}, name: ${feed.name}`,
    false,
    "Polyfill"
  );
  const createdAtDate = new Date();
  const createdAtTimestamp = createdAtDate.getTime();
  const newSqliteFeed: z.infer<typeof zFeed> = {
    id: uuidv4(),
    legacyOid: ensureUndefinedToNull(feed._id?.toString()),
    name: feed.name,
    description: null,
    ownedBy: ensureUndefinedToNull(syncStateStore.get("userId")),
    libraryId: await ensureLibraryId(library),
    type: "rss",
    url: feed.url,
    count: ensureUndefinedToNull(feed.count),
    colour: ensureUndefinedToNull(feed.color),
    createdAt: createdAtTimestamp,
    createdByDeviceId: deviceId,
    updatedAt: null,
    updatedByDeviceId: null,
    deletedAt: null,
    deletedByDeviceId: null,
  }
  const feedFieldVersions: z.infer<typeof zFeedFieldVersion>[] = [
    {
      id: uuidv4(),
      feedId: newSqliteFeed.id,
      field: "name",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(feed.name)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      feedId: newSqliteFeed.id,
      field: "type",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull("rss")),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      feedId: newSqliteFeed.id,
      field: "url",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(feed.url)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      feedId: newSqliteFeed.id,
      field: "count",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(feed.count)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      feedId: newSqliteFeed.id,
      field: "colour",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(feed.color)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
  ];
  await db.insertInto("feed").values(newSqliteFeed).execute();
  await db.insertInto("feedFieldVersion").values(feedFieldVersions).execute();

  logger?.info(
    `[Polyfill] Successfully created SQLite feed`,
    `legacyOid: ${feed._id.toString()}, sqliteId: ${newSqliteFeed.id}, name: ${newSqliteFeed.name}`,
    false,
    "Polyfill"
  );

  return newSqliteFeed;
}

export async function deleteSqliteFeed(legacyOid: string): Promise<void> {
  const deviceId = syncStateStore.get("deviceId");
  // Query and get the sqlite feed by legacy oid
  const existedSqliteFeed = await db.selectFrom("feed").where("legacyOid", "=", legacyOid).selectAll().executeTakeFirst();
  if (existedSqliteFeed) {
    await db.updateTable("feed").set({
      deletedAt: new Date().getTime(),
      deletedByDeviceId: deviceId,
    }).where("id", "=", existedSqliteFeed.id).execute();
    await db.deleteFrom("feedFieldVersion").where("feedId", "=", existedSqliteFeed.id).execute();
  }
}

/**
 * Convert SQLite Feed to Realm Feed
 * @param txOrDb - Transaction or db instance
 * @param sqliteFeed - The SQLite feed to convert
 * @returns The Realm feed draft
 */
export async function toRealmFeed(txOrDb: Transaction, sqliteFeed: SqliteFeed, logger?: LogService): Promise<IFeedObject> {
  logger?.info(
    `[Polyfill] Starting SQLite to Realm conversion for feed`,
    `sqliteId: ${sqliteFeed.id}, legacyOid: ${sqliteFeed.legacyOid}, name: ${sqliteFeed.name}`,
    false,
    "Polyfill"
  );
  // This function doesn't need to query the database, but we keep the parameter for consistency
  const feedRealmObject = new Feed({
    _id: sqliteFeed.legacyOid || undefined,
    name: sqliteFeed.name,
    count: sqliteFeed.count || 0,
    color: sqliteFeed.colour || undefined,
    url: sqliteFeed.url,
  });

  return feedRealmObject;
}