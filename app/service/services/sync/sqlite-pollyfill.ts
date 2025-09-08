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
    previousValue,
    newValue,
  });
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
      createdAt: new Date(),
      updatedAt: new Date(),
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

  // Get library id
  const existedSqliteId = await db.selectFrom("library")
    .where("name", "=", library ?? "main")
    .select("id")
    .executeTakeFirstOrThrow();

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
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
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
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteFeed.color !== feed.color) {
      existedSqliteFeed.color = feed.color;
      updated = true;
      feedFieldVersions.push({
        id: uuidv4(),
        feedId: existedSqliteFeed.id,
        field: "color",
        value: createFieldVersionValue('update', existedSqliteFeed.color, feed.color),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
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
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (updated) {
      existedSqliteFeed.updatedAt = new Date();
      existedSqliteFeed.updatedByDeviceId = deviceId;
      await db.insertInto("feedFieldVersion").values(feedFieldVersions).execute();
      await db.updateTable("feed").set(existedSqliteFeed).where("id", "=", existedSqliteFeed.id).execute();
    }

    return existedSqliteFeed;
  }
  // Insert the feed to database
  const newSqliteFeed: z.infer<typeof zFeed> = {
    id: uuidv4(),
    legacyOid: feed._id.toString(),
    name: feed.name,
    ownedBy: syncStateStore.get("userId"),
    libraryId: await ensureLibraryId(library),
    type: "rss",
    url: feed.url,
    count: feed.count,
    color: feed.color,
    createdAt: new Date(),
    updatedAt: new Date(),
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
      value: createFieldVersionValue('create', null, feed.name),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: new Date(),
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      feedId: newSqliteFeed.id,
      field: "type",
      value: createFieldVersionValue('create', null, "rss"),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: new Date(),
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      feedId: newSqliteFeed.id,
      field: "url",
      value: createFieldVersionValue('create', null, feed.url),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: new Date(),
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      feedId: newSqliteFeed.id,
      field: "count",
      value: createFieldVersionValue('create', null, feed.count),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: new Date(),
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      feedId: newSqliteFeed.id,
      field: "color",
      value: createFieldVersionValue('create', null, feed.color),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: new Date(),
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
  ]
  await db.insertInto("feedFieldVersion").values(feedFieldVersions).execute();
  await db.insertInto("feed").values(newSqliteFeed).execute();
  return newSqliteFeed;


}


/**
 * Check if the entity is in database. If not, insert it to database. 
 * Otherwise, update the database entity according to the entity.
 * And finally, return the sqlite object. 
 * Authors, feeds, and categorizers like tags and folders will also be handled in this method. 
 * @param entity The entity to be converted to sqlite object.
 * @returns The sqlite object. Guaranteed in database.
 */
export async function toSqliteEntity(entity: Entity): Promise<z.infer<typeof zPaper>> {

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
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.journal !== entity.journal) {
      const previousValue = existedSqliteEntity.journal;
      existedSqliteEntity.journal = entity.journal;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "journal",
        value: createFieldVersionValue('update', previousValue, entity.journal),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.booktitle !== entity.booktitle) {
      const previousValue = existedSqliteEntity.booktitle;
      existedSqliteEntity.booktitle = entity.booktitle;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "booktitle",
        value: createFieldVersionValue('update', previousValue, entity.booktitle),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
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
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
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
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.volume !== entity.volume) {
      const previousValue = existedSqliteEntity.volume;
      existedSqliteEntity.volume = entity.volume;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "volume",
        value: createFieldVersionValue('update', previousValue, entity.volume),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.number !== entity.number) {
      const previousValue = existedSqliteEntity.number;
      existedSqliteEntity.number = entity.number;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "number",
        value: createFieldVersionValue('update', previousValue, entity.number),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.pages !== entity.pages) {
      const previousValue = existedSqliteEntity.pages;
      existedSqliteEntity.pages = entity.pages;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "pages",
        value: createFieldVersionValue('update', previousValue, entity.pages),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.publisher !== entity.publisher) {
      const previousValue = existedSqliteEntity.publisher;
      existedSqliteEntity.publisher = entity.publisher;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "publisher",
        value: createFieldVersionValue('update', previousValue, entity.publisher),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.series !== entity.series) {
      const previousValue = existedSqliteEntity.series;
      existedSqliteEntity.series = entity.series;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "series",
        value: createFieldVersionValue('update', previousValue, entity.series),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.edition !== entity.edition) {
      const previousValue = existedSqliteEntity.edition;
      existedSqliteEntity.edition = entity.edition;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "edition",
        value: createFieldVersionValue('update', previousValue, entity.edition),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.editor !== entity.editor) {
      const previousValue = existedSqliteEntity.editor;
      existedSqliteEntity.editor = entity.editor;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "editor",
        value: createFieldVersionValue('update', previousValue, entity.editor),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.howPublished !== entity.howpublished) {
      const previousValue = existedSqliteEntity.howPublished;
      existedSqliteEntity.howPublished = entity.howpublished;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "howPublished",
        value: createFieldVersionValue('update', previousValue, entity.howpublished),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.organization !== entity.organization) {
      const previousValue = existedSqliteEntity.organization;
      existedSqliteEntity.organization = entity.organization;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "organization",
        value: createFieldVersionValue('update', previousValue, entity.organization),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.school !== entity.school) {
      const previousValue = existedSqliteEntity.school;
      existedSqliteEntity.school = entity.school;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "school",
        value: createFieldVersionValue('update', previousValue, entity.school),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.institution !== entity.institution) {
      const previousValue = existedSqliteEntity.institution;
      existedSqliteEntity.institution = entity.institution;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "institution",
        value: createFieldVersionValue('update', previousValue, entity.institution),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.address !== entity.address) {
      const previousValue = existedSqliteEntity.address;
      existedSqliteEntity.address = entity.address;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "address",
        value: createFieldVersionValue('update', previousValue, entity.address),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.abstract !== entity.abstract) {
      const previousValue = existedSqliteEntity.abstract;
      existedSqliteEntity.abstract = entity.abstract;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "abstract",
        value: createFieldVersionValue('update', previousValue, entity.abstract),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.doi !== entity.doi) {
      const previousValue = existedSqliteEntity.doi;
      existedSqliteEntity.doi = entity.doi;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "doi",
        value: createFieldVersionValue('update', previousValue, entity.doi),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.arxiv !== entity.arxiv) {
      const previousValue = existedSqliteEntity.arxiv;
      existedSqliteEntity.arxiv = entity.arxiv;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "arxiv",
        value: createFieldVersionValue('update', previousValue, entity.arxiv),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.isbn !== entity.isbn) {
      const previousValue = existedSqliteEntity.isbn;
      existedSqliteEntity.isbn = entity.isbn;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "isbn",
        value: createFieldVersionValue('update', previousValue, entity.isbn),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.issn !== entity.issn) {
      const previousValue = existedSqliteEntity.issn;
      existedSqliteEntity.issn = entity.issn;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "issn",
        value: createFieldVersionValue('update', previousValue, entity.issn),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    // For papers
    if (existedSqliteEntity.rating !== entity.rating) {
      const previousValue = existedSqliteEntity.rating;
      existedSqliteEntity.rating = entity.rating;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "rating",
        value: createFieldVersionValue('update', previousValue, entity.rating),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.notes !== entity.note) {
      const previousValue = existedSqliteEntity.notes;
      existedSqliteEntity.notes = entity.note;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "notes",
        value: createFieldVersionValue('update', previousValue, entity.note),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteEntity.flag !== entity.flag) {
      const previousValue = existedSqliteEntity.flag;
      existedSqliteEntity.flag = entity.flag;
      updated = true;
      paperFieldVersions.push({
        id: uuidv4(),
        paperId: existedSqliteEntity.id,
        field: "flag",
        value: createFieldVersionValue('update', previousValue, entity.flag),
        timestamp: new Date(),
        deviceId: deviceId,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }


    if (updated) {
      existedSqliteEntity.updatedAt = new Date();
      existedSqliteEntity.updatedByDeviceId = deviceId;
      await db.insertInto("paperFieldVersion").values(paperFieldVersions).execute();
      await db.updateTable("paper").set(existedSqliteEntity).where("id", "=", existedSqliteEntity.id).execute();
    }

    return existedSqliteEntity;
  }

  // Insert the sqlite entity if not existed
  let sqliteEntity: SqlitePaper = {
    id: entity._id.toString(),
    legacyOid: entity._id.toString(),
    libraryId: libraryId,
    type: entity.type,
    // Bibtex
    title: entity.title,
    journal: entity.journal,
    booktitle: entity.booktitle,
    year: parseInt(entity.year),
    month: entity.month ? parseInt(entity.month) : null,
    volume: entity.volume,
    number: entity.number,
    pages: entity.pages,
    publisher: entity.publisher,
    series: entity.series,
    edition: entity.edition,
    editor: entity.editor,
    howPublished: entity.howpublished,
    organization: entity.organization,
    school: entity.school,
    institution: entity.institution,
    address: entity.address,
    abstract: entity.abstract,
    // Identifiers
    doi: entity.doi,
    arxiv: entity.arxiv,
    isbn: entity.isbn,
    issn: entity.issn,
    // For papers
    rating: entity.rating,
    notes: entity.note,
    flag: entity.flag,
    // Categorizers and feeds will be handled later as there'll be separate sql operations

    // Sqlite management properties
    createdAt: entity.addTime,
    createdByDeviceId: deviceId,
    updatedAt: entity.addTime,
    updatedByDeviceId: deviceId,
    deletedAt: null,
    deletedByDeviceId: null,
  }

  const paperFieldVersions: z.infer<typeof zPaperFieldVersion>[] = [

    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "type",
      value: JSON.stringify(entity.type),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "title",
      value: createFieldVersionValue('create', null, entity.title),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },

    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "journal",
      value: createFieldVersionValue('create', null, entity.journal),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "booktitle",
      value: createFieldVersionValue('create', null, entity.booktitle),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "year",
      value: JSON.stringify(parseInt(entity.year)),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "month",
      value: JSON.stringify(entity.month ? parseInt(entity.month) : null),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "volume",
      value: createFieldVersionValue('create', null, entity.volume),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "number",
      value: createFieldVersionValue('create', null, entity.number),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "pages",
      value: createFieldVersionValue('create', null, entity.pages),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "publisher",
      value: createFieldVersionValue('create', null, entity.publisher),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "series",
      value: createFieldVersionValue('create', null, entity.series),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "edition",
      value: createFieldVersionValue('create', null, entity.edition),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "editor",
      value: createFieldVersionValue('create', null, entity.editor),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "howPublished",
      value: createFieldVersionValue('create', null, entity.howpublished),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "organization",
      value: createFieldVersionValue('create', null, entity.organization),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "school",
      value: createFieldVersionValue('create', null, entity.school),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "institution",
      value: createFieldVersionValue('create', null, entity.institution),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "address",
      value: createFieldVersionValue('create', null, entity.address),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "abstract",
      value: createFieldVersionValue('create', null, entity.abstract),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "doi",
      value: createFieldVersionValue('create', null, entity.doi),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "arxiv",
      value: createFieldVersionValue('create', null, entity.arxiv),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "isbn",
      value: createFieldVersionValue('create', null, entity.isbn),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "issn",
      value: createFieldVersionValue('create', null, entity.issn),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "rating",
      value: createFieldVersionValue('create', null, entity.rating),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "notes",
      value: createFieldVersionValue('create', null, entity.note),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "flag",
      value: createFieldVersionValue('create', null, entity.flag),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "feedId",
      value: createFieldVersionValue('create', null, null),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "feedItemId",
      value: createFieldVersionValue('create', null, null),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "read",
      value: createFieldVersionValue('create', null, null),
      timestamp: new Date(),
      deviceId: deviceId,
      createdAt: entity.addTime,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
  ];
  await db.insertInto("paperFieldVersion").values(paperFieldVersions).execute();
  await db.insertInto("paper").values(sqliteEntity).execute();

  // Add author if not existed, and add the paperAuthor connection
  entity.authors.split(",").forEach(async (author) => {
    let existedAuthorId = await db.selectFrom("author").where("name", "=", author).select("id").executeTakeFirst();
    const authorId = existedAuthorId?.id || uuidv4();
    if (!existedAuthorId) {
      await db.insertInto("author").values({
        id: authorId,
        name: author,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
      }).execute();
    }
    await db.insertInto("paperAuthor").values({
      id: uuidv4(),
      createdAt: new Date(),
      op: "add",
      timestamp: new Date(),
      deviceId: deviceId,
      paperId: sqliteEntity.id,
      authorId: authorId,
    }).execute();
  });
  // Remove author if not in the entity
  const existedSqliteAuthors = await db.selectFrom("paperAuthor").where("paperId", "=", sqliteEntity.id).selectAll().execute();
  if (existedSqliteAuthors) {
    await db.insertInto("paperAuthor").values(existedSqliteAuthors.map((author) => ({
      id: uuidv4(),
      createdAt: new Date(),
      op: "remove",
      timestamp: new Date(),
      deviceId: deviceId,
      paperId: sqliteEntity.id,
      authorId: author.authorId,
    })));
  }

  entity.tags.forEach(async (tag) => {
    let existedTagId = await db.selectFrom("tag").where("name", "=", tag.name).select("id").executeTakeFirst();
    const tagId = existedTagId?.id || uuidv4();
    if (!existedTagId) {
      await db.insertInto("tag").values({
        id: tagId,
        name: tag.name,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
      }).execute();
    }
    await db.insertInto("paperTag").values({
      id: uuidv4(),
      createdAt: new Date(),
      op: "add",
      timestamp: new Date(),
      deviceId: deviceId,
      paperId: sqliteEntity.id,
      tagId: tagId,
    }).execute();
  });

  return sqliteEntity;
}

export async function deleteSqliteEntity(entity: Entity): Promise<void> {
  const deviceId = syncStateStore.get("deviceId");
  // Query and update deletedAt and deletedByDeviceId of the sqlite entity by legacy oid
  const existedSqliteEntity = await db.selectFrom("paper").where("legacyOid", "=", entity._id.toString()).selectAll().executeTakeFirst();
  if (existedSqliteEntity) {
    await db.updateTable("paper").set({
      deletedAt: new Date(),
      deletedByDeviceId: deviceId,
    }).where("id", "=", existedSqliteEntity.id).execute();
  }
  // Query and update deletedAt and deletedByDeviceId of the sqlite authors by paper id
  const existedSqliteAuthors = await db.selectFrom("paperAuthor").where("paperId", "=", entity._id.toString()).selectAll().execute();
  if (existedSqliteAuthors) {
    await db.updateTable("paperAuthor").set({
      deletedAt: new Date(),
      deletedByDeviceId: deviceId,
    }).where("id", "in", existedSqliteAuthors.map((author) => author.id)).execute();
  }
  // Query and update deletedAt and deletedByDeviceId of the sqlite tags by paper id
  const existedSqliteTags = await db.selectFrom("paperTag").where("paperId", "=", entity._id.toString()).selectAll().execute();
  if (existedSqliteTags) {
    await db.updateTable("paperTag").set({
      deletedAt: new Date(),
      deletedByDeviceId: deviceId,
    }).where("id", "in", existedSqliteTags.map((tag) => tag.id)).execute();
  }
  // Query and update deletedAt and deletedByDeviceId of the sqlite folders by paper id
  const existedSqliteFolders = await db.selectFrom("paperFolder").where("paperId", "=", entity._id.toString()).selectAll().execute();
  if (existedSqliteFolders) {
    await db.updateTable("paperFolder").set({
      deletedAt: new Date(),
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
    if (!existedSqliteTag) {
      const sqliteTag: z.infer<typeof zTag> = {
        id: tagId,
        name: categorizer.name,
        colour: categorizer.color,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        updatedAt: new Date(),
        updatedByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      };
      await db.insertInto("tag").values(sqliteTag).execute();
      return sqliteTag;
    }

    // If the tag is already existed, update the sqlite tag if any difference
    let updated = false;
    const updatedTimestamp = new Date();
    const sqliteTagVersions: z.infer<typeof zTagFieldVersion>[] = [];
    if (existedSqliteTag.name !== categorizer.name) {
      existedSqliteTag.name = categorizer.name;
      updated = true;
      existedSqliteTag.updatedAt = updatedTimestamp;
      existedSqliteTag.updatedByDeviceId = deviceId;
      sqliteTagVersions.push({
        id: uuidv4(),
        tagId: tagId,
        field: "name",
        value: createFieldVersionValue('update', existedSqliteTag.name, categorizer.name),
        timestamp: updatedTimestamp,
        deviceId: deviceId,
        createdAt: updatedTimestamp,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteTag.colour !== categorizer.color) {
      existedSqliteTag.colour = categorizer.color;
      updated = true;
      existedSqliteTag.updatedAt = updatedTimestamp;
      existedSqliteTag.updatedByDeviceId = deviceId;
      sqliteTagVersions.push({
        id: uuidv4(),
        tagId: tagId,
        field: "colour",
        value: createFieldVersionValue('update', existedSqliteTag.colour, categorizer.color),
        timestamp: updatedTimestamp,
        deviceId: deviceId,
        createdAt: updatedTimestamp,
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
    if (!existedSqliteFolder) {
      const sqliteFolder: z.infer<typeof zFolder> = {
        id: folderId,
        name: categorizer.name,
        createdAt: new Date(),
        createdByDeviceId: deviceId,
        libraryId: await ensureLibraryId(),
        updatedAt: new Date(),
      };
      await db.insertInto("folder").values(sqliteFolder).execute();
      // TODO: handle the children
      return sqliteFolder;
    }
    // If the folder is already existed, update the sqlite folder if any difference
    let updated = false;
    const updatedTimestamp = new Date();
    const sqliteFolderVersions: z.infer<typeof zFolderFieldVersion>[] = [];
    if (existedSqliteFolder.name !== categorizer.name) {
      existedSqliteFolder.name = categorizer.name;
      updated = true;
      existedSqliteFolder.updatedAt = updatedTimestamp;
      existedSqliteFolder.updatedByDeviceId = deviceId;
      sqliteFolderVersions.push({
        id: uuidv4(),
        folderId: folderId,
        field: "name",
        value: createFieldVersionValue('update', existedSqliteFolder.name, categorizer.name),
        timestamp: updatedTimestamp,
        deviceId: deviceId,
        createdAt: updatedTimestamp,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteFolder.colour !== categorizer.color) {
      existedSqliteFolder.colour = categorizer.color;
      updated = true;
      existedSqliteFolder.updatedAt = updatedTimestamp;
      existedSqliteFolder.updatedByDeviceId = deviceId;
      sqliteFolderVersions.push({
        id: uuidv4(),
        folderId: folderId,
        field: "colour",
        value: createFieldVersionValue('update', existedSqliteFolder.colour, categorizer.color),
        timestamp: updatedTimestamp,
        deviceId: deviceId,
        createdAt: updatedTimestamp,
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
    return existedSqliteFolder;
  }

  // If the categorizer is not a tag or folder, throw an error
  throw new Error(`Unknown categorizer type: ${type}`);
}

