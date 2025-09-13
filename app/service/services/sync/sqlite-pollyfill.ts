import { Entity } from "@/models/entity";
import {
  zPaper,
  Paper as SqlitePaper,
  Feed as SqliteFeed,
  zFeed, zPaperFieldVersion,
  zFeedFieldVersion,
  Library as SqliteLibrary,
  zLibrary,
  zTag,
  zTagFieldVersion,
  zFolder,
  zFolderFieldVersion
} from "@/service/services/database/sqlite/models";
import { syncStateStore } from "@/service/services/sync/states";
import z from "zod";
import { db } from "../database/sqlite/db";
import { v4 as uuidv4 } from 'uuid';
import { Feed } from "@/models/feed";
import { CategorizerType, ICategorizerObject } from "@/models/categorizer";

/**
 * Creates a structured value object for field versions that includes operation type,
 * previous value, and new value for complete audit trail.
 */
function createFieldVersionValue(operation: 'create' | 'update', previousValue: any, newValue: any): string {
  return JSON.stringify({
    operation,
    previousValue: previousValue ?? null,
    newValue: newValue ?? null,
  });
}

/**
 * Converts undefined values to null for SQLite compatibility.
 * SQLite cannot handle undefined values but can handle null.
 */
function ensureUndefinedToNull(value: any): any {
  return value === undefined ? null : value;
}

/**
 * Converts boolean values to integers (0 or 1) for SQLite compatibility.
 * SQLite cannot bind boolean values directly, so we convert them to integers.
 * @param value - The boolean value to convert
 * @returns 1 for true, 0 for false, null for null/undefined
 */
function booleanToInt(value: boolean | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value ? 1 : 0;
}

/**
 * Converts integer values back to booleans for application use.
 * @param value - The integer value to convert (0, 1, or null)
 * @returns true for 1, false for 0, null for null
 */
function intToBoolean(value: number | null | undefined): boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value === 1;
}

/**
 * Ensure the library ID in sqlite database. If the library is not in database, insert it to database.
 * Otherwise, return the library ID.
 * @param library The library name. If not provided, the default library "main" will be used.
 * @returns The library ID. Guaranteed in database.
 */
export async function ensureLibraryId(library?: string): Promise<string> {
  const deviceId = syncStateStore.get("deviceId");

  // Try get the existed sqlite library by legacy oid
  const existedSqliteLibrary: SqliteLibrary | undefined = await db.selectFrom("library")
    .where("name", "=", library ?? "main")
    .selectAll()
    .executeTakeFirst();

  if (!existedSqliteLibrary) {
    const newSqliteLibrary: z.infer<typeof zLibrary> = {
      id: uuidv4(),
      name: library ?? "main",
      description: null,
      ownedBy: syncStateStore.get("userId"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByDeviceId: deviceId,
      updatedByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    }
    await db.insertInto("library").values(newSqliteLibrary).execute();
    return newSqliteLibrary.id;
  }
  return existedSqliteLibrary.id;
}


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
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
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
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
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
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
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
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (updated) {
      existedSqliteFeed.updatedAt = new Date().toISOString();
      existedSqliteFeed.updatedByDeviceId = deviceId;
      await db.insertInto("feedFieldVersion").values(feedFieldVersions).execute();
      await db.updateTable("feed").set(existedSqliteFeed).where("id", "=", existedSqliteFeed.id).execute();
    }

    return existedSqliteFeed;
  }
  // Insert the feed to database
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdByDeviceId: deviceId,
    updatedByDeviceId: deviceId,
    deletedAt: null,
    deletedByDeviceId: null,
  }
  const feedFieldVersions: z.infer<typeof zFeedFieldVersion>[] = [
    {
      id: uuidv4(),
      feedId: newSqliteFeed.id,
      field: "name",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, feed.name)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: new Date().toISOString(),
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
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: new Date().toISOString(),
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
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: new Date().toISOString(),
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
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: new Date().toISOString(),
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
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: new Date().toISOString(),
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
      deletedAt: new Date().toISOString(),
      deletedByDeviceId: deviceId,
    }).where("id", "=", existedSqliteFeed.id).execute();
    await db.deleteFrom("feedFieldVersion").where("feedId", "=", existedSqliteFeed.id).execute();
  }
}


/**
 * Check if the entity is in database. If not, insert it to database. 
 * Otherwise, update the database entity according to the entity.
 * And finally, return the sqlite object. 
 * Authors, feeds, and categorizers like tags and folders will also be handled in this method. 
 * @param entity The entity to be converted to sqlite object.
 * @returns The sqlite object. Guaranteed in database.
 */
export async function toSqliteEntity(entity: Entity, logService?: any): Promise<z.infer<typeof zPaper>> {

  const deviceId = syncStateStore.get("deviceId");

  // If the entity is from feeds, handle the feeds first
  if (entity.feed) {
    const sqliteFeed = await toSqliteFeed(entity.feed);
    await db.insertInto("feed").values(sqliteFeed).execute();
  }
  // Get library id by entity library name
  const libraryId = await ensureLibraryId(entity.library);

  // Try get the existed sqlite entity by legacy oid
  const existedSqliteEntity: SqlitePaper | undefined = await db.selectFrom("paper")
    .where("legacyOid", "=", entity._id.toString())
    .selectAll()
    .executeTakeFirst();

  // If the entity is already existed, update the entity if any field is different
  if (existedSqliteEntity) {

    let updated = false;
    // Update the sqlite entity if any field is different
    const paperFieldVersions: z.infer<typeof zPaperFieldVersion>[] = [];
    // Bibtex
    if (existedSqliteEntity.title !== entity.title) {
      const previousValue = existedSqliteEntity.title;
      existedSqliteEntity.title = entity.title;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "title",
        value: createFieldVersionValue('update', previousValue, entity.title),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.journal !== entity.journal) {
      const previousValue = existedSqliteEntity.journal;
      existedSqliteEntity.journal = ensureUndefinedToNull(entity.journal);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "journal",
        value: createFieldVersionValue('update', previousValue, entity.journal),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.booktitle !== entity.booktitle) {
      const previousValue = existedSqliteEntity.booktitle;
      existedSqliteEntity.booktitle = ensureUndefinedToNull(entity.booktitle);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "booktitle",
        value: createFieldVersionValue('update', previousValue, entity.booktitle),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.year !== parseInt(entity.year)) {
      const previousValue = existedSqliteEntity.year;
      existedSqliteEntity.year = parseInt(entity.year);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "year",
        value: createFieldVersionValue('update', previousValue, parseInt(entity.year)),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (entity.month && existedSqliteEntity.month !== parseInt(entity.month)) {
      const previousValue = existedSqliteEntity.month;
      existedSqliteEntity.month = parseInt(entity.month);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "month",
        value: createFieldVersionValue('update', previousValue, parseInt(entity.month)),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.volume !== entity.volume) {
      const previousValue = existedSqliteEntity.volume;
      existedSqliteEntity.volume = ensureUndefinedToNull(entity.volume);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "volume",
        value: createFieldVersionValue('update', previousValue, entity.volume),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.number !== entity.number) {
      const previousValue = existedSqliteEntity.number;
      existedSqliteEntity.number = ensureUndefinedToNull(entity.number);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "number",
        value: createFieldVersionValue('update', previousValue, entity.number),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.pages !== entity.pages) {
      const previousValue = existedSqliteEntity.pages;
      existedSqliteEntity.pages = ensureUndefinedToNull(entity.pages);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "pages",
        value: createFieldVersionValue('update', previousValue, entity.pages),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.publisher !== entity.publisher) {
      const previousValue = existedSqliteEntity.publisher;
      existedSqliteEntity.publisher = ensureUndefinedToNull(entity.publisher);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "publisher",
        value: createFieldVersionValue('update', previousValue, entity.publisher),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.series !== entity.series) {
      const previousValue = existedSqliteEntity.series;
      existedSqliteEntity.series = ensureUndefinedToNull(entity.series);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "series",
        value: createFieldVersionValue('update', previousValue, entity.series),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.edition !== entity.edition) {
      const previousValue = existedSqliteEntity.edition;
      existedSqliteEntity.edition = ensureUndefinedToNull(entity.edition);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "edition",
        value: createFieldVersionValue('update', previousValue, entity.edition),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.editor !== entity.editor) {
      const previousValue = existedSqliteEntity.editor;
      existedSqliteEntity.editor = ensureUndefinedToNull(entity.editor);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "editor",
        value: createFieldVersionValue('update', previousValue, entity.editor),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.howPublished !== entity.howpublished) {
      const previousValue = existedSqliteEntity.howPublished;
      existedSqliteEntity.howPublished = ensureUndefinedToNull(entity.howpublished);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "howPublished",
        value: createFieldVersionValue('update', previousValue, entity.howpublished),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.organization !== entity.organization) {
      const previousValue = existedSqliteEntity.organization;
      existedSqliteEntity.organization = ensureUndefinedToNull(entity.organization);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "organization",
        value: createFieldVersionValue('update', previousValue, entity.organization),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.school !== entity.school) {
      const previousValue = existedSqliteEntity.school;
      existedSqliteEntity.school = ensureUndefinedToNull(entity.school);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "school",
        value: createFieldVersionValue('update', previousValue, entity.school),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.institution !== entity.institution) {
      const previousValue = existedSqliteEntity.institution;
      existedSqliteEntity.institution = ensureUndefinedToNull(entity.institution);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "institution",
        value: createFieldVersionValue('update', previousValue, entity.institution),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.address !== entity.address) {
      const previousValue = existedSqliteEntity.address;
      existedSqliteEntity.address = ensureUndefinedToNull(entity.address);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "address",
        value: createFieldVersionValue('update', previousValue, entity.address),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.abstract !== entity.abstract) {
      const previousValue = existedSqliteEntity.abstract;
      existedSqliteEntity.abstract = ensureUndefinedToNull(entity.abstract);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "abstract",
        value: createFieldVersionValue('update', previousValue, entity.abstract),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.doi !== entity.doi) {
      const previousValue = existedSqliteEntity.doi;
      existedSqliteEntity.doi = ensureUndefinedToNull(entity.doi);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "doi",
        value: createFieldVersionValue('update', previousValue, entity.doi),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.arxiv !== entity.arxiv) {
      const previousValue = existedSqliteEntity.arxiv;
      existedSqliteEntity.arxiv = ensureUndefinedToNull(entity.arxiv);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "arxiv",
        value: createFieldVersionValue('update', previousValue, entity.arxiv),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.isbn !== entity.isbn) {
      const previousValue = existedSqliteEntity.isbn;
      existedSqliteEntity.isbn = ensureUndefinedToNull(entity.isbn);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "isbn",
        value: createFieldVersionValue('update', previousValue, entity.isbn),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.issn !== entity.issn) {
      const previousValue = existedSqliteEntity.issn;
      existedSqliteEntity.issn = ensureUndefinedToNull(entity.issn);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "issn",
        value: createFieldVersionValue('update', previousValue, entity.issn),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    // For papers
    if (existedSqliteEntity.rating !== entity.rating) {
      const previousValue = existedSqliteEntity.rating;
      existedSqliteEntity.rating = ensureUndefinedToNull(entity.rating);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "rating",
        value: createFieldVersionValue('update', previousValue, entity.rating),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.notes !== entity.note) {
      const previousValue = existedSqliteEntity.notes;
      existedSqliteEntity.notes = ensureUndefinedToNull(entity.note);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "notes",
        value: createFieldVersionValue('update', previousValue, entity.note),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.flag !== booleanToInt(entity.flag)) {
      const previousValue = existedSqliteEntity.flag;
      existedSqliteEntity.flag = booleanToInt(entity.flag);
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "flag",
        value: createFieldVersionValue('update', previousValue, entity.flag),
        timestamp: Date.now(),
        deviceId: deviceId,
        hash: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }


    if (updated) {
      existedSqliteEntity.updatedAt = new Date().toISOString();
      existedSqliteEntity.updatedByDeviceId = deviceId;
      await db.insertInto("paperFieldVersion").values(paperFieldVersions).execute();
      await db.updateTable("paper").set(existedSqliteEntity).where("id", "=", existedSqliteEntity.id).execute();

    }

    return existedSqliteEntity;
  }

  // Insert the sqlite entity if not existed
  let sqliteEntity: SqlitePaper = {
    id: uuidv4(),
    legacyOid: ensureUndefinedToNull(entity._id?.toString()),
    libraryId: libraryId,
    type: entity.type,
    // Bibtex
    title: entity.title,
    journal: ensureUndefinedToNull(entity.journal),
    booktitle: ensureUndefinedToNull(entity.booktitle),
    year: ensureUndefinedToNull(parseInt(entity.year)),
    month: ensureUndefinedToNull(entity.month ? parseInt(entity.month) : null),
    volume: ensureUndefinedToNull(entity.volume),
    number: ensureUndefinedToNull(entity.number),
    pages: ensureUndefinedToNull(entity.pages),
    publisher: ensureUndefinedToNull(entity.publisher),
    series: ensureUndefinedToNull(entity.series),
    edition: ensureUndefinedToNull(entity.edition),
    editor: ensureUndefinedToNull(entity.editor),
    howPublished: ensureUndefinedToNull(entity.howpublished),
    organization: ensureUndefinedToNull(entity.organization),
    school: ensureUndefinedToNull(entity.school),
    institution: ensureUndefinedToNull(entity.institution),
    address: ensureUndefinedToNull(entity.address),
    abstract: ensureUndefinedToNull(entity.abstract),
    // Identifiers
    doi: ensureUndefinedToNull(entity.doi),
    arxiv: ensureUndefinedToNull(entity.arxiv),
    isbn: ensureUndefinedToNull(entity.isbn),
    issn: ensureUndefinedToNull(entity.issn),
    // For papers
    rating: ensureUndefinedToNull(entity.rating),
    notes: ensureUndefinedToNull(entity.note),
    flag: booleanToInt(entity.flag),
    read: booleanToInt(entity.read),
    feedId: null,
    feedItemId: null,
    // Categorizers and feeds will be handled later as there'll be separate sql operations

    // Sqlite management properties
    createdAt: entity.addTime.toISOString(),
    createdByDeviceId: deviceId,
    updatedAt: entity.addTime.toISOString(),
    updatedByDeviceId: deviceId,
    deletedAt: null,
    deletedByDeviceId: null,
  }

  const paperFieldVersions: z.infer<typeof zPaperFieldVersion>[] = [

    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "type",
      value: ensureUndefinedToNull(JSON.stringify(entity.type)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "title",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.title)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },

    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "journal",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.journal)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "booktitle",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.booktitle)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "year",
      value: ensureUndefinedToNull(JSON.stringify(parseInt(entity.year))),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "month",
      value: ensureUndefinedToNull(JSON.stringify(entity.month ? parseInt(entity.month) : null)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "volume",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.volume)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "number",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.number)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "pages",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.pages)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "publisher",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.publisher)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "series",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.series)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "edition",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.edition)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "editor",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.editor)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "howPublished",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.howpublished)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "organization",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.organization)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "school",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.school)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "institution",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.institution)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "address",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.address)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "abstract",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.abstract)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "doi",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.doi)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "arxiv",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.arxiv)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "isbn",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.isbn)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "issn",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.issn)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "rating",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.rating)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "notes",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.note)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "flag",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, entity.flag)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "feedId",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, null)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "feedItemId",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, null)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "read",
      value: ensureUndefinedToNull(createFieldVersionValue('create', null, null)),
      timestamp: Date.now(),
      deviceId: deviceId,
      createdAt: entity.addTime.toISOString(),
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
  ];

  if (logService) {
    logService.info("SQLite Entity", JSON.stringify(sqliteEntity), false, "SQLITE");
  } else {
    process.stdout.write(`[SQLITE] SQLite Entity: ${JSON.stringify(sqliteEntity)}\n`);
  }

  await db.insertInto("paper").values(sqliteEntity).execute();

  await db.insertInto("paperFieldVersion").values(paperFieldVersions).execute();

  // Add author if not existed, and add the paperAuthor connection
  entity.authors.split(",").forEach(async (author) => {
    let existedAuthorId = await db.selectFrom("author").where("name", "=", author).select("id").executeTakeFirst();
    const authorId = existedAuthorId?.id || uuidv4();
    if (!existedAuthorId) {
      await db.insertInto("author").values({
        id: authorId,
        name: author,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
      }).execute();
    }
    await db.insertInto("paperAuthor").values({
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      op: "add",
      timestamp: Date.now(),
      deviceId: deviceId,
      paperId: sqliteEntity.id,
      authorId: authorId,
      createdByDeviceId: deviceId,
    }).execute();
  });
  // Remove author if not in the entity
  const existedSqliteAuthors = await db.selectFrom("paperAuthor").where("paperId", "=", sqliteEntity.id).selectAll().execute();
  if (existedSqliteAuthors) {
    await db.insertInto("paperAuthor").values(existedSqliteAuthors.map((author) => ({
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      op: "remove",
      timestamp: Date.now(),
      deviceId: deviceId,
      paperId: sqliteEntity.id,
      authorId: author.authorId,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    })));
  }

  entity.tags.forEach(async (tag) => {
    let existedTagId = await db.selectFrom("tag").where("name", "=", tag.name).select("id").executeTakeFirst();
    const tagId = existedTagId?.id || uuidv4();
    if (!existedTagId) {
      await db.insertInto("tag").values({
        id: tagId,
        name: tag.name,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        updatedAt: new Date().toISOString(),
        updatedByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      }).execute();
    }
    await db.insertInto("paperTag").values({
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      op: "add",
      timestamp: Date.now(),
      deviceId: deviceId,
      paperId: sqliteEntity.id,
      tagId: tagId,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    }).execute();
  });

  return sqliteEntity;
}

export async function deleteSqliteEntity(legacyOid: string): Promise<void> {
  const deviceId = syncStateStore.get("deviceId");
  // Query and update deletedAt and deletedByDeviceId of the sqlite entity by legacy oid
  const existedSqliteEntity = await db.selectFrom("paper").where("legacyOid", "=", legacyOid).selectAll().executeTakeFirst();
  if (existedSqliteEntity) {
    await db.updateTable("paper").set({
      deletedAt: new Date().toISOString(),
      deletedByDeviceId: deviceId,
    }).where("id", "=", existedSqliteEntity.id).execute();
  }
  // Query and update deletedAt and deletedByDeviceId of the sqlite authors by paper id
  const existedSqliteAuthors = await db.selectFrom("paperAuthor").where("paperId", "=", legacyOid).selectAll().execute();
  if (existedSqliteAuthors) {
    await db.updateTable("paperAuthor").set({
      deletedAt: new Date().toISOString(),
      deletedByDeviceId: deviceId,
    }).where("id", "in", existedSqliteAuthors.map((author) => author.id)).execute();
  }
  // Query and update deletedAt and deletedByDeviceId of the sqlite tags by paper id
  const existedSqliteTags = await db.selectFrom("paperTag").where("paperId", "=", legacyOid).selectAll().execute();
  if (existedSqliteTags) {
    await db.updateTable("paperTag").set({
      deletedAt: new Date().toISOString(),
      deletedByDeviceId: deviceId,
    }).where("id", "in", existedSqliteTags.map((tag) => tag.id)).execute();
  }
  // Query and update deletedAt and deletedByDeviceId of the sqlite folders by paper id
  const existedSqliteFolders = await db.selectFrom("paperFolder").where("paperId", "=", legacyOid).selectAll().execute();
  if (existedSqliteFolders) {
    await db.updateTable("paperFolder").set({
      deletedAt: new Date().toISOString(),
      deletedByDeviceId: deviceId,
    }).where("id", "in", existedSqliteFolders.map((folder) => folder.id)).execute();
  }
}

/**
 * Sync the categorizer to the sqlite database
 * @param categorizer - The categorizer to sync
 * @param type - The type of the categorizer
 * @returns The sqlite categorizer, guaranteed in database.
 */
export async function toSqliteCategorizer(
  categorizer: ICategorizerObject,
  type: CategorizerType
): Promise<z.infer<typeof zTag> | z.infer<typeof zFolder>> {
  const deviceId = syncStateStore.get("deviceId");
  if (type === CategorizerType.PaperTag) {
    // Try get the existed sqlite tag by legacy oid
    const existedSqliteTag = await db.selectFrom("tag").where("name", "=", categorizer.name).selectAll().executeTakeFirst();
    const tagId = existedSqliteTag?.id || uuidv4();
    // If the tag is not existed, insert it to database
    if (!existedSqliteTag) {
      const sqliteTag: z.infer<typeof zTag> = {
        id: tagId,
        name: categorizer.name,
        description: null,
        colour: ensureUndefinedToNull(categorizer.color),
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        updatedAt: new Date().toISOString(),
        updatedByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      };
      await db.insertInto("tag").values(sqliteTag).execute();
      return sqliteTag;
    }

    // If the tag is already existed, update the sqlite tag if any difference
    let updated = false;
    const updatedTimestamp = Date.now();
    const updatedDateTime = new Date().toISOString();
    const sqliteTagVersions: z.infer<typeof zTagFieldVersion>[] = [];
    if (existedSqliteTag.name !== categorizer.name) {
      existedSqliteTag.name = categorizer.name;
      updated = true;
      existedSqliteTag.updatedAt = updatedDateTime;
      existedSqliteTag.updatedByDeviceId = deviceId;
      sqliteTagVersions.push({
        id: uuidv4(),
        tagId: tagId,
        field: "name",
        value: createFieldVersionValue('update', existedSqliteTag.name, categorizer.name),
        timestamp: updatedTimestamp,
        deviceId: deviceId,
        createdAt: updatedDateTime,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteTag.colour !== categorizer.color) {
      existedSqliteTag.colour = categorizer.color;
      updated = true;
      existedSqliteTag.updatedAt = updatedDateTime;
      existedSqliteTag.updatedByDeviceId = deviceId;
      sqliteTagVersions.push({
        id: uuidv4(),
        tagId: tagId,
        field: "colour",
        value: createFieldVersionValue('update', existedSqliteTag.colour, categorizer.color),
        timestamp: updatedTimestamp,
        deviceId: deviceId,
        createdAt: updatedDateTime,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (updated) {
      await db.updateTable("tag").set(existedSqliteTag).where("id", "=", tagId).execute();
      await db.insertInto("tagFieldVersion").values(sqliteTagVersions).execute();
    }

    return existedSqliteTag;
  }
  if (type === CategorizerType.PaperFolder) {
    // Try get the existed sqlite folder by legacy oid
    const existedSqliteFolder = await db.selectFrom("folder").where("name", "=", categorizer.name).selectAll().executeTakeFirst();
    const folderId = existedSqliteFolder?.id || uuidv4();
    // If the folder is not existed, insert it to database
    if (!existedSqliteFolder) {
      const sqliteFolder: z.infer<typeof zFolder> = {
        id: folderId,
        name: categorizer.name,
        colour: ensureUndefinedToNull(categorizer.color),
        description: null,
        parentId: null,
        createdAt: new Date().toISOString(),
        createdByDeviceId: deviceId,
        libraryId: await ensureLibraryId(),
        updatedAt: new Date().toISOString(),
        updatedByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      };
      await db.insertInto("folder").values(sqliteFolder).execute();
      // TODO: handle the children
      return sqliteFolder;
    }
    // If the folder is already existed, update the sqlite folder if any difference
    let updated = false;
    const updatedTimestamp = Date.now();
    const updatedDateTime = new Date().toISOString();
    const sqliteFolderVersions: z.infer<typeof zFolderFieldVersion>[] = [];
    if (existedSqliteFolder.name !== categorizer.name) {
      existedSqliteFolder.name = categorizer.name;
      updated = true;
      existedSqliteFolder.updatedAt = updatedDateTime;
      existedSqliteFolder.updatedByDeviceId = deviceId;
      sqliteFolderVersions.push({
        id: uuidv4(),
        folderId: folderId,
        field: "name",
        value: createFieldVersionValue('update', existedSqliteFolder.name, categorizer.name),
        timestamp: updatedTimestamp,
        deviceId: deviceId,
        createdAt: updatedDateTime,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteFolder.colour !== categorizer.color) {
      existedSqliteFolder.colour = categorizer.color;
      updated = true;
      existedSqliteFolder.updatedAt = updatedDateTime;
      existedSqliteFolder.updatedByDeviceId = deviceId;
      sqliteFolderVersions.push({
        id: uuidv4(),
        folderId: folderId,
        field: "colour",
        value: createFieldVersionValue('update', existedSqliteFolder.colour, categorizer.color),
        timestamp: updatedTimestamp,
        deviceId: deviceId,
        createdAt: updatedDateTime,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (updated) {
      await db.updateTable("folder").set(existedSqliteFolder).where("id", "=", folderId).execute();
      await db.insertInto("folderFieldVersion").values(sqliteFolderVersions).execute();
    }
    // As the update would not affact the id and parentId, we don't need to update the children
    // TODO: handle the children update
    return existedSqliteFolder;
  }

  // If the categorizer is not a tag or folder, throw an error
  throw new Error(`Unknown categorizer type: ${type}`);
}



export async function deleteSqliteTag(name: string): Promise<void> {
  const deviceId = syncStateStore.get("deviceId");
  const existedSqliteTag = await db.selectFrom("tag").where("name", "=", name).selectAll().executeTakeFirst();
  if (existedSqliteTag) {
    await db.updateTable("tag").set({
      deletedAt: new Date().toISOString(),
      deletedByDeviceId: deviceId,
    }).where("id", "=", existedSqliteTag.id).execute();
    // Also delete the tagFieldVersion
    await db.deleteFrom("tagFieldVersion").where("tagId", "=", existedSqliteTag.id).execute();
    // Also add a delete operation to the paperTag
    const existedPaperTag = await db.selectFrom("paperTag").where("tagId", "=", existedSqliteTag.id).selectAll().executeTakeFirst();
    if (existedPaperTag) {
      await db.insertInto("paperTag").values({
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        op: "remove",
        timestamp: Date.now(),
        deviceId: deviceId,
        paperId: existedPaperTag.paperId,
        tagId: existedPaperTag.tagId,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      }).execute();
    }
  }
}

export async function deleteSqliteFolder(legacyOid: string): Promise<void> {
  const deviceId = syncStateStore.get("deviceId");
  const existedSqliteFolder = await db.selectFrom("folder").where("legacyOid", "=", legacyOid).selectAll().executeTakeFirst();
  if (existedSqliteFolder) {
    await db.updateTable("folder").set({
      deletedAt: new Date().toISOString(),
      deletedByDeviceId: deviceId,
    }).where("id", "=", existedSqliteFolder.id).execute();
    // Also delete the folderFieldVersion
    await db.deleteFrom("folderFieldVersion").where("folderId", "=", existedSqliteFolder.id).execute();
    // Also add a delete operation to the paperFolder
    const existedPaperFolder = await db.selectFrom("paperFolder").where("folderId", "=", existedSqliteFolder.id).selectAll().executeTakeFirst();
    if (existedPaperFolder) {
      await db.insertInto("paperFolder").values({
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        op: "remove",
        timestamp: Date.now(),
        deviceId: deviceId,
        paperId: existedPaperFolder.paperId,
        folderId: existedPaperFolder.folderId,
        createdByDeviceId: deviceId,
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        deletedByDeviceId: null,
      }).execute();
    }
  }
}
