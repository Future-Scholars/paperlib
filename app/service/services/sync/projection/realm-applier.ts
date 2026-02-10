import Realm from "realm";
import { db } from "@/service/services/database/sqlite/db";
import { Entity } from "@/models/entity";
import { CategorizerType } from "@/models/categorizer";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import { pickLatestOpByTimestamp } from "@/service/services/sync/pollyfills/relationship";
import type { ProjectionBatch } from "./projection-types";

type TagRow = { id: string; legacyOid: string; name: string; colour: string | null };
type FolderRow = { id: string; legacyOid: string; name: string; colour: string | null };
type FeedRow = {
  id: string;
  legacyOid: string | null;
  name: string;
  url: string;
  count: number;
  colour: string | null;
  deletedAt: number | null;
};
type PaperRow = {
  id: string;
  legacyOid: string;
  type: string;
  title: string;
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
  rating: number;
  flag: number | null;
  createdAt: number;
  deletedAt: number | null;
  feedId: string | null;
  feedItemId: string | null;
  read: number | null;
};

/**
 * Loads from SQLite all data needed to apply the batch to Realm (feeds, tags, folders, papers + relations).
 */
async function loadBatchDataFromSqlite(
  libraryId: string,
  batch: ProjectionBatch
): Promise<{
  feeds: FeedRow[];
  tags: TagRow[];
  folders: FolderRow[];
  papers: PaperRow[];
  paperTagIds: Map<string, Set<string>>;
  paperFolderIds: Map<string, Set<string>>;
}> {
  const feeds: FeedRow[] = [];
  const feedIdsToLoad = new Set(batch.feedIds);

  const tags: TagRow[] = [];
  for (const tagId of batch.tagIds) {
    const row = await db
      .selectFrom("tag")
      .select(["id", "legacyOid", "name", "colour"])
      .where("id", "=", tagId)
      .where("libraryId", "=", libraryId)
      .where("deletedAt", "is", null)
      .executeTakeFirst();
    if (row) tags.push(row as TagRow);
  }

  const folders: FolderRow[] = [];
  for (const folderId of batch.folderIds) {
    const row = await db
      .selectFrom("folder")
      .select(["id", "legacyOid", "name", "colour"])
      .where("id", "=", folderId)
      .where("libraryId", "=", libraryId)
      .where("deletedAt", "is", null)
      .executeTakeFirst();
    if (row) folders.push(row as FolderRow);
  }

  const papers: PaperRow[] = [];
  const paperTagIds = new Map<string, Set<string>>();
  const paperFolderIds = new Map<string, Set<string>>();

  for (const paperId of batch.paperIds) {
    const paperRow = await db
      .selectFrom("paper")
      .selectAll()
      .where("id", "=", paperId)
      .where("libraryId", "=", libraryId)
      .executeTakeFirst();

    if (!paperRow) continue;
    papers.push(paperRow as unknown as PaperRow);

    const paperTagRows = await db
      .selectFrom("paperTag")
      .selectAll()
      .where("libraryId", "=", libraryId)
      .where("paperId", "=", paperId)
      .execute();

    const tagIds = new Set<string>();
    const byTagId = new Map<string, typeof paperTagRows>();
    for (const r of paperTagRows) {
      if (!byTagId.has(r.tagId)) byTagId.set(r.tagId, []);
      byTagId.get(r.tagId)!.push(r);
    }
    for (const [, rows] of byTagId) {
      const latest = pickLatestOpByTimestamp(rows);
      if (latest && latest.op === "add") tagIds.add(latest.tagId);
    }
    paperTagIds.set(paperId, tagIds);

    const paperFolderRows = await db
      .selectFrom("paperFolder")
      .selectAll()
      .where("libraryId", "=", libraryId)
      .where("paperId", "=", paperId)
      .execute();

    const folderIds = new Set<string>();
    const byFolderId = new Map<string, typeof paperFolderRows>();
    for (const r of paperFolderRows) {
      if (!byFolderId.has(r.folderId)) byFolderId.set(r.folderId, []);
      byFolderId.get(r.folderId)!.push(r);
    }
    for (const [, rows] of byFolderId) {
      const latest = pickLatestOpByTimestamp(rows);
      if (latest && latest.op === "add") folderIds.add(latest.folderId);
    }
    paperFolderIds.set(paperId, folderIds);
    if (paperRow.feedId) feedIdsToLoad.add(paperRow.feedId);
  }

  for (const feedId of feedIdsToLoad) {
    const row = await db
      .selectFrom("feed")
      .select(["id", "legacyOid", "name", "url", "count", "colour", "deletedAt"])
      .where("id", "=", feedId)
      .where("libraryId", "=", libraryId)
      .executeTakeFirst();
    if (row) feeds.push(row as FeedRow);
  }

  return { feeds, tags, folders, papers, paperTagIds, paperFolderIds };
}

/**
 * Applies a projection batch to Realm: upsert tag/folder categorizers, then papers (Entity).
 * Idempotent: same batch applied twice yields the same Realm state.
 * Loads all SQLite data first, then applies in a single write.
 */
export async function applyProjectionBatchToRealm(
  realm: Realm,
  batch: ProjectionBatch
): Promise<void> {
  const { libraryId } = batch;
  const { feeds, tags, folders, papers, paperTagIds, paperFolderIds } =
    await loadBatchDataFromSqlite(libraryId, batch);

  const tagOidById = new Map<string, string>();
  const folderOidById = new Map<string, string>();
  const feedOidById = new Map<string, string>();
  for (const t of tags) tagOidById.set(t.id, t.legacyOid ?? t.id);
  for (const f of folders) folderOidById.set(f.id, f.legacyOid ?? f.id);
  for (const f of feeds) if (f.legacyOid) feedOidById.set(f.id, f.legacyOid);

  realm.write(() => {
    for (const row of feeds) {
      if (row.deletedAt != null) {
        const oid = row.legacyOid ?? row.id;
        const existing = realm.objectForPrimaryKey(
          Feed.schema.name,
          new Realm.BSON.ObjectId(oid)
        );
        if (existing) realm.delete(existing);
        continue;
      }
      const oid = row.legacyOid ?? row.id;
      const payload = {
        _id: new Realm.BSON.ObjectId(oid),
        _partition: "",
        name: row.name ?? "",
        url: row.url ?? "",
        count: row.count ?? 0,
        color: row.colour ?? "blue",
      };
      realm.create(Feed.schema.name, payload, Realm.UpdateMode.Modified);
    }

    for (const row of tags) {
      const oid = row.legacyOid ?? row.id;
      const payload = {
        _id: new Realm.BSON.ObjectId(oid),
        _partition: "",
        name: row.name ?? "",
        color: row.colour ?? "blue",
        count: 0,
        children: [],
      };
      realm.create(CategorizerType.PaperTag, payload, Realm.UpdateMode.Modified);
    }

    for (const row of folders) {
      const oid = row.legacyOid ?? row.id;
      const payload = {
        _id: new Realm.BSON.ObjectId(oid),
        _partition: "",
        name: row.name ?? "",
        color: row.colour ?? "blue",
        count: 0,
        children: [],
      };
      realm.create(CategorizerType.PaperFolder, payload, Realm.UpdateMode.Modified);
    }

    for (const paperRow of papers) {
      const paperOid = paperRow.legacyOid ?? paperRow.id;
      if (paperRow.deletedAt != null) {
        const existingEntity = realm.objectForPrimaryKey(
          Entity.schema.name,
          new Realm.BSON.ObjectId(paperOid)
        );
        if (existingEntity) realm.delete(existingEntity);
        const existingFeedEntity = realm.objectForPrimaryKey(
          FeedEntity.schema.name,
          new Realm.BSON.ObjectId(paperOid)
        );
        if (existingFeedEntity) realm.delete(existingFeedEntity);
        continue;
      }

      const paperOidForPayload = paperRow.legacyOid ?? paperRow.id;
      const tagIds = paperTagIds.get(paperRow.id) ?? new Set();
      const folderIds = paperFolderIds.get(paperRow.id) ?? new Set();

      const tagRealmObjects: Realm.Object[] = [];
      for (const tid of tagIds) {
        const toid = tagOidById.get(tid) ?? tid;
        const tagObj = realm.objectForPrimaryKey(
          CategorizerType.PaperTag,
          new Realm.BSON.ObjectId(toid)
        );
        if (tagObj) tagRealmObjects.push(tagObj as Realm.Object);
      }

      const folderRealmObjects: Realm.Object[] = [];
      for (const fid of folderIds) {
        const foid = folderOidById.get(fid) ?? fid;
        const folderObj = realm.objectForPrimaryKey(
          CategorizerType.PaperFolder,
          new Realm.BSON.ObjectId(foid)
        );
        if (folderObj) folderRealmObjects.push(folderObj as Realm.Object);
      }

      const addTime = paperRow.createdAt
        ? new Date(paperRow.createdAt)
        : new Date();

      const entityPayload = {
        _id: new Realm.BSON.ObjectId(paperOidForPayload),
        _partition: "",
        addTime,
        library: "main",
        type: paperRow.type ?? "article",
        title: paperRow.title ?? "",
        authors: "",
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
        flag: paperRow.flag === 1,
        supplementaries: {},
        tags: tagRealmObjects,
        folders: folderRealmObjects,
      };

      realm.create(Entity.schema.name, entityPayload, Realm.UpdateMode.Modified);

      if (paperRow.feedId) {
        const feedLegacyOid = feedOidById.get(paperRow.feedId);
        const feedObj = feedLegacyOid
          ? realm.objectForPrimaryKey(
              Feed.schema.name,
              new Realm.BSON.ObjectId(feedLegacyOid)
            )
          : null;
        if (feedObj) {
          const addTime = paperRow.createdAt
            ? new Date(paperRow.createdAt)
            : new Date();
          const feedEntityPayload = {
            _id: new Realm.BSON.ObjectId(paperOidForPayload),
            _partition: "",
            addTime,
            feed: feedObj,
            feedTime: addTime,
            title: paperRow.title ?? "",
            authors: "",
            abstract: paperRow.abstract ?? "",
            publication: paperRow.journal ?? paperRow.booktitle ?? "",
            pubTime: paperRow.year != null ? String(paperRow.year) : "",
            pubType: 0,
            doi: paperRow.doi ?? "",
            arxiv: paperRow.arxiv ?? "",
            mainURL: "",
            pages: paperRow.pages ?? "",
            volume: paperRow.volume ?? "",
            number: paperRow.number ?? "",
            publisher: paperRow.publisher ?? "",
            read: paperRow.read === 1,
          };
          realm.create(
            FeedEntity.schema.name,
            feedEntityPayload,
            Realm.UpdateMode.Modified
          );
        }
      }
    }
  });
}
