/**
 * realm-applier.ts
 *
 * Loads entity data from the paperlib-core SQLite tables (papers, tags,
 * collections, feeds, paper_tags, paper_collections, paper_authors, authors)
 * and upserts it into Realm so the UI layer sees up-to-date state.
 *
 * UUID → Realm ObjectId mapping
 * ──────────────────────────────
 * Realm uses 12-byte ObjectIds (24-char hex).  UUIDs are 16 bytes (32 hex).
 * For entities migrated from the legacy Realm DB, the original ObjectId is
 * stored in the `legacy_oid` column and used directly.  For new entities
 * (no legacy_oid), we derive a deterministic ObjectId by taking the first
 * 24 hex characters of the UUID (without hyphens).
 */

import Realm from "realm";
import { coreDb } from "@/service/services/database/sqlite/core-db";
import { Entity } from "@/models/entity";
import { CategorizerType } from "@/models/categorizer";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import type { ProjectionBatch } from "./projection-types";

// ---------------------------------------------------------------------------
// Helper: entity row → Realm ObjectId
// ---------------------------------------------------------------------------

/**
 * Returns the Realm ObjectId for an entity row.  If the row has a
 * legacy_oid (migrated from Realm), that is used directly.  Otherwise
 * we derive a deterministic ObjectId from the first 24 hex chars of the UUID.
 */
function rowToOid(id: string, legacyOid: string | null): Realm.BSON.ObjectId {
  if (legacyOid) {
    return new Realm.BSON.ObjectId(legacyOid);
  }
  const hex = id.replace(/-/g, "").substring(0, 24);
  return new Realm.BSON.ObjectId(hex);
}

// ---------------------------------------------------------------------------
// Row types (minimal projections from paperlib-core tables)
// ---------------------------------------------------------------------------

type TagRow = { id: string; legacy_oid: string | null; name: string; colour: string | null; is_deleted: boolean };
type CollectionRow = { id: string; legacy_oid: string | null; name: string; is_deleted: boolean };
type FeedRow = {
  id: string;
  legacy_oid: string | null;
  name: string;
  url: string;
  count: number;
  colour: string | null;
  is_deleted: boolean;
};
type PaperRow = {
  id: string;
  legacy_oid: string | null;
  is_deleted: boolean;
  type: string | null;
  title: string | null;
  abstract: string | null;
  journal: string | null;
  booktitle: string | null;
  year: number | null;
  month: number | null;
  volume: string | null;
  number: string | null;
  pages: string | null;
  publisher: string | null;
  series: string | null;
  edition: string | null;
  editor: string | null;
  howPublished: string | null;
  organization: string | null;
  school: string | null;
  institution: string | null;
  address: string | null;
  doi: string | null;
  arxiv: string | null;
  isbn: string | null;
  issn: string | null;
  notes: string | null;
  rating: number | null;
  flag: string | null; // stored as varchar in paperlib-core
  created_at: string;
};

// ---------------------------------------------------------------------------
// Data loader
// ---------------------------------------------------------------------------

async function loadBatchData(
  libraryId: string,
  batch: ProjectionBatch
): Promise<{
  feeds: FeedRow[];
  tags: TagRow[];
  collections: CollectionRow[];
  papers: PaperRow[];
  paperTagIds: Map<string, Set<string>>;
  paperCollectionIds: Map<string, Set<string>>;
  paperAuthorNames: Map<string, string[]>;
  paperFeedId: Map<string, string>;
}> {
  const feedIdsToLoad = new Set(batch.feedIds);

  // --- tags ---
  const tags: TagRow[] = [];
  for (const id of batch.tagIds) {
    const row = await coreDb
      .selectFrom("tags")
      .select(["id", "legacy_oid" as never, "name", "colour", "is_deleted"])
      .where("id", "=", id)
      .where("library_id", "=", libraryId)
      .executeTakeFirst();
    if (row) tags.push(row as TagRow);
  }

  // --- collections ---
  const collections: CollectionRow[] = [];
  for (const id of batch.collectionIds) {
    const row = await coreDb
      .selectFrom("collections")
      .select(["id", "legacy_oid" as never, "name", "is_deleted"])
      .where("id", "=", id)
      .where("library_id", "=", libraryId)
      .executeTakeFirst();
    if (row) collections.push(row as CollectionRow);
  }

  // --- papers + relations ---
  const papers: PaperRow[] = [];
  const paperTagIds = new Map<string, Set<string>>();
  const paperCollectionIds = new Map<string, Set<string>>();
  const paperAuthorNames = new Map<string, string[]>();
  const paperFeedId = new Map<string, string>();

  for (const paperId of batch.paperIds) {
    const paperRow = await coreDb
      .selectFrom("papers")
      .selectAll()
      .where("id", "=", paperId)
      .where("library_id", "=", libraryId)
      .executeTakeFirst();

    if (!paperRow) continue;
    papers.push(paperRow as unknown as PaperRow);

    // tags (alive relations: deleted_at IS NULL)
    const tagRels = await coreDb
      .selectFrom("paper_tags")
      .select("tag_id")
      .where("paper_id", "=", paperId)
      .where("library_id", "=", libraryId)
      .where("deleted_at", "is", null)
      .execute();
    paperTagIds.set(paperId, new Set(tagRels.map((r) => r.tag_id)));

    // collections
    const collRels = await coreDb
      .selectFrom("paper_collections")
      .select("collection_id")
      .where("paper_id", "=", paperId)
      .where("library_id", "=", libraryId)
      .where("deleted_at", "is", null)
      .execute();
    paperCollectionIds.set(paperId, new Set(collRels.map((r) => r.collection_id)));

    // authors (ordered by author_order nulls last)
    const authorRels = await coreDb
      .selectFrom("paper_authors")
      .innerJoin("authors", "authors.id", "paper_authors.author_id")
      .select(["authors.name", "paper_authors.author_order"])
      .where("paper_authors.paper_id", "=", paperId)
      .where("paper_authors.library_id", "=", libraryId)
      .where("paper_authors.deleted_at", "is", null)
      .orderBy("paper_authors.author_order", "asc")
      .execute();
    paperAuthorNames.set(paperId, authorRels.map((r) => r.name ?? "").filter(Boolean));

    // feed reference (paper_id stored in a dedicated "feed" attachment or paper_feeds relation)
    // In this schema, feed association is tracked via paper_attachments where attachment type = 'feed'
    // For simplicity, check if there's a matching feed entity using a known naming convention.
    // NOTE: If the data model stores feed_id differently, adjust this query.
    // For now we skip automatic feed detection; feed papers are projected from the feedIds batch.
  }

  // --- feeds ---
  const feeds: FeedRow[] = [];
  for (const id of feedIdsToLoad) {
    const row = await coreDb
      .selectFrom("feeds")
      .select(["id", "legacy_oid" as never, "name", "url", "count", "colour", "is_deleted"])
      .where("id", "=", id)
      .where("library_id", "=", libraryId)
      .executeTakeFirst();
    if (row) feeds.push(row as FeedRow);
  }

  return { feeds, tags, collections, papers, paperTagIds, paperCollectionIds, paperAuthorNames, paperFeedId };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Applies a projection batch to Realm: upserts feeds, tags, collections, then
 * papers (Entity).  Deleted entities are removed from Realm.
 * Idempotent: applying the same batch twice yields the same Realm state.
 */
export async function applyProjectionBatchToRealm(
  realm: Realm,
  batch: ProjectionBatch
): Promise<void> {
  const { libraryId } = batch;
  const { feeds, tags, collections, papers, paperTagIds, paperCollectionIds, paperAuthorNames } =
    await loadBatchData(libraryId, batch);

  // Build UUID → legacy_oid lookup maps for relation resolution inside the write block.
  // Include tags/collections from the batch, plus any referenced by papers that
  // were loaded in a prior projection cycle.
  const tagLegacyOidMap = new Map<string, string>();
  for (const t of tags) {
    if (t.legacy_oid) tagLegacyOidMap.set(t.id, t.legacy_oid);
  }
  const collLegacyOidMap = new Map<string, string>();
  for (const c of collections) {
    if (c.legacy_oid) collLegacyOidMap.set(c.id, c.legacy_oid);
  }

  // Collect any tag/collection IDs referenced by papers but not in this batch.
  const missingTagIds = new Set<string>();
  const missingCollIds = new Set<string>();
  for (const paperRow of papers) {
    for (const tid of paperTagIds.get(paperRow.id) ?? []) {
      if (!tagLegacyOidMap.has(tid)) missingTagIds.add(tid);
    }
    for (const cid of paperCollectionIds.get(paperRow.id) ?? []) {
      if (!collLegacyOidMap.has(cid)) missingCollIds.add(cid);
    }
  }
  for (const tid of missingTagIds) {
    const row = await coreDb
      .selectFrom("tags")
      .select(["id", "legacy_oid" as never])
      .where("id", "=", tid)
      .executeTakeFirst() as { id: string; legacy_oid: string | null } | undefined;
    if (row?.legacy_oid) tagLegacyOidMap.set(row.id, row.legacy_oid);
  }
  for (const cid of missingCollIds) {
    const row = await coreDb
      .selectFrom("collections")
      .select(["id", "legacy_oid" as never])
      .where("id", "=", cid)
      .executeTakeFirst() as { id: string; legacy_oid: string | null } | undefined;
    if (row?.legacy_oid) collLegacyOidMap.set(row.id, row.legacy_oid);
  }

  realm.write(() => {
    // --- feeds ---
    for (const row of feeds) {
      const oid = rowToOid(row.id, row.legacy_oid);
      if (row.is_deleted) {
        const existing = realm.objectForPrimaryKey(Feed.schema.name, oid);
        if (existing) realm.delete(existing);
        continue;
      }
      realm.create(
        Feed.schema.name,
        {
          _id: oid,
          _partition: "",
          name: row.name ?? "",
          url: row.url ?? "",
          count: row.count ?? 0,
          color: row.colour ?? "blue",
        },
        Realm.UpdateMode.Modified
      );
    }

    // --- tags ---
    for (const row of tags) {
      const oid = rowToOid(row.id, row.legacy_oid);
      if (row.is_deleted) {
        const existing = realm.objectForPrimaryKey(CategorizerType.PaperTag, oid);
        if (existing) realm.delete(existing);
        continue;
      }
      realm.create(
        CategorizerType.PaperTag,
        {
          _id: oid,
          _partition: "",
          name: row.name ?? "",
          color: row.colour ?? "blue",
          count: 0,
          children: [],
        },
        Realm.UpdateMode.Modified
      );
    }

    // --- collections (folders) ---
    for (const row of collections) {
      const oid = rowToOid(row.id, row.legacy_oid);
      if (row.is_deleted) {
        const existing = realm.objectForPrimaryKey(CategorizerType.PaperFolder, oid);
        if (existing) realm.delete(existing);
        continue;
      }
      realm.create(
        CategorizerType.PaperFolder,
        {
          _id: oid,
          _partition: "",
          name: row.name ?? "",
          color: "blue",
          count: 0,
          children: [],
        },
        Realm.UpdateMode.Modified
      );
    }

    // --- papers ---
    for (const paperRow of papers) {
      const paperOid = rowToOid(paperRow.id, paperRow.legacy_oid);

      if (paperRow.is_deleted) {
        const existingEntity = realm.objectForPrimaryKey(Entity.schema.name, paperOid);
        if (existingEntity) realm.delete(existingEntity);
        const existingFeedEntity = realm.objectForPrimaryKey(FeedEntity.schema.name, paperOid);
        if (existingFeedEntity) realm.delete(existingFeedEntity);
        continue;
      }

      // Resolve tag Realm objects
      const tagObjList: Realm.Object[] = [];
      for (const tid of paperTagIds.get(paperRow.id) ?? []) {
        const tagLegacyOid = tagLegacyOidMap.get(tid) ?? null;
        const tObj = realm.objectForPrimaryKey(CategorizerType.PaperTag, rowToOid(tid, tagLegacyOid));
        if (tObj) tagObjList.push(tObj as Realm.Object);
      }

      // Resolve collection Realm objects
      const collObjList: Realm.Object[] = [];
      for (const cid of paperCollectionIds.get(paperRow.id) ?? []) {
        const collLegacyOid = collLegacyOidMap.get(cid) ?? null;
        const cObj = realm.objectForPrimaryKey(CategorizerType.PaperFolder, rowToOid(cid, collLegacyOid));
        if (cObj) collObjList.push(cObj as Realm.Object);
      }

      // Authors as comma-separated string (Realm Entity.authors field)
      const authorsStr = (paperAuthorNames.get(paperRow.id) ?? []).join(", ");

      const addTime = paperRow.created_at ? new Date(paperRow.created_at) : new Date();
      const flagBool = paperRow.flag === "true" || paperRow.flag === "1";

      realm.create(
        Entity.schema.name,
        {
          _id: paperOid,
          _partition: "",
          addTime,
          library: "main",
          type: paperRow.type ?? "article",
          title: paperRow.title ?? "",
          authors: authorsStr,
          abstract: paperRow.abstract ?? undefined,
          journal: paperRow.journal ?? undefined,
          booktitle: paperRow.booktitle ?? undefined,
          year: String(paperRow.year ?? ""),
          month: paperRow.month != null ? String(paperRow.month) : undefined,
          volume: paperRow.volume ?? undefined,
          number: paperRow.number ?? undefined,
          pages: paperRow.pages ?? undefined,
          publisher: paperRow.publisher ?? undefined,
          series: paperRow.series ?? undefined,
          edition: paperRow.edition ?? undefined,
          editor: paperRow.editor ?? undefined,
          howpublished: paperRow.howPublished ?? undefined,
          organization: paperRow.organization ?? undefined,
          school: paperRow.school ?? undefined,
          institution: paperRow.institution ?? undefined,
          address: paperRow.address ?? undefined,
          doi: paperRow.doi ?? undefined,
          arxiv: paperRow.arxiv ?? undefined,
          isbn: paperRow.isbn ?? undefined,
          issn: paperRow.issn ?? undefined,
          notes: paperRow.notes ?? undefined,
          rating: paperRow.rating ?? 0,
          flag: flagBool,
          supplementaries: {},
          tags: tagObjList,
          folders: collObjList,
        },
        Realm.UpdateMode.Modified
      );
    }
  });
}
