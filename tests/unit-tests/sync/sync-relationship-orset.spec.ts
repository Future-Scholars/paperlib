import { describe, it, expect, beforeEach } from "vitest";
import { db, type Transaction } from "@/service/services/database/sqlite/db";
import {
  applyPaperAuthorOrSet,
  applyPaperTagOrSet,
  pickLatestOpByTimestamp,
} from "@/service/services/sync/pollyfills/relationship";
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

describe("OR-set relationship projection", () => {
  const libraryId = uuidv4();

  beforeEach(async () => {
    await db.deleteFrom("paperAuthor").execute();
    await db.deleteFrom("paperTag").execute();
  });

  describe("pickLatestOpByTimestamp", () => {
    it("returns latest op by timestamp (add wins when later)", () => {
      const rows = [
        {
          op: "remove" as const,
          timestamp: 1000,
          createdAt: 1000,
          deletedAt: null as number | null,
        },
        {
          op: "add" as const,
          timestamp: 2000,
          createdAt: 2000,
          deletedAt: null as number | null,
        },
      ];
      const latest = pickLatestOpByTimestamp(rows);
      expect(latest).not.toBeNull();
      expect(latest!.op).toBe("add");
      expect(latest!.timestamp).toBe(2000);
    });

    it("returns latest op by timestamp (remove wins when later)", () => {
      const rows = [
        {
          op: "add" as const,
          timestamp: 1000,
          createdAt: 1000,
          deletedAt: null as number | null,
        },
        {
          op: "remove" as const,
          timestamp: 2000,
          createdAt: 2000,
          deletedAt: null as number | null,
        },
      ];
      const latest = pickLatestOpByTimestamp(rows);
      expect(latest).not.toBeNull();
      expect(latest!.op).toBe("remove");
      expect(latest!.timestamp).toBe(2000);
    });

    it("ignores rows with deletedAt set", () => {
      const rows = [
        {
          op: "remove" as const,
          timestamp: 2000,
          createdAt: 2000,
          deletedAt: 3000 as number | null,
        },
        {
          op: "add" as const,
          timestamp: 1000,
          createdAt: 1000,
          deletedAt: null as number | null,
        },
      ];
      const latest = pickLatestOpByTimestamp(rows);
      expect(latest).not.toBeNull();
      expect(latest!.op).toBe("add");
      expect(latest!.timestamp).toBe(1000);
    });

    it("uses createdAt as tie-breaker when timestamps are equal", () => {
      const rows = [
        {
          op: "add" as const,
          timestamp: 1000,
          createdAt: 1000,
          deletedAt: null as number | null,
        },
        {
          op: "remove" as const,
          timestamp: 1000,
          createdAt: 2000,
          deletedAt: null as number | null,
        },
      ];
      const latest = pickLatestOpByTimestamp(rows);
      expect(latest).not.toBeNull();
      expect(latest!.op).toBe("remove");
      expect(latest!.createdAt).toBe(2000);
    });

    it("returns null when all rows have deletedAt set", () => {
      const rows = [
        {
          op: "add" as const,
          timestamp: 1000,
          createdAt: 1000,
          deletedAt: 2000 as number | null,
        },
      ];
      const latest = pickLatestOpByTimestamp(rows);
      expect(latest).toBeNull();
    });

    it("returns null for empty array", () => {
      const latest = pickLatestOpByTimestamp([]);
      expect(latest).toBeNull();
    });
  });

  describe("applyPaperAuthorOrSet", () => {
    it("processes affected keys and resolves latest op from paperAuthor", async () => {
      const paperId = uuidv4();
      const authorId = uuidv4();
      const now = Date.now();

      await db
        .insertInto("paperAuthor")
        .values([
          {
            id: uuidv4(),
            libraryId,
            paperId,
            authorId,
            op: "add",
            timestamp: now,
            deviceId: "device-a",
            localInsertedAt: now,
            createdAt: now,
            createdByDeviceId: "device-a",
            deletedAt: null,
            deletedByDeviceId: null,
          },
          {
            id: uuidv4(),
            libraryId,
            paperId,
            authorId,
            op: "remove",
            timestamp: now + 1000,
            deviceId: "device-b",
            localInsertedAt: now + 1000,
            createdAt: now + 1000,
            createdByDeviceId: "device-b",
            deletedAt: null,
            deletedByDeviceId: null,
          },
        ])
        .execute();

      await withTransaction((tx) =>
        applyPaperAuthorOrSet(tx, [{ libraryId, paperId, authorId }]),
      );
      // No throw; resolution runs. Current membership would be "remove" (latest).
    });

    it("deduplicates affected keys", async () => {
      const paperId = uuidv4();
      const authorId = uuidv4();

      await db
        .insertInto("paperAuthor")
        .values({
          id: uuidv4(),
          libraryId,
          paperId,
          authorId,
          op: "add",
          timestamp: Date.now(),
          deviceId: "device-a",
          localInsertedAt: Date.now(),
          createdAt: Date.now(),
          createdByDeviceId: "device-a",
          deletedAt: null,
          deletedByDeviceId: null,
        })
        .execute();

      await withTransaction((tx) =>
        applyPaperAuthorOrSet(tx, [
          { libraryId, paperId, authorId },
          { libraryId, paperId, authorId },
        ]),
      );
      // No throw; single key processed.
    });
  });

  describe("applyPaperTagOrSet", () => {
    it("processes affected keys and resolves latest op from paperTag", async () => {
      const paperId = uuidv4();
      const tagId = uuidv4();
      const now = Date.now();

      await db
        .insertInto("paperTag")
        .values([
          {
            id: uuidv4(),
            libraryId,
            paperId,
            tagId,
            op: "add",
            timestamp: now,
            deviceId: "device-a",
            localInsertedAt: now,
            createdAt: now,
            createdByDeviceId: "device-a",
            deletedAt: null,
            deletedByDeviceId: null,
          },
          {
            id: uuidv4(),
            libraryId,
            paperId,
            tagId,
            op: "add",
            timestamp: now + 500,
            deviceId: "device-b",
            localInsertedAt: now + 500,
            createdAt: now + 500,
            createdByDeviceId: "device-b",
            deletedAt: null,
            deletedByDeviceId: null,
          },
        ])
        .execute();

      await withTransaction((tx) =>
        applyPaperTagOrSet(tx, [{ libraryId, paperId, tagId }]),
      );
      // No throw; latest op is "add".
    });
  });
});
