import { v4 as uuidv4 } from "uuid";
import { db } from "@/service/services/database/sqlite/db";
import { ensureLibraryId } from "@/service/services/sync/pollyfills/utils";
import { syncStateStore } from "@/service/services/sync/states";
import { pickLatestOpByTimestamp } from "@/service/services/sync/pollyfills/relationship";
import type { IEntityObject } from "@/models/entity";
import type { ICategorizerObject } from "@/models/categorizer";

export interface UpsertPaperResult {
  paperId: string;
  libraryId: string;
  lastLocalInsertedAt: number;
}

/**
 * SQLite paper command: single entry for local paper writes.
 * Writes paper row, paperFieldVersion rows, and paperTag/paperFolder or-set ops.
 * Returns result for projection (projectRange or ensureCaughtUp).
 */
export async function upsertPaper(
  draft: IEntityObject
): Promise<UpsertPaperResult> {
  const libraryId = await ensureLibraryId("main");
  const deviceId = syncStateStore.get("deviceId");
  const now = Date.now();
  const paperId =
    typeof draft._id === "string"
      ? draft._id
      : (draft._id as { toString: () => string }).toString();

  await db.transaction().execute(async (tx) => {
    const existing = await tx
      .selectFrom("paper")
      .select("id")
      .where("id", "=", paperId)
      .where("libraryId", "=", libraryId)
      .executeTakeFirst();

    const paperRow = {
      id: paperId,
      legacyOid: draft._id.toString(),
      libraryId,
      type: draft.type ?? "article",
      title: draft.title ?? "",
      abstract: draft.abstract ?? null,
      journal: draft.journal ?? null,
      booktitle: draft.booktitle ?? null,
      year:
        typeof draft.year === "number"
          ? draft.year
          : draft.year != null
            ? parseInt(String(draft.year), 10)
            : null,
      month:
        typeof draft.month === "number"
          ? draft.month
          : draft.month != null
            ? parseInt(String(draft.month), 10)
            : null,
      volume: draft.volume ?? null,
      number: draft.number ?? null,
      pages: draft.pages ?? null,
      publisher: draft.publisher ?? null,
      series: draft.series ?? null,
      edition: draft.edition ?? null,
      editor: draft.editor ?? null,
      howPublished: draft.howpublished ?? null,
      organization: draft.organization ?? null,
      school: draft.school ?? null,
      institution: draft.institution ?? null,
      address: draft.address ?? null,
      doi: draft.doi ?? null,
      arxiv: draft.arxiv ?? null,
      isbn: draft.isbn ?? null,
      issn: draft.issn ?? null,
      notes: draft.note ?? null,
      flag: draft.flag,
      rating: draft.rating ?? 0,
      read: draft.read ?? null,
      feedId: (draft as any).feedId ?? null,
      feedItemId: (draft as any).feedItemId ?? null,
      createdAt: existing
        ? (await tx.selectFrom("paper").select("createdAt").where("id", "=", paperId).where("libraryId", "=", libraryId).executeTakeFirst())?.createdAt ?? now
        : now,
      createdByDeviceId: existing
        ? (await tx.selectFrom("paper").select("createdByDeviceId").where("id", "=", paperId).where("libraryId", "=", libraryId).executeTakeFirst())?.createdByDeviceId ?? deviceId
        : deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
      updatedAt: now,
      updatedByDeviceId: deviceId,
    };

    if (existing) {
      await tx
        .updateTable("paper")
        .set({
          type: paperRow.type,
          title: paperRow.title,
          abstract: paperRow.abstract,
          journal: paperRow.journal,
          booktitle: paperRow.booktitle,
          year: paperRow.year,
          month: paperRow.month,
          volume: paperRow.volume,
          number: paperRow.number,
          pages: paperRow.pages,
          publisher: paperRow.publisher,
          series: paperRow.series,
          edition: paperRow.edition,
          editor: paperRow.editor,
          howPublished: paperRow.howPublished,
          organization: paperRow.organization,
          school: paperRow.school,
          institution: paperRow.institution,
          address: paperRow.address,
          doi: paperRow.doi,
          arxiv: paperRow.arxiv,
          isbn: paperRow.isbn,
          issn: paperRow.issn,
          notes: paperRow.notes,
          flag: paperRow.flag,
          rating: paperRow.rating,
          read: paperRow.read,
          updatedAt: paperRow.updatedAt,
          updatedByDeviceId: paperRow.updatedByDeviceId,
        })
        .where("id", "=", paperId)
        .where("libraryId", "=", libraryId)
        .execute();
    } else {
      await tx
        .insertInto("paper")
        .values({
          id: paperRow.id,
          legacyOid: paperRow.legacyOid,
          libraryId: paperRow.libraryId,
          createdAt: paperRow.createdAt,
          createdByDeviceId: paperRow.createdByDeviceId,
          deletedAt: paperRow.deletedAt,
          deletedByDeviceId: paperRow.deletedByDeviceId,
          updatedAt: paperRow.updatedAt,
          updatedByDeviceId: paperRow.updatedByDeviceId,
          type: paperRow.type,
          title: paperRow.title,
          abstract: paperRow.abstract,
          journal: paperRow.journal,
          booktitle: paperRow.booktitle,
          year: paperRow.year,
          month: paperRow.month,
          volume: paperRow.volume,
          number: paperRow.number,
          pages: paperRow.pages,
          publisher: paperRow.publisher,
          series: paperRow.series,
          edition: paperRow.edition,
          editor: paperRow.editor,
          howPublished: paperRow.howPublished,
          organization: paperRow.organization,
          school: paperRow.school,
          institution: paperRow.institution,
          address: paperRow.address,
          doi: paperRow.doi,
          arxiv: paperRow.arxiv,
          isbn: paperRow.isbn,
          issn: paperRow.issn,
          notes: paperRow.notes,
          flag: paperRow.flag,
          rating: paperRow.rating,
          read: paperRow.read,
          feedId: paperRow.feedId,
          feedItemId: paperRow.feedItemId,
        })
        .execute();
    }

    // CRDT: one field_version record with field="entity", value = full entity (create: deletedAt null)
    const paperEntity = {
      id: paperRow.id,
      legacyOid: paperRow.legacyOid,
      libraryId: paperRow.libraryId,
      type: paperRow.type,
      title: paperRow.title,
      abstract: paperRow.abstract,
      journal: paperRow.journal,
      booktitle: paperRow.booktitle,
      year: paperRow.year,
      month: paperRow.month,
      volume: paperRow.volume,
      number: paperRow.number,
      pages: paperRow.pages,
      publisher: paperRow.publisher,
      series: paperRow.series,
      edition: paperRow.edition,
      editor: paperRow.editor,
      howPublished: paperRow.howPublished,
      organization: paperRow.organization,
      school: paperRow.school,
      institution: paperRow.institution,
      address: paperRow.address,
      doi: paperRow.doi,
      arxiv: paperRow.arxiv,
      isbn: paperRow.isbn,
      issn: paperRow.issn,
      notes: paperRow.notes,
      flag: paperRow.flag,
      rating: paperRow.rating,
      read: paperRow.read,
      feedId: paperRow.feedId,
      feedItemId: paperRow.feedItemId,
      createdAt: paperRow.createdAt,
      createdByDeviceId: paperRow.createdByDeviceId,
      deletedAt: null,
      deletedByDeviceId: null,
      updatedAt: paperRow.updatedAt,
      updatedByDeviceId: paperRow.updatedByDeviceId,
    };
    await tx
      .insertInto("paperFieldVersion")
      .values({
        id: uuidv4(),
        paperId,
        field: "entity",
        value: JSON.stringify(paperEntity),
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

    const tagIds = new Set(
      (draft.tags ?? []).map((t: ICategorizerObject) =>
        typeof t._id === "string" ? t._id : (t._id as any).toString()
      )
    );
    const folderIds = new Set(
      (draft.folders ?? []).map((f: ICategorizerObject) =>
        typeof f._id === "string" ? f._id : (f._id as any).toString()
      )
    );

    const currentTagRows = await tx
      .selectFrom("paperTag")
      .selectAll()
      .where("paperId", "=", paperId)
      .where("libraryId", "=", libraryId)
      .execute();
    const currentTagIdSet = new Set<string>();
    const byTagId = new Map<string, typeof currentTagRows>();
    for (const r of currentTagRows) {
      if (!byTagId.has(r.tagId)) byTagId.set(r.tagId, []);
      byTagId.get(r.tagId)!.push(r);
    }
    for (const [, rows] of byTagId) {
      const latest = pickLatestOpByTimestamp(rows);
      if (latest && latest.op === "add") currentTagIdSet.add(latest.tagId);
    }

    for (const tagId of currentTagIdSet) {
      if (!tagIds.has(tagId)) {
        await tx
          .insertInto("paperTag")
          .values({
            id: uuidv4(),
            paperId,
            tagId,
            op: "remove",
            timestamp: now,
            deviceId,
            createdAt: now,
            createdByDeviceId: deviceId,
            deletedAt: null,
            deletedByDeviceId: null,
            libraryId,
            localInsertedAt: now,
          })
          .execute();
      }
    }
    for (const tagId of tagIds) {
      await tx
        .insertInto("paperTag")
        .values({
          id: uuidv4(),
          paperId,
          tagId,
          op: "add",
          timestamp: now,
          deviceId,
          createdAt: now,
          createdByDeviceId: deviceId,
          deletedAt: null,
          deletedByDeviceId: null,
          libraryId,
          localInsertedAt: now,
        })
        .execute();
    }

    const currentFolderRows = await tx
      .selectFrom("paperFolder")
      .selectAll()
      .where("paperId", "=", paperId)
      .where("libraryId", "=", libraryId)
      .execute();
    const currentFolderIdSet = new Set<string>();
    const byFolderId = new Map<string, typeof currentFolderRows>();
    for (const r of currentFolderRows) {
      if (!byFolderId.has(r.folderId)) byFolderId.set(r.folderId, []);
      byFolderId.get(r.folderId)!.push(r);
    }
    for (const [, rows] of byFolderId) {
      const latest = pickLatestOpByTimestamp(rows);
      if (latest && latest.op === "add") currentFolderIdSet.add(latest.folderId);
    }

    for (const folderId of currentFolderIdSet) {
      if (!folderIds.has(folderId)) {
        await tx
          .insertInto("paperFolder")
          .values({
            id: uuidv4(),
            paperId,
            folderId,
            op: "remove",
            timestamp: now,
            deviceId,
            createdAt: now,
            createdByDeviceId: deviceId,
            deletedAt: null,
            deletedByDeviceId: null,
            libraryId,
            localInsertedAt: now,
          })
          .execute();
      }
    }
    for (const folderId of folderIds) {
      await tx
        .insertInto("paperFolder")
        .values({
          id: uuidv4(),
          paperId,
          folderId,
          op: "add",
          timestamp: now,
          deviceId,
          createdAt: now,
          createdByDeviceId: deviceId,
          deletedAt: null,
          deletedByDeviceId: null,
          libraryId,
          localInsertedAt: now,
        })
        .execute();
    }
  });

  return { paperId, libraryId, lastLocalInsertedAt: now };
}

/**
 * Returns paper ids (SQLite id) for papers that belong to the given feed (feedId is feed's UUID).
 * Used when deleting a feed to also soft-delete its feed-entity papers.
 */
export async function getPaperIdsByFeedId(feedId: string): Promise<string[]> {
  const libraryId = await ensureLibraryId("main");
  const rows = await db
    .selectFrom("paper")
    .select("id")
    .where("feedId", "=", feedId)
    .where("libraryId", "=", libraryId)
    .where("deletedAt", "is", null)
    .execute();
  return rows.map((r) => r.id);
}

const THREE_DAYS_MS = 86400000 * 3;
const THIRTY_DAYS_MS = 86400000 * 30;

/**
 * Soft-deletes outdated feed-entity papers (papers with feedId set).
 * Read and &lt; 3 days: delete. Unread and &lt; 30 days: delete.
 */
export async function deleteOutdatedFeedEntityPapers(): Promise<number> {
  const libraryId = await ensureLibraryId("main");
  const now = Date.now();
  const readThreshold = now - THREE_DAYS_MS;
  const unreadThreshold = now - THIRTY_DAYS_MS;

  const readRows = await db
    .selectFrom("paper")
    .select("id")
    .where("libraryId", "=", libraryId)
    .where("feedId", "is not", null)
    .where("deletedAt", "is", null)
    .where("read", "=", true)
    .where("createdAt", "<", readThreshold)
    .execute();

  const unreadRows = await db
    .selectFrom("paper")
    .select("id")
    .where("libraryId", "=", libraryId)
    .where("feedId", "is not", null)
    .where("deletedAt", "is", null)
    .where("createdAt", "<", unreadThreshold)
    .where((eb) =>
      eb.or([eb("read", "=", false), eb("read", "is", null)])
    )
    .execute();

  const ids = new Set([...readRows.map((r) => r.id), ...unreadRows.map((r) => r.id)]);
  for (const paperId of ids) {
    await deletePaper(paperId);
  }
  return ids.size;
}

export interface DeletePaperResult {
  paperId: string;
  libraryId: string;
  lastLocalInsertedAt: number;
}

/**
 * Soft-delete paper in SQLite (sets deletedAt, writes field version and or-set remove ops).
 */
export async function deletePaper(paperId: string): Promise<DeletePaperResult | null> {
  const libraryId = await ensureLibraryId("main");
  const deviceId = syncStateStore.get("deviceId");
  const now = Date.now();

  const existing = await db
    .selectFrom("paper")
    .selectAll()
    .where("id", "=", paperId)
    .where("libraryId", "=", libraryId)
    .where("deletedAt", "is", null)
    .executeTakeFirst();

  if (!existing) return null;

  await db.transaction().execute(async (tx) => {
    await tx
      .updateTable("paper")
      .set({
        deletedAt: now,
        deletedByDeviceId: deviceId,
        updatedAt: now,
        updatedByDeviceId: deviceId,
      })
      .where("id", "=", paperId)
      .where("libraryId", "=", libraryId)
      .execute();

    const updated = await tx
      .selectFrom("paper")
      .selectAll()
      .where("id", "=", paperId)
      .where("libraryId", "=", libraryId)
      .executeTakeFirst();

    if (updated) {
      // CRDT: one field_version record with field="entity", value = entity data (delete: deletedAt + deletedByDeviceId set)
      const paperEntity = {
        id: updated.id,
        legacyOid: updated.legacyOid,
        libraryId: updated.libraryId,
        type: updated.type,
        title: updated.title,
        abstract: updated.abstract,
        journal: updated.journal,
        booktitle: updated.booktitle,
        year: updated.year,
        month: updated.month,
        volume: updated.volume,
        number: updated.number,
        pages: updated.pages,
        publisher: updated.publisher,
        series: updated.series,
        edition: updated.edition,
        editor: updated.editor,
        howPublished: updated.howPublished,
        organization: updated.organization,
        school: updated.school,
        institution: updated.institution,
        address: updated.address,
        doi: updated.doi,
        arxiv: updated.arxiv,
        isbn: updated.isbn,
        issn: updated.issn,
        notes: updated.notes,
        flag: updated.flag,
        rating: updated.rating,
        read: updated.read,
        feedId: updated.feedId,
        feedItemId: updated.feedItemId,
        createdAt: updated.createdAt,
        createdByDeviceId: updated.createdByDeviceId,
        deletedAt: updated.deletedAt,
        deletedByDeviceId: updated.deletedByDeviceId,
        updatedAt: updated.updatedAt,
        updatedByDeviceId: updated.updatedByDeviceId,
      };
      await tx
        .insertInto("paperFieldVersion")
        .values({
          id: uuidv4(),
          paperId,
          field: "entity",
          value: JSON.stringify(paperEntity),
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

  return { paperId, libraryId, lastLocalInsertedAt: now };
}
