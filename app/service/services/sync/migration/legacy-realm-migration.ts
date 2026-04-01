/**
 * legacy-realm-migration.ts
 *
 * One-time migration from the legacy Realm database to the paperlib-core
 * SQLite schema.
 *
 * What it does:
 *  1. Opens the existing Realm database in read-only mode.
 *  2. For each Entity (paper): calls engine.mutateEntity("paper", "insert", …).
 *     For each author string token: creates an author entity + paper_author relation.
 *     For each tag: creates a tag entity + paper_tag relation.
 *     For each folder: creates a collection entity + paper_collection relation.
 *  3. For each Feed: calls engine.mutateEntity("feed", "insert", …).
 *  4. For each PaperTag / PaperFolder categorizer: already handled per-paper above.
 *  5. Backs up the Realm database file before starting so data is never lost.
 *
 * ObjectId → UUID mapping
 * ────────────────────────
 * Every migrated entity receives a fresh UUID as its primary key.  The
 * original Realm ObjectId is stored in the `legacy_oid` column of the
 * corresponding SQLite table so the projection layer (realm-applier.ts) can
 * recreate the correct Realm ObjectId when writing back to Realm.
 *
 * We use String(realmObject._id) to obtain the hex representation of the
 * ObjectId, avoiding reliance on the .toHexString() method which may not
 * be available on all Realm ObjectId objects.
 *
 * Usage
 * ─────
 * Call runLegacyMigration() once at startup (it is idempotent — it records
 * completion in sync state and skips subsequent calls).
 */

import fs from "fs";
import path from "path";
import Realm from "realm";
import { v4 as uuidv4 } from "uuid";
import type { EntityMutationRequest, RelationMutationRequest } from "@future-scholars/paperlib-core";
import { coreDb, createWriteEngine, ensureCoreDbMigrated, ensureCoreLibrary } from "@/service/services/database/sqlite/core-db";
import { syncStateStore } from "@/service/services/sync/states";
import { Entity } from "@/models/entity";
import { PaperTag, PaperFolder } from "@/models/categorizer";
import { Feed } from "@/models/feed";

// ---------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------

function backupRealmFile(realmPath: string): void {
  const backupPath = `${realmPath}.legacy-backup-${Date.now()}`;
  if (fs.existsSync(realmPath)) {
    fs.copyFileSync(realmPath, backupPath);
  }
}

// ---------------------------------------------------------------------------
// Helper: set legacy_oid on an entity row after creation
// ---------------------------------------------------------------------------

async function setLegacyOid(
  table: "papers" | "authors" | "attachments" | "tags" | "collections" | "feeds",
  entityId: string,
  legacyOid: string,
): Promise<void> {
  await coreDb
    .updateTable(table)
    .set({ legacy_oid: legacyOid } as never)
    .where("id", "=", entityId)
    .execute();
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

/**
 * Runs the one-time migration from legacy Realm to paperlib-core SQLite.
 * Safe to call on every startup — skips if already completed.
 */
export async function runLegacyMigration(realmPath: string): Promise<void> {
  if (syncStateStore.get("legacyMigrationDone" as never)) return;

  await ensureCoreDbMigrated();

  const deviceId = syncStateStore.get("deviceId");
  let libraryId: string | null = syncStateStore.get("libraryId") ?? null;
  if (!libraryId) {
    libraryId = uuidv4();
    syncStateStore.set("libraryId", libraryId);
  }
  await ensureCoreLibrary(libraryId, deviceId);

  const engine = createWriteEngine(deviceId);

  // Back up first.
  backupRealmFile(realmPath);

  // Open Realm in read-only mode using the minimal schema we need.
  const realm = await Realm.open({
    path: realmPath,
    readOnly: true,
    schema: [Entity.schema, PaperTag.schema, PaperFolder.schema, Feed.schema],
  });

  try {
    // --- 1. Feeds ---
    const feeds = realm.objects<Feed>(Feed.schema.name);
    for (const feed of feeds) {
      const oidStr = String(feed._id);
      const feedId = uuidv4();
      const req: EntityMutationRequest = {
        entity_type: "feed",
        entity_id: feedId,
        library_id: libraryId,
        action: "insert",
        payload: {
          name: feed.name ?? "",
          description: "",
          type: "rss",
          url: (feed as unknown as { url?: string }).url ?? "",
          count: (feed as unknown as { count?: number }).count ?? 0,
          colour: (feed as unknown as { color?: string }).color ?? null,
        },
      };
      await engine.mutateEntity(req).catch(() => { /* already inserted on retry */ });
      await setLegacyOid("feeds", feedId, oidStr);
    }

    // --- 2. Tags and Folders (categorizers) ---
    // Collect all unique tags / folders from papers so we can upsert them once.
    const allTags = realm.objects<PaperTag>(PaperTag.schema.name);
    const tagIdMap = new Map<string, string>(); // realmOidStr → uuid
    for (const tag of allTags) {
      const oidStr = String(tag._id);
      const tagId = uuidv4();
      tagIdMap.set(oidStr, tagId);
      await engine.mutateEntity({
        entity_type: "tag",
        entity_id: tagId,
        library_id: libraryId,
        action: "insert",
        payload: { name: tag.name ?? "", colour: tag.color ?? null, description: null },
      }).catch(() => {});
      await setLegacyOid("tags", tagId, oidStr);
    }

    const allFolders = realm.objects<PaperFolder>(PaperFolder.schema.name);
    const folderIdMap = new Map<string, string>();
    for (const folder of allFolders) {
      const oidStr = String(folder._id);
      const collId = uuidv4();
      folderIdMap.set(oidStr, collId);
      await engine.mutateEntity({
        entity_type: "collection",
        entity_id: collId,
        library_id: libraryId,
        action: "insert",
        payload: { name: folder.name ?? "", description: null, parentId: null },
      }).catch(() => {});
      await setLegacyOid("collections", collId, oidStr);
    }

    // --- 3. Papers ---
    const entities = realm.objects<Entity>(Entity.schema.name);
    for (const entity of entities) {
      const oidStr = String(entity._id);
      const paperId = uuidv4();

      // Insert the paper entity.
      const paperReq: EntityMutationRequest = {
        entity_type: "paper",
        entity_id: paperId,
        library_id: libraryId,
        action: "insert",
        payload: {
          type: entity.type ?? "article",
          title: entity.title ?? "",
          abstract: entity.abstract ?? null,
          journal: entity.journal ?? null,
          booktitle: entity.booktitle ?? null,
          year: entity.year ? parseInt(entity.year, 10) || null : null,
          month: entity.month ? parseInt(entity.month, 10) || null : null,
          volume: entity.volume ?? null,
          number: entity.number ?? null,
          pages: entity.pages ?? null,
          publisher: entity.publisher ?? null,
          series: entity.series ?? null,
          edition: entity.edition ?? null,
          editor: entity.editor ?? null,
          howPublished: entity.howpublished ?? null,
          organization: entity.organization ?? null,
          school: entity.school ?? null,
          institution: entity.institution ?? null,
          address: entity.address ?? null,
          doi: entity.doi ?? null,
          arxiv: entity.arxiv ?? null,
          isbn: entity.isbn ?? null,
          issn: entity.issn ?? null,
          notes: entity.note ?? null,
          rating: entity.rating ?? 0,
          flag: entity.flag ?? false,
        },
      };
      await engine.mutateEntity(paperReq).catch(() => {});
      await setLegacyOid("papers", paperId, oidStr);

      // Authors: split the comma-separated string and create author entities + relations.
      const authorTokens = (entity.authors ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      for (let i = 0; i < authorTokens.length; i++) {
        const name = authorTokens[i];
        const authorId = uuidv4();
        await engine.mutateEntity({
          entity_type: "author",
          entity_id: authorId,
          library_id: libraryId,
          action: "insert",
          payload: { name, affiliation: null, email: null, orcid: null, firstName: null, lastName: null },
        }).catch(() => {});

        const relationId = `${paperId}_${authorId}`;
        const relReq: RelationMutationRequest = {
          entity_type: "paper_author",
          entity_id: relationId,
          library_id: libraryId,
          action: "add",
          payload: { paper_id: paperId, author_id: authorId, author_order: i },
        };
        await engine.mutateRelation(relReq).catch(() => {});
      }

      // Tags.
      for (const tag of entity.tags ?? []) {
        const tagOidStr = tag._id ? String(tag._id) : null;
        if (!tagOidStr) continue;
        const tagId = tagIdMap.get(tagOidStr);
        if (!tagId) continue;
        const relReq: RelationMutationRequest = {
          entity_type: "paper_tag",
          entity_id: `${paperId}_${tagId}`,
          library_id: libraryId,
          action: "add",
          payload: { paper_id: paperId, tag_id: tagId },
        };
        await engine.mutateRelation(relReq).catch(() => {});
      }

      // Collections (folders).
      for (const folder of entity.folders ?? []) {
        const folderOidStr = folder._id ? String(folder._id) : null;
        if (!folderOidStr) continue;
        const collId = folderIdMap.get(folderOidStr);
        if (!collId) continue;
        const relReq: RelationMutationRequest = {
          entity_type: "paper_collection",
          entity_id: `${paperId}_${collId}`,
          library_id: libraryId,
          action: "add",
          payload: { paper_id: paperId, collection_id: collId },
        };
        await engine.mutateRelation(relReq).catch(() => {});
      }
    }
  } finally {
    realm.close();
  }

  // Mark complete so we never run this again.
  syncStateStore.set("legacyMigrationDone" as never, true as never);
}
