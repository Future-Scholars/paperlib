import { Feed } from "@/models/feed";
import { zFeed, zFeedFieldVersion, Feed as SqliteFeed } from "@/service/services/database/sqlite/models";
import { syncStateStore } from "@/service/services/sync/states";
import { db } from "@/service/services/database/sqlite/db";
import { v4 as uuidv4 } from 'uuid';
import z from "zod";
import { createFieldVersionValue, ensureUndefinedToNull, ensureLibraryId } from "./utils";

/**
 * Convert the feed to sqlite object. If the feed is not in database, insert it to database.
 * Otherwise, update the database feed according to the feed.
 * Finally, return the sqlite object.
 * @param feed The feed to be converted to sqlite object.
 * @returns The sqlite object. Guaranteed in database.
 */
export async function toSqliteFeed(feed: Feed, library?: string): Promise<z.infer<typeof zFeed>> {
  const deviceId = syncStateStore.get("deviceId");

  // Try get the existed sqlite feed by legacy oid
  const existedSqliteFeed: SqliteFeed | undefined = await db.selectFrom("feed")
    .where("legacyOid", "=", feed._id.toString())
    .selectAll()
    .executeTakeFirst();

  if (existedSqliteFeed) {
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
        value: createFieldVersionValue('update', existedSqliteFeed.name, feed.name),
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
        value: createFieldVersionValue('update', existedSqliteFeed.count, feed.count),
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteFeed.color !== feed.color) {
      existedSqliteFeed.color = ensureUndefinedToNull(feed.color);
      updated = true;
      feedFieldVersions.push({
        id: uuidv4(),
        feedId: existedSqliteFeed.id,
        field: "color",
        value: createFieldVersionValue('update', existedSqliteFeed.color, feed.color),
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
        value: createFieldVersionValue('update', existedSqliteFeed.url, feed.url),
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
      existedSqliteFeed.updatedAt = new Date().getTime();
      existedSqliteFeed.updatedByDeviceId = deviceId;
      await db.insertInto("feedFieldVersion").values(feedFieldVersions).execute();
      await db.updateTable("feed").set(existedSqliteFeed).where("id", "=", existedSqliteFeed.id).execute();
    }

    return existedSqliteFeed;
  }
  // Insert the feed to database
  const createdAtDate = new Date();
  const createdAtDateString = createdAtDate.toISOString();
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
    color: ensureUndefinedToNull(feed.color),
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
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, feed.name)),
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
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, "rss")),
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
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, feed.url)),
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
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, feed.count)),
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
      field: "color",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, feed.color)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
  ]
  await db.insertInto("feed").values(newSqliteFeed).execute();
  await db.insertInto("feedFieldVersion").values(feedFieldVersions).execute();

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