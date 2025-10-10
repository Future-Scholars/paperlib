import { Entity, IEntityObject } from "@/models/entity";
import { IFeedDraft } from "@/models/feed";
import { zPaper, zPaperFieldVersion, Paper as SqlitePaper } from "@/service/services/database/sqlite/models";
import { syncStateStore } from "@/service/services/sync/states";
import { db } from "@/service/services/database/sqlite/db";
import { v4 as uuidv4 } from 'uuid';
import z from "zod";
import { createFieldVersionValue, ensureUndefinedToNull, ensureLibraryId, booleanToInt } from "./utils";
import { toSqliteFeed, toRealmFeed } from "./feed";



/**
 * Check if the entity is in database. If not, insert it to database. 
 * Otherwise, update the database entity according to the entity.
 * And finally, return the sqlite object. 
 * Authors, feeds, and categorizers like tags and folders will also be handled in this method. 
 * @param entity The entity to be converted to sqlite object.
 * @returns The sqlite object. Guaranteed in database.
 */
export async function toSqlitePaper(entity: Entity, logService?: any): Promise<z.infer<typeof zPaper>> {

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
    const createdAtDate = new Date();
    const createdAtDateString = createdAtDate.toISOString();
    const createdAtTimestamp = createdAtDate.getTime();
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
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
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        hash: null,
        createdAt: createdAtTimestamp,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }


    if (updated) {
      existedSqliteEntity.updatedAt = createdAtTimestamp;
      existedSqliteEntity.updatedByDeviceId = deviceId;
      await db.insertInto("paperFieldVersion").values(paperFieldVersions).execute();
      await db.updateTable("paper").set(existedSqliteEntity).where("id", "=", existedSqliteEntity.id).execute();

    }

    return existedSqliteEntity;
  }

  // Insert the sqlite entity if not existed
  const createdAtDate = new Date();
  const createdAtDateString = createdAtDate.toISOString();
  const createdAtTimestamp = createdAtDate.getTime();
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
    createdAt: createdAtTimestamp,
    createdByDeviceId: deviceId,
    updatedAt: null,
    updatedByDeviceId: deviceId,

    deletedAt: null,
    deletedByDeviceId: null,
  }

  const paperFieldVersions: z.infer<typeof zPaperFieldVersion>[] = [

    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "type",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.type)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "title",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.title)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },

    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "journal",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.journal)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "booktitle",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.booktitle)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "year",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(parseInt(entity.year))),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "month",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.month ? parseInt(entity.month) : null)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "volume",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.volume)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "number",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.number)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "pages",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.pages)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "publisher",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.publisher)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "series",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.series)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "edition",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.edition)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "editor",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.editor)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "howPublished",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.howpublished)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "organization",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.organization)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "school",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.school)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "institution",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.institution)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "address",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.address)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "abstract",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.abstract)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "doi",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.doi)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "arxiv",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.arxiv)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "isbn",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.isbn)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "issn",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.issn)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "rating",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.rating)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "notes",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.note)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "flag",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.flag)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "feedId",
      value: createFieldVersionValue('create', null, null), // TODO: need to handle this when discrimiate the feedId
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "feedItemId",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(null)), // TODO: need to handle this when discrimiate the feedItemId
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      paperId: sqliteEntity.id,
      field: "read",
      value: createFieldVersionValue('create', null, ensureUndefinedToNull(entity.read)),
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      hash: null,
      deletedAt: null,
      deletedByDeviceId: null,
    },
  ];

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
        createdAt: createdAtTimestamp,
        createdByDeviceId: deviceId,
      }).execute();
    }
    await db.insertInto("paperAuthor").values({
      id: uuidv4(),
      createdAt: createdAtTimestamp,
      op: "add",
      timestamp: createdAtTimestamp,
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
      createdAt: createdAtTimestamp,
      op: "remove",
      timestamp: createdAtTimestamp,
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
        createdAt: createdAtTimestamp,
        createdByDeviceId: deviceId,
        updatedAt: null,
        updatedByDeviceId: null,
        deletedAt: null,
        deletedByDeviceId: null,
      }).execute();
    }
    await db.insertInto("paperTag").values({
      id: uuidv4(),
      op: "add",
      timestamp: createdAtTimestamp,
      deviceId: deviceId,
      paperId: sqliteEntity.id,
      tagId: tagId,
      createdAt: createdAtTimestamp,
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    }).execute();
  });

  return sqliteEntity;
}

export async function toRealmPaperEntity(sqlitePaper: SqlitePaper): Promise<IEntityObject> {
  // Get library name by library id
  const library = await db.selectFrom("library")
    .where("id", "=", sqlitePaper.libraryId)
    .select("name")
    .executeTakeFirst();
  
  // Get authors for this paper
  const authors = await db.selectFrom("paperAuthor")
    .innerJoin("author", "author.id", "paperAuthor.authorId")
    .where("paperAuthor.paperId", "=", sqlitePaper.id)
    .where("paperAuthor.op", "=", "add")
    .where("paperAuthor.deletedAt", "is", null)
    .select("author.name")
    .execute();
  
  // Get tags for this paper
  const paperTags = await db.selectFrom("paperTag")
    .innerJoin("tag", "tag.id", "paperTag.tagId")
    .where("paperTag.paperId", "=", sqlitePaper.id)
    .where("paperTag.op", "=", "add")
    .where("paperTag.deletedAt", "is", null)
    .selectAll("tag")
    .execute();
  
  // Get folders for this paper
  const paperFolders = await db.selectFrom("paperFolder")
    .innerJoin("folder", "folder.id", "paperFolder.folderId")
    .where("paperFolder.paperId", "=", sqlitePaper.id)
    .where("paperFolder.op", "=", "add")
    .where("paperFolder.deletedAt", "is", null)
    .selectAll("folder")
    .execute();
  
  // Get feed if exists
  let feed: IFeedDraft | undefined = undefined;
  if (sqlitePaper.feedId) {
    const feedData = await db.selectFrom("feed")
      .where("id", "=", sqlitePaper.feedId)
      .selectAll()
      .executeTakeFirst();
    
    if (feedData) {
      feed = await toRealmFeed(feedData);
    }
  }

  // Convert SQLite paper to Realm Entity
  const entity: Entity = new Entity({
    _id: sqlitePaper.legacyOid || sqlitePaper.id,
    addTime: new Date(sqlitePaper.createdAt),
    library: library?.name || "main",
    type: sqlitePaper.type as any,
    abstract: ensureUndefinedToNull(sqlitePaper.abstract),
    defaultSup: undefined, // Not available in SQLite model
    supplementaries: {}, // Will be handled separately if needed
    
    // Identifiers
    doi: ensureUndefinedToNull(sqlitePaper.doi),
    arxiv: ensureUndefinedToNull(sqlitePaper.arxiv),
    issn: ensureUndefinedToNull(sqlitePaper.issn),
    isbn: ensureUndefinedToNull(sqlitePaper.isbn),
    
    // Bibtex fields
    title: sqlitePaper.title,
    authors: authors.map(a => a.name).join(", "),
    journal: ensureUndefinedToNull(sqlitePaper.journal),
    booktitle: ensureUndefinedToNull(sqlitePaper.booktitle),
    year: sqlitePaper.year?.toString() || "",
    month: ensureUndefinedToNull(sqlitePaper.month?.toString()),
    volume: ensureUndefinedToNull(sqlitePaper.volume),
    number: ensureUndefinedToNull(sqlitePaper.number),
    pages: ensureUndefinedToNull(sqlitePaper.pages),
    publisher: ensureUndefinedToNull(sqlitePaper.publisher),
    series: ensureUndefinedToNull(sqlitePaper.series),
    edition: ensureUndefinedToNull(sqlitePaper.edition),
    editor: ensureUndefinedToNull(sqlitePaper.editor),
    howpublished: ensureUndefinedToNull(sqlitePaper.howPublished),
    organization: ensureUndefinedToNull(sqlitePaper.organization),
    school: ensureUndefinedToNull(sqlitePaper.school),
    institution: ensureUndefinedToNull(sqlitePaper.institution),
    address: ensureUndefinedToNull(sqlitePaper.address),
    
    // Paper-specific fields
    // TODO: Tags, folders and feed
    rating: ensureUndefinedToNull(sqlitePaper.rating),
    flag: sqlitePaper.flag === 1,
    note: ensureUndefinedToNull(sqlitePaper.notes),
    
    // Feed fields
    read: sqlitePaper.read === 1,
  });

  return entity;
}

export async function deleteSqlitePaper(legacyOid: string): Promise<void> {
  const deviceId = syncStateStore.get("deviceId");
  // Query and update deletedAt and deletedByDeviceId of the sqlite entity by legacy oid
  const existedSqliteEntity = await db.selectFrom("paper").where("legacyOid", "=", legacyOid).selectAll().executeTakeFirst();
  const deletedAtDate = new Date();
  const deletedAtDateString = deletedAtDate.toISOString();
  const deletedAtTimestamp = deletedAtDate.getTime();
  if (existedSqliteEntity) {
    await db.updateTable("paper").set({
      deletedAt: deletedAtTimestamp,
      deletedByDeviceId: deviceId,
    }).where("id", "=", existedSqliteEntity.id).execute();
  }
  // Delete the paper means that all the related entities should be deleted instead of removed from the OR-Set
  // Query and update deletedAt and deletedByDeviceId of the sqlite authors by paper id
  const existedSqliteAuthors = await db.selectFrom("paperAuthor").where("paperId", "=", legacyOid).selectAll().execute();
  if (existedSqliteAuthors) {
    await db.updateTable("paperAuthor").set({
      deletedAt: deletedAtTimestamp,
      deletedByDeviceId: deviceId,
    }).where("id", "in", existedSqliteAuthors.map((author) => author.id)).execute();
  }
  // Query and update deletedAt and deletedByDeviceId of the sqlite tags by paper id
  const existedSqliteTags = await db.selectFrom("paperTag").where("paperId", "=", legacyOid).selectAll().execute();
  if (existedSqliteTags) {
    await db.updateTable("paperTag").set({
      deletedAt: deletedAtTimestamp,
      deletedByDeviceId: deviceId,
    }).where("id", "in", existedSqliteTags.map((tag) => tag.id)).execute();
  }
  // Query and update deletedAt and deletedByDeviceId of the sqlite folders by paper id
  const existedSqliteFolders = await db.selectFrom("paperFolder").where("paperId", "=", legacyOid).selectAll().execute();
  if (existedSqliteFolders) {
    await db.updateTable("paperFolder").set({
      deletedAt: deletedAtTimestamp,
      deletedByDeviceId: deviceId,
    }).where("id", "in", existedSqliteFolders.map((folder) => folder.id)).execute();
  }
}


