import { describe, it, expect, beforeEach } from "vitest";
import { db, type Transaction } from "@/service/services/database/sqlite/db";
import {
  applyPaperFieldVersions,
  applyFeedFieldVersions,
} from "@/service/services/sync/pollyfills/entities";
import { v4 as uuidv4 } from "uuid";

async function withTransaction(
  fn: (tx: Transaction) => Promise<void>,
): Promise<void> {
  const tx = await db.startTransaction().execute();
  try {
    await fn(tx);
    await tx.rollback().execute();
  } catch (error) {
    await tx.rollback().execute();
    throw error;
  }
}

describe("CRDT field version projection", () => {
  const libraryId = uuidv4();

  beforeEach(async () => {
    // Best-effort clean-up for deterministic tests
    await db.deleteFrom("paperFieldVersion").execute();
    await db.deleteFrom("paper").execute();
    await db.deleteFrom("feedFieldVersion").execute();
    await db.deleteFrom("feed").execute();
  });

  it("applies LWW for paper title based on timestamp", async () => {
    const paperId = uuidv4();
    const now = Date.now();

    await db
      .insertInto("paper")
      .values({
        id: paperId,
        libraryId,
        type: "article",
        title: "initial",
        abstract: null,
        journal: null,
        booktitle: null,
        year: null,
        month: null,
        volume: null,
        number: null,
        pages: null,
        publisher: null,
        series: null,
        edition: null,
        editor: null,
        howPublished: null,
        organization: null,
        school: null,
        institution: null,
        address: null,
        doi: null,
        arxiv: null,
        isbn: null,
        issn: null,
        notes: null,
        flag: null,
        rating: 0,
        read: null,
        feedId: null,
        feedItemId: null,
        createdAt: now,
        createdByDeviceId: "device-a",
        deletedAt: null,
        deletedByDeviceId: null,
        updatedAt: now,
        updatedByDeviceId: "device-a",
      })
      .execute();

    await db
      .insertInto("paperFieldVersion")
      .values([
        {
          id: uuidv4(),
          libraryId,
          value: JSON.stringify("old title"),
          hash: null,
          timestamp: now,
          deviceId: "device-a",
          localInsertedAt: now,
          field: "title",
          paperId,
          createdAt: now,
          createdByDeviceId: "device-a",
          deletedAt: null,
          deletedByDeviceId: null,
        },
        {
          id: uuidv4(),
          libraryId,
          value: JSON.stringify("new title"),
          hash: null,
          timestamp: now + 1000,
          deviceId: "device-b",
          localInsertedAt: now + 1000,
          field: "title",
          paperId,
          createdAt: now + 1000,
          createdByDeviceId: "device-b",
          deletedAt: null,
          deletedByDeviceId: null,
        },
      ])
      .execute();

    await withTransaction((tx) =>
      applyPaperFieldVersions(tx, [{ libraryId, paperId, field: "title" }]),
    );

    const updated = await db
      .selectFrom("paper")
      .selectAll()
      .where("id", "=", paperId)
      .executeTakeFirstOrThrow();

    expect(updated.title).toBe("new title");
  });

  it("applies LWW for feed count and keeps latest numeric value", async () => {
    const feedId = uuidv4();
    const now = Date.now();

    await db
      .insertInto("feed")
      .values({
        id: feedId,
        libraryId,
        name: "test feed",
        description: null,
        type: "rss",
        url: "https://example.com",
        count: 0,
        colour: null,
        createdAt: now,
        createdByDeviceId: "device-a",
        deletedAt: null,
        deletedByDeviceId: null,
        updatedAt: now,
        updatedByDeviceId: "device-a",
      })
      .execute();

    await db
      .insertInto("feedFieldVersion")
      .values([
        {
          id: uuidv4(),
          libraryId,
          value: JSON.stringify(1),
          hash: null,
          timestamp: now,
          deviceId: "device-a",
          localInsertedAt: now,
          field: "count",
          feedId,
          createdAt: now,
          createdByDeviceId: "device-a",
          deletedAt: null,
          deletedByDeviceId: null,
        },
        {
          id: uuidv4(),
          libraryId,
          value: JSON.stringify(5),
          hash: null,
          timestamp: now + 500,
          deviceId: "device-b",
          localInsertedAt: now + 500,
          field: "count",
          feedId,
          createdAt: now + 500,
          createdByDeviceId: "device-b",
          deletedAt: null,
          deletedByDeviceId: null,
        },
      ])
      .execute();

    await withTransaction((tx) =>
      applyFeedFieldVersions(tx, [{ libraryId, feedId, field: "count" }]),
    );

    const updated = await db
      .selectFrom("feed")
      .selectAll()
      .where("id", "=", feedId)
      .executeTakeFirstOrThrow();

    expect(updated.count).toBe(5);
  });
}

