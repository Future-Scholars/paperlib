import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { db } from "@/service/services/database/sqlite/db";
import { writeChangeRecordsToDb } from "@/service/services/sync/write-change-records";
import { getChangeRecords } from "@/service/services/sync/sync-client";
import type { ChangeRecord, ContinuationToken } from "@/service/services/sync/dto";
import { ensureLibraryId } from "@/service/services/sync/pollyfills/utils";
import { v4 as uuidv4 } from "uuid";

describe("Sync client DTO write and read", () => {
  let libraryId: string;
  const paperId = uuidv4();
  const authorId = uuidv4();
  const now = new Date().toISOString();
  const nowMs = Date.now();

  beforeAll(async () => {
    libraryId = await ensureLibraryId("main");
  });

  beforeEach(async () => {
    await db.deleteFrom("paperFieldVersion").execute();
    await db.deleteFrom("paperAuthor").execute();
  });

  describe("writeChangeRecordsToDb (merge DTO into DB)", () => {
    it("writes paper field_version and merges into paperFieldVersion table", async () => {
      const fieldVersionId = uuidv4();
      const changeRecords: ChangeRecord[] = [
        {
          type: "field_version",
          model: "paper",
          data: {
            id: fieldVersionId,
            libraryId,
            value: JSON.stringify("Test Title"),
            hash: null,
            timestamp: now,
            deviceId: "device-1",
            createdAt: now,
            createdByDeviceId: "device-1",
            deletedAt: null,
            deletedByDeviceId: null,
            field: "title",
            paperId,
          },
        },
      ];

      const tx = await db.startTransaction().execute();
      try {
        await writeChangeRecordsToDb(tx, changeRecords, nowMs);
        await tx.commit().execute();
      } catch (e) {
        await tx.rollback().execute();
        throw e;
      }

      const row = await db
        .selectFrom("paperFieldVersion")
        .selectAll()
        .where("id", "=", fieldVersionId)
        .executeTakeFirst();

      expect(row).toBeDefined();
      expect(row!.libraryId).toBe(libraryId);
      expect(row!.paperId).toBe(paperId);
      expect(row!.field).toBe("title");
      expect(row!.value).toBe(JSON.stringify("Test Title"));
      expect(row!.localInsertedAt).toBe(nowMs);
    });

    it("writes or_set paperAuthor and merges into paperAuthor table", async () => {
      const relationId = uuidv4();
      const changeRecords: ChangeRecord[] = [
        {
          type: "or_set",
          model: "paperAuthor",
          data: {
            id: relationId,
            libraryId,
            op: "add",
            timestamp: now,
            deviceId: "device-1",
            createdAt: now,
            createdByDeviceId: "device-1",
            deletedAt: null,
            deletedByDeviceId: null,
            paperId,
            authorId,
          },
        },
      ];

      const tx = await db.startTransaction().execute();
      try {
        await writeChangeRecordsToDb(tx, changeRecords, nowMs);
        await tx.commit().execute();
      } catch (e) {
        await tx.rollback().execute();
        throw e;
      }

      const row = await db
        .selectFrom("paperAuthor")
        .selectAll()
        .where("id", "=", relationId)
        .executeTakeFirst();

      expect(row).toBeDefined();
      expect(row!.libraryId).toBe(libraryId);
      expect(row!.paperId).toBe(paperId);
      expect(row!.authorId).toBe(authorId);
      expect(row!.op).toBe("add");
      expect(row!.localInsertedAt).toBe(nowMs);
    });

    it("writes multiple change records and merges all into DB", async () => {
      const fieldVersionId = uuidv4();
      const relationId = uuidv4();
      const changeRecords: ChangeRecord[] = [
        {
          type: "field_version",
          model: "paper",
          data: {
            id: fieldVersionId,
            libraryId,
            value: JSON.stringify("Merged Title"),
            hash: null,
            timestamp: now,
            deviceId: "device-1",
            createdAt: now,
            createdByDeviceId: "device-1",
            deletedAt: null,
            deletedByDeviceId: null,
            field: "title",
            paperId,
          },
        },
        {
          type: "or_set",
          model: "paperAuthor",
          data: {
            id: relationId,
            libraryId,
            op: "add",
            timestamp: now,
            deviceId: "device-1",
            createdAt: now,
            createdByDeviceId: "device-1",
            deletedAt: null,
            deletedByDeviceId: null,
            paperId,
            authorId,
          },
        },
      ];

      const tx = await db.startTransaction().execute();
      try {
        const affected = await writeChangeRecordsToDb(tx, changeRecords, nowMs);
        await tx.commit().execute();

        expect(affected.affectedPaperFields).toHaveLength(1);
        expect(affected.affectedPaperAuthorKeys).toHaveLength(1);
      } catch (e) {
        await tx.rollback().execute();
        throw e;
      }

      const fvRow = await db
        .selectFrom("paperFieldVersion")
        .selectAll()
        .where("id", "=", fieldVersionId)
        .executeTakeFirst();
      expect(fvRow).toBeDefined();
      expect(fvRow!.value).toBe(JSON.stringify("Merged Title"));

      const relRow = await db
        .selectFrom("paperAuthor")
        .selectAll()
        .where("id", "=", relationId)
        .executeTakeFirst();
      expect(relRow).toBeDefined();
      expect(relRow!.op).toBe("add");
    });
  });

  describe("getChangeRecords (filter and merge DB into DTO)", () => {
    it("filters by continuation token and returns DTOs merged from DB", async () => {
      const libId = await ensureLibraryId("main");
      const fvId = uuidv4();
      const insertedAt = Date.now() - 1000;

      await db
        .insertInto("paperFieldVersion")
        .values({
          id: fvId,
          libraryId: libId,
          paperId,
          field: "title",
          value: JSON.stringify("Read Back Title"),
          hash: null,
          timestamp: insertedAt,
          deviceId: "device-1",
          localInsertedAt: insertedAt,
          createdAt: insertedAt,
          createdByDeviceId: "device-1",
          deletedAt: null,
          deletedByDeviceId: null,
        })
        .execute();

      const token: ContinuationToken = {
        since_committed_at: new Date(0).toISOString(),
        since_id: "00000000-0000-0000-0000-000000000000",
        limit: 100,
      };

      const records = await getChangeRecords(token);

      const paperRecord = records.find(
        (r) => r.type === "field_version" && r.model === "paper" && r.data.id === fvId
      );
      expect(paperRecord).toBeDefined();
      if (paperRecord && paperRecord.type === "field_version" && paperRecord.model === "paper") {
        expect(paperRecord.data.paperId).toBe(paperId);
        expect(paperRecord.data.field).toBe("title");
        expect(paperRecord.data.value).toBe(JSON.stringify("Read Back Title"));
        expect(paperRecord.data.timestamp).toBeDefined();
        expect(paperRecord.data.createdAt).toBeDefined();
      }
    });

    it("respects limit when filtering", async () => {
      const libId = await ensureLibraryId("main");
      const insertedAt = Date.now() - 2000;

      await db
        .insertInto("paperFieldVersion")
        .values([
          {
            id: uuidv4(),
            libraryId: libId,
            paperId,
            field: "title",
            value: JSON.stringify("A"),
            hash: null,
            timestamp: insertedAt,
            deviceId: "d1",
            localInsertedAt: insertedAt,
            createdAt: insertedAt,
            createdByDeviceId: "d1",
            deletedAt: null,
            deletedByDeviceId: null,
          },
          {
            id: uuidv4(),
            libraryId: libId,
            paperId,
            field: "abstract",
            value: JSON.stringify("B"),
            hash: null,
            timestamp: insertedAt + 1,
            deviceId: "d1",
            localInsertedAt: insertedAt + 1,
            createdAt: insertedAt + 1,
            createdByDeviceId: "d1",
            deletedAt: null,
            deletedByDeviceId: null,
          },
        ])
        .execute();

      const token: ContinuationToken = {
        since_committed_at: new Date(0).toISOString(),
        since_id: "00000000-0000-0000-0000-000000000000",
        limit: 1,
      };

      const records = await getChangeRecords(token);
      expect(records.length).toBeLessThanOrEqual(1);
    });
  });
});
