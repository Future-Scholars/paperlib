import { z } from "zod";
import type { Transaction } from "@/service/services/database/sqlite/db";
import {
  zAuthorFieldVersionModel,
  zFeedFieldVersionModel,
  zFolderFieldVersionModel,
  zPaperFieldVersionModel,
  zSupplementFieldVersionModel,
  zTagFieldVersionModel,
  zAuthorModel,
  zFeedModel,
  zFolderModel,
  zPaperModel,
  zSupplementModel,
  zTagModel,
} from "@/service/services/database/sqlite/models";

export type PaperFieldVersionRow = z.infer<typeof zPaperFieldVersionModel>;
export type AuthorFieldVersionRow = z.infer<typeof zAuthorFieldVersionModel>;
export type TagFieldVersionRow = z.infer<typeof zTagFieldVersionModel>;
export type FolderFieldVersionRow = z.infer<typeof zFolderFieldVersionModel>;
export type SupplementFieldVersionRow = z.infer<
  typeof zSupplementFieldVersionModel
>;
export type FeedFieldVersionRow = z.infer<typeof zFeedFieldVersionModel>;

type SqlitePaper = z.infer<typeof zPaperModel>;
type SqliteAuthor = z.infer<typeof zAuthorModel>;
type SqliteTag = z.infer<typeof zTagModel>;
type SqliteFolder = z.infer<typeof zFolderModel>;
type SqliteSupplement = z.infer<typeof zSupplementModel>;
type SqliteFeed = z.infer<typeof zFeedModel>;

type TimestampedRow = {
  timestamp: number;
  createdAt: number;
  deletedAt: number | null;
};

function pickLatestByTimestamp<T extends TimestampedRow>(
  rows: readonly T[],
): T | null {
  const candidates = rows.filter((row) => row.deletedAt === null);
  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce<T>((latest, current) => {
    if (current.timestamp > latest.timestamp) {
      return current;
    }
    if (current.timestamp < latest.timestamp) {
      return latest;
    }
    if (current.createdAt > latest.createdAt) {
      return current;
    }
    if (current.createdAt < latest.createdAt) {
      return latest;
    }
    return latest;
  }, candidates[0]);
}

function safeParseJson(value: string | null): unknown {
  if (value === null) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

type PaperField = PaperFieldVersionRow["field"];

function mapPaperFieldValue(
  field: PaperField,
  rawValue: string | null,
): Partial<SqlitePaper> {
  const parsed = safeParseJson(rawValue);

  switch (field) {
    case "type":
      return typeof parsed === "string"
        ? { type: parsed as SqlitePaper["type"] }
        : {};
    case "title":
      return typeof parsed === "string" ? { title: parsed } : {};
    case "abstract":
    case "journal":
    case "booktitle":
    case "volume":
    case "number":
    case "pages":
    case "publisher":
    case "series":
    case "edition":
    case "editor":
    case "howPublished":
    case "organization":
    case "school":
    case "institution":
    case "address":
    case "doi":
    case "arxiv":
    case "isbn":
    case "issn":
    case "notes":
    case "feedItemId": {
      if (typeof parsed === "string" || parsed === null) {
        return { [field]: parsed } as Partial<SqlitePaper>;
      }
      return {};
    }
    case "year":
    case "month":
    case "rating": {
      if (typeof parsed === "number" || parsed === null) {
        return { [field]: parsed } as Partial<SqlitePaper>;
      }
      return {};
    }
    case "flag":
    case "read": {
      if (typeof parsed === "boolean" || parsed === null) {
        return { [field]: parsed } as Partial<SqlitePaper>;
      }
      return {};
    }
    case "feedId": {
      if (typeof parsed === "string" || parsed === null) {
        return { feedId: parsed } as Partial<SqlitePaper>;
      }
      return {};
    }
    default:
      return {};
  }
}

type AuthorField = AuthorFieldVersionRow["field"];

function mapAuthorFieldValue(
  field: AuthorField,
  rawValue: string | null,
): Partial<SqliteAuthor> {
  const parsed = safeParseJson(rawValue);

  switch (field) {
    case "name":
    case "affiliation":
    case "email":
    case "orcid":
    case "firstName":
    case "lastName": {
      if (typeof parsed === "string" || parsed === null) {
        return { [field]: parsed } as Partial<SqliteAuthor>;
      }
      return {};
    }
    default:
      return {};
  }
}

type TagField = TagFieldVersionRow["field"];

function mapTagFieldValue(
  field: TagField,
  rawValue: string | null,
): Partial<SqliteTag> {
  const parsed = safeParseJson(rawValue);

  switch (field) {
    case "name":
    case "description":
    case "colour": {
      if (typeof parsed === "string" || parsed === null) {
        return { [field]: parsed } as Partial<SqliteTag>;
      }
      return {};
    }
    default:
      return {};
  }
}

type FolderField = FolderFieldVersionRow["field"];

function mapFolderFieldValue(
  field: FolderField,
  rawValue: string | null,
): Partial<SqliteFolder> {
  const parsed = safeParseJson(rawValue);

  switch (field) {
    case "name":
    case "description":
    case "colour": {
      if (typeof parsed === "string" || parsed === null) {
        return { [field]: parsed } as Partial<SqliteFolder>;
      }
      return {};
    }
    case "parentId": {
      if (typeof parsed === "string" || parsed === null) {
        return { parentId: parsed } as Partial<SqliteFolder>;
      }
      return {};
    }
    default:
      return {};
  }
}

type SupplementField = SupplementFieldVersionRow["field"];

function mapSupplementFieldValue(
  field: SupplementField,
  rawValue: string | null,
): Partial<SqliteSupplement> {
  const parsed = safeParseJson(rawValue);

  switch (field) {
    case "name":
    case "value":
    case "description": {
      if (typeof parsed === "string" || parsed === null) {
        return { [field]: parsed } as Partial<SqliteSupplement>;
      }
      return {};
    }
    case "type": {
      if (typeof parsed === "string") {
        return { type: parsed as SqliteSupplement["type"] };
      }
      return {};
    }
    default:
      return {};
  }
}

type FeedField = FeedFieldVersionRow["field"];

function mapFeedFieldValue(
  field: FeedField,
  rawValue: string | null,
): Partial<SqliteFeed> {
  const parsed = safeParseJson(rawValue);

  switch (field) {
    case "name":
    case "description":
    case "url":
    case "colour": {
      if (typeof parsed === "string" || parsed === null) {
        return { [field]: parsed } as Partial<SqliteFeed>;
      }
      return {};
    }
    case "type": {
      if (typeof parsed === "string") {
        return { type: parsed as SqliteFeed["type"] };
      }
      return {};
    }
    case "count": {
      if (typeof parsed === "number" || parsed === null) {
        return { count: parsed ?? 0 } as Partial<SqliteFeed>;
      }
      return {};
    }
    default:
      return {};
  }
}

function metaFromVersions<T extends { createdAt: number; createdByDeviceId: string; deletedAt: number | null; deletedByDeviceId: string | null }>(
  latest: T | null,
  versions: readonly T[],
): { createdAt: number; createdByDeviceId: string; deletedAt: number | null; deletedByDeviceId: string | null } {
  const row = latest ?? versions[0] ?? null;
  return {
    createdAt: row?.createdAt ?? 0,
    createdByDeviceId: row?.createdByDeviceId ?? "",
    deletedAt: row?.deletedAt ?? null,
    deletedByDeviceId: row?.deletedByDeviceId ?? null,
  };
}

export async function applyPaperFieldVersions(
  tx: Transaction,
  affected: readonly { libraryId: string; paperId: string; field: PaperField }[],
): Promise<void> {
  const uniqueKeys = new Map<
    string,
    { libraryId: string; paperId: string; field: PaperField }
  >();
  for (const item of affected) {
    const key = `${item.libraryId}:${item.paperId}:${item.field}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, item);
    }
  }

  for (const { libraryId, paperId, field } of uniqueKeys.values()) {
    const versions = await tx
      .selectFrom("paperFieldVersion")
      .selectAll()
      .where("libraryId", "=", libraryId)
      .where("paperId", "=", paperId)
      .where("field", "=", field)
      .execute();

    const latest = pickLatestByTimestamp(versions);
    const updates: Partial<SqlitePaper> = latest
      ? mapPaperFieldValue(field, latest.value)
      : ({ [field]: null } as Partial<SqlitePaper>);

    if (Object.keys(updates).length === 0) {
      continue;
    }

    const existing = await tx
      .selectFrom("paper")
      .select("id")
      .where("id", "=", paperId)
      .where("libraryId", "=", libraryId)
      .executeTakeFirst();

    if (!existing) {
      const meta = metaFromVersions(latest, versions);
      const stub: SqlitePaper = {
        id: paperId,
        libraryId,
        createdAt: meta.createdAt,
        createdByDeviceId: meta.createdByDeviceId,
        deletedAt: meta.deletedAt,
        deletedByDeviceId: meta.deletedByDeviceId,
        updatedAt: null,
        updatedByDeviceId: null,
        legacyOid: "",
        type: "misc",
        title: "",
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
      };
      await tx
        .insertInto("paper")
        .values({ ...stub, ...updates })
        .execute();
    } else {
      await tx
        .updateTable("paper")
        .set(updates)
        .where("id", "=", paperId)
        .where("libraryId", "=", libraryId)
        .execute();
    }
  }
}

export async function applyAuthorFieldVersions(
  tx: Transaction,
  affected: readonly { libraryId: string; authorId: string; field: AuthorField }[],
): Promise<void> {
  const uniqueKeys = new Map<
    string,
    { libraryId: string; authorId: string; field: AuthorField }
  >();
  for (const item of affected) {
    const key = `${item.libraryId}:${item.authorId}:${item.field}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, item);
    }
  }

  for (const { libraryId, authorId, field } of uniqueKeys.values()) {
    const versions = await tx
      .selectFrom("authorFieldVersion")
      .selectAll()
      .where("libraryId", "=", libraryId)
      .where("authorId", "=", authorId)
      .where("field", "=", field)
      .execute();

    const latest = pickLatestByTimestamp(versions);
    const updates: Partial<SqliteAuthor> = latest
      ? mapAuthorFieldValue(field, latest.value)
      : ({ [field]: null } as Partial<SqliteAuthor>);

    if (Object.keys(updates).length === 0) {
      continue;
    }

    const existing = await tx
      .selectFrom("author")
      .select("id")
      .where("id", "=", authorId)
      .where("libraryId", "=", libraryId)
      .executeTakeFirst();

    if (!existing) {
      const meta = metaFromVersions(latest, versions);
      const stub: SqliteAuthor = {
        id: authorId,
        libraryId,
        createdAt: meta.createdAt,
        createdByDeviceId: meta.createdByDeviceId,
        deletedAt: meta.deletedAt,
        deletedByDeviceId: meta.deletedByDeviceId,
        updatedAt: null,
        updatedByDeviceId: null,
        legacyOid: "",
        name: "",
        affiliation: null,
        email: null,
        orcid: null,
        firstName: null,
        lastName: null,
      };
      await tx
        .insertInto("author")
        .values({ ...stub, ...updates })
        .execute();
    } else {
      await tx
        .updateTable("author")
        .set(updates)
        .where("id", "=", authorId)
        .where("libraryId", "=", libraryId)
        .execute();
    }
  }
}

export async function applyTagFieldVersions(
  tx: Transaction,
  affected: readonly { libraryId: string; tagId: string; field: TagField }[],
): Promise<void> {
  const uniqueKeys = new Map<
    string,
    { libraryId: string; tagId: string; field: TagField }
  >();
  for (const item of affected) {
    const key = `${item.libraryId}:${item.tagId}:${item.field}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, item);
    }
  }

  for (const { libraryId, tagId, field } of uniqueKeys.values()) {
    const versions = await tx
      .selectFrom("tagFieldVersion")
      .selectAll()
      .where("libraryId", "=", libraryId)
      .where("tagId", "=", tagId)
      .where("field", "=", field)
      .execute();

    const latest = pickLatestByTimestamp(versions);
    const updates: Partial<SqliteTag> = latest
      ? mapTagFieldValue(field, latest.value)
      : ({ [field]: null } as Partial<SqliteTag>);

    if (Object.keys(updates).length === 0) {
      continue;
    }

    const existing = await tx
      .selectFrom("tag")
      .select("id")
      .where("id", "=", tagId)
      .where("libraryId", "=", libraryId)
      .executeTakeFirst();

    if (!existing) {
      const meta = metaFromVersions(latest, versions);
      const stub: SqliteTag = {
        id: tagId,
        libraryId,
        createdAt: meta.createdAt,
        createdByDeviceId: meta.createdByDeviceId,
        deletedAt: meta.deletedAt,
        deletedByDeviceId: meta.deletedByDeviceId,
        updatedAt: null,
        updatedByDeviceId: null,
        legacyOid: "",
        name: "",
        description: null,
        colour: null,
      };
      await tx
        .insertInto("tag")
        .values({ ...stub, ...updates })
        .execute();
    } else {
      await tx
        .updateTable("tag")
        .set(updates)
        .where("id", "=", tagId)
        .where("libraryId", "=", libraryId)
        .execute();
    }
  }
}

export async function applyFolderFieldVersions(
  tx: Transaction,
  affected: readonly {
    libraryId: string;
    folderId: string;
    field: FolderField;
  }[],
): Promise<void> {
  const uniqueKeys = new Map<
    string,
    { libraryId: string; folderId: string; field: FolderField }
  >();
  for (const item of affected) {
    const key = `${item.libraryId}:${item.folderId}:${item.field}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, item);
    }
  }

  for (const { libraryId, folderId, field } of uniqueKeys.values()) {
    const versions = await tx
      .selectFrom("folderFieldVersion")
      .selectAll()
      .where("libraryId", "=", libraryId)
      .where("folderId", "=", folderId)
      .where("field", "=", field)
      .execute();

    const latest = pickLatestByTimestamp(versions);
    const updates: Partial<SqliteFolder> = latest
      ? mapFolderFieldValue(field, latest.value)
      : ({ [field]: null } as Partial<SqliteFolder>);

    if (Object.keys(updates).length === 0) {
      continue;
    }

    const existing = await tx
      .selectFrom("folder")
      .select("id")
      .where("id", "=", folderId)
      .where("libraryId", "=", libraryId)
      .executeTakeFirst();

    if (!existing) {
      const meta = metaFromVersions(latest, versions);
      const stub: SqliteFolder = {
        id: folderId,
        libraryId,
        createdAt: meta.createdAt,
        createdByDeviceId: meta.createdByDeviceId,
        deletedAt: meta.deletedAt,
        deletedByDeviceId: meta.deletedByDeviceId,
        updatedAt: null,
        updatedByDeviceId: null,
        legacyOid: "",
        name: "",
        description: null,
        colour: null,
        parentId: null,
      };
      await tx
        .insertInto("folder")
        .values({ ...stub, ...updates })
        .execute();
    } else {
      await tx
        .updateTable("folder")
        .set(updates)
        .where("id", "=", folderId)
        .where("libraryId", "=", libraryId)
        .execute();
    }
  }
}

export async function applySupplementFieldVersions(
  tx: Transaction,
  affected: readonly {
    libraryId: string;
    supplementId: string;
    field: SupplementField;
  }[],
): Promise<void> {
  const uniqueKeys = new Map<
    string,
    { libraryId: string; supplementId: string; field: SupplementField }
  >();
  for (const item of affected) {
    const key = `${item.libraryId}:${item.supplementId}:${item.field}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, item);
    }
  }

  for (const { libraryId, supplementId, field } of uniqueKeys.values()) {
    const versions = await tx
      .selectFrom("supplementFieldVersion")
      .selectAll()
      .where("libraryId", "=", libraryId)
      .where("supplementId", "=", supplementId)
      .where("field", "=", field)
      .execute();

    const latest = pickLatestByTimestamp(versions);
    const updates: Partial<SqliteSupplement> = latest
      ? mapSupplementFieldValue(field, latest.value)
      : ({ [field]: null } as Partial<SqliteSupplement>);

    if (Object.keys(updates).length === 0) {
      continue;
    }

    const existing = await tx
      .selectFrom("supplement")
      .select("id")
      .where("id", "=", supplementId)
      .where("libraryId", "=", libraryId)
      .executeTakeFirst();

    if (!existing) {
      const meta = metaFromVersions(latest, versions);
      const stub: SqliteSupplement = {
        id: supplementId,
        libraryId,
        createdAt: meta.createdAt,
        createdByDeviceId: meta.createdByDeviceId,
        deletedAt: meta.deletedAt,
        deletedByDeviceId: meta.deletedByDeviceId,
        updatedAt: null,
        updatedByDeviceId: null,
        legacyOid: "",
        name: "",
        value: "",
        type: "unknown",
        description: null,
      };
      await tx
        .insertInto("supplement")
        .values({ ...stub, ...updates })
        .execute();
    } else {
      await tx
        .updateTable("supplement")
        .set(updates)
        .where("id", "=", supplementId)
        .where("libraryId", "=", libraryId)
        .execute();
    }
  }
}

export async function applyFeedFieldVersions(
  tx: Transaction,
  affected: readonly { libraryId: string; feedId: string; field: FeedField }[],
): Promise<void> {
  const uniqueKeys = new Map<
    string,
    { libraryId: string; feedId: string; field: FeedField }
  >();
  for (const item of affected) {
    const key = `${item.libraryId}:${item.feedId}:${item.field}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, item);
    }
  }

  for (const { libraryId, feedId, field } of uniqueKeys.values()) {
    const versions = await tx
      .selectFrom("feedFieldVersion")
      .selectAll()
      .where("libraryId", "=", libraryId)
      .where("feedId", "=", feedId)
      .where("field", "=", field)
      .execute();

    const latest = pickLatestByTimestamp(versions);
    const updates: Partial<SqliteFeed> = latest
      ? mapFeedFieldValue(field, latest.value)
      : ({ [field]: null } as Partial<SqliteFeed>);

    if (Object.keys(updates).length === 0) {
      continue;
    }

    const existing = await tx
      .selectFrom("feed")
      .select("id")
      .where("id", "=", feedId)
      .where("libraryId", "=", libraryId)
      .executeTakeFirst();

    if (!existing) {
      const meta = metaFromVersions(latest, versions);
      const stub: SqliteFeed = {
        id: feedId,
        libraryId,
        createdAt: meta.createdAt,
        createdByDeviceId: meta.createdByDeviceId,
        deletedAt: meta.deletedAt,
        deletedByDeviceId: meta.deletedByDeviceId,
        updatedAt: null,
        updatedByDeviceId: null,
        legacyOid: "",
        name: "",
        description: null,
        type: "rss",
        url: "",
        count: 0,
        colour: null,
      };
      await tx
        .insertInto("feed")
        .values({ ...stub, ...updates })
        .execute();
    } else {
      await tx
        .updateTable("feed")
        .set(updates)
        .where("id", "=", feedId)
        .where("libraryId", "=", libraryId)
        .execute();
    }
  }
}

