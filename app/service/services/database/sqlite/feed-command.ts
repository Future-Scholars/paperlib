import { v4 as uuidv4 } from "uuid";
import { db } from "@/service/services/database/sqlite/db";
import { ensureLibraryId } from "@/service/services/sync/pollyfills/utils";
import { syncStateStore } from "@/service/services/sync/states";
import type { IFeedObject } from "@/models/feed";

export interface UpsertFeedResult {
  feedId: string;
  libraryId: string;
  lastLocalInsertedAt: number;
}

/**
 * SQLite feed command: single entry for local feed writes.
 * Writes feed row and feedFieldVersion. id = UUID, legacyOid = Realm ObjectId string.
 */
export async function upsertFeed(draft: IFeedObject): Promise<UpsertFeedResult> {
  const libraryId = await ensureLibraryId("main");
  const deviceId = syncStateStore.get("deviceId");
  const now = Date.now();
  const legacyOid =
    typeof draft._id === "string"
      ? draft._id
      : (draft._id as { toString: () => string }).toString();

  let feedId: string | null = null;

  await db.transaction().execute(async (tx) => {
    const existing = await tx
      .selectFrom("feed")
      .select("id")
      .where("legacyOid", "=", legacyOid)
      .where("libraryId", "=", libraryId)
      .executeTakeFirst();

    if (existing) {
      feedId = existing.id;
      await tx
        .updateTable("feed")
        .set({
          name: draft.name ?? "",
          description: (draft as any).description ?? null,
          type: (draft as any).type ?? "rss",
          url: draft.url ?? "",
          count: draft.count ?? 0,
          colour: draft.color ?? null,
          updatedAt: now,
          updatedByDeviceId: deviceId,
        })
        .where("id", "=", feedId)
        .where("libraryId", "=", libraryId)
        .execute();
    } else {
      feedId = uuidv4();
      await tx
        .insertInto("feed")
        .values({
          id: feedId,
          legacyOid,
          libraryId,
          name: draft.name ?? "",
          description: (draft as any).description ?? null,
          type: (draft as any).type ?? "rss",
          url: draft.url ?? "",
          count: draft.count ?? 0,
          colour: draft.color ?? null,
          createdAt: now,
          createdByDeviceId: deviceId,
          deletedAt: null,
          deletedByDeviceId: null,
          updatedAt: now,
          updatedByDeviceId: deviceId,
        })
        .execute();
    }

    const feedEntity = {
      id: feedId,
      libraryId,
      legacyOid,
      name: draft.name ?? "",
      description: (draft as any).description ?? null,
      type: (draft as any).type ?? "rss",
      url: draft.url ?? "",
      count: draft.count ?? 0,
      colour: draft.color ?? null,
      createdAt: existing ? (await tx.selectFrom("feed").select("createdAt").where("id", "=", feedId).where("libraryId", "=", libraryId).executeTakeFirst())?.createdAt ?? now : now,
      createdByDeviceId: existing ? (await tx.selectFrom("feed").select("createdByDeviceId").where("id", "=", feedId).where("libraryId", "=", libraryId).executeTakeFirst())?.createdByDeviceId ?? deviceId : deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
      updatedAt: now,
      updatedByDeviceId: deviceId,
    };

    await tx
      .insertInto("feedFieldVersion")
      .values({
        id: uuidv4(),
        feedId,
        field: "entity",
        value: JSON.stringify(feedEntity),
        timestamp: now,
        deviceId,
        hash: null,
        createdAt: now,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
        libraryId,
        localInsertedAt: now,
      })
      .execute();
  });
  if (!feedId) {
    throw new Error("Failed to upsert feed");
  }

  return { feedId, libraryId, lastLocalInsertedAt: now };
}

export interface DeleteFeedResult {
  feedId: string;
  libraryId: string;
  lastLocalInsertedAt: number;
}

/**
 * Returns the feed's SQLite id (UUID) for the given legacyOid (Realm ObjectId string).
 * Used when upserting feed entities (papers) that reference a feed by Realm _id.
 */
export async function getFeedIdByLegacyOid(legacyOid: string): Promise<string | null> {
  const libraryId = await ensureLibraryId("main");
  const row = await db
    .selectFrom("feed")
    .select("id")
    .where("legacyOid", "=", legacyOid)
    .where("libraryId", "=", libraryId)
    .where("deletedAt", "is", null)
    .executeTakeFirst();
  return row?.id ?? null;
}

/**
 * Soft-delete a feed by legacyOid (Realm ObjectId string).
 * Caller typically passes feed._id.toString().
 */
export async function deleteFeed(legacyOid: string): Promise<DeleteFeedResult | null> {
  const libraryId = await ensureLibraryId("main");
  const deviceId = syncStateStore.get("deviceId");
  const now = Date.now();

  const existing = await db
    .selectFrom("feed")
    .select("id")
    .where("legacyOid", "=", legacyOid)
    .where("libraryId", "=", libraryId)
    .where("deletedAt", "is", null)
    .executeTakeFirst();

  if (!existing) return null;

  const feedId = existing.id;

  await db.transaction().execute(async (tx) => {
    await tx
      .updateTable("feed")
      .set({
        deletedAt: now,
        deletedByDeviceId: deviceId,
        updatedAt: now,
        updatedByDeviceId: deviceId,
      })
      .where("id", "=", feedId)
      .where("libraryId", "=", libraryId)
      .execute();

    const updated = await tx
      .selectFrom("feed")
      .selectAll()
      .where("id", "=", feedId)
      .where("libraryId", "=", libraryId)
      .executeTakeFirst();

    if (updated) {
      const feedEntity = {
        id: updated.id,
        libraryId: updated.libraryId,
        legacyOid: updated.legacyOid,
        name: updated.name,
        description: updated.description,
        type: updated.type,
        url: updated.url,
        count: updated.count,
        colour: updated.colour,
        createdAt: updated.createdAt,
        createdByDeviceId: updated.createdByDeviceId,
        deletedAt: updated.deletedAt,
        deletedByDeviceId: updated.deletedByDeviceId,
        updatedAt: updated.updatedAt,
        updatedByDeviceId: updated.updatedByDeviceId,
      };
      await tx
        .insertInto("feedFieldVersion")
        .values({
          id: uuidv4(),
          feedId,
          field: "entity",
          value: JSON.stringify(feedEntity),
          timestamp: now,
          deviceId,
          hash: null,
          createdAt: now,
          createdByDeviceId: deviceId,
          deletedAt: now,
          deletedByDeviceId: deviceId,
          libraryId,
          localInsertedAt: now,
        })
        .execute();
    }
  });

  return { feedId, libraryId, lastLocalInsertedAt: now };
}
