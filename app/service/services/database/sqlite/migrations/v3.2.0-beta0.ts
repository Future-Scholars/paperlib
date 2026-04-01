import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // --- Entity tables ---
  await db.schema
    .createTable("library")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("updatedAt", "integer")
    .addColumn("updatedByDeviceId", "text")
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("ownedBy", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("paper")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("updatedAt", "integer")
    .addColumn("updatedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("abstract", "text")
    .addColumn("journal", "text")
    .addColumn("booktitle", "text")
    .addColumn("year", "integer")
    .addColumn("month", "integer")
    .addColumn("volume", "text")
    .addColumn("number", "text")
    .addColumn("pages", "text")
    .addColumn("publisher", "text")
    .addColumn("series", "text")
    .addColumn("edition", "text")
    .addColumn("editor", "text")
    .addColumn("howPublished", "text")
    .addColumn("organization", "text")
    .addColumn("school", "text")
    .addColumn("institution", "text")
    .addColumn("address", "text")
    .addColumn("doi", "text")
    .addColumn("arxiv", "text")
    .addColumn("isbn", "text")
    .addColumn("issn", "text")
    .addColumn("notes", "text")
    .addColumn("flag", "integer")
    .addColumn("rating", "integer", (col) => col.notNull())
    .addColumn("read", "integer")
    .addColumn("feedId", "text")
    .addColumn("feedItemId", "text")
    .execute();

  await db.schema
    .createTable("author")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("updatedAt", "integer")
    .addColumn("updatedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("affiliation", "text")
    .addColumn("email", "text")
    .addColumn("orcid", "text")
    .addColumn("firstName", "text")
    .addColumn("lastName", "text")
    .execute();

  await db.schema
    .createTable("tag")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("updatedAt", "integer")
    .addColumn("updatedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("colour", "text")
    .execute();

  await db.schema
    .createTable("folder")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("updatedAt", "integer")
    .addColumn("updatedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("colour", "text")
    .addColumn("parentId", "text")
    .execute();

  await db.schema
    .createTable("supplement")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("updatedAt", "integer")
    .addColumn("updatedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .execute();

  await db.schema
    .createTable("feed")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("updatedAt", "integer")
    .addColumn("updatedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("legacyOid", "text")
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("url", "text", (col) => col.notNull())
    .addColumn("count", "integer", (col) => col.notNull())
    .addColumn("colour", "text")
    .execute();

  // --- Field version tables ---
  await db.schema
    .createTable("paperFieldVersion")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("value", "text")
    .addColumn("hash", "text")
    .addColumn("timestamp", "integer", (col) => col.notNull())
    .addColumn("deviceId", "text", (col) => col.notNull())
    .addColumn("localInsertedAt", "integer", (col) => col.notNull())
    .addColumn("paperId", "text", (col) => col.notNull())
    .addColumn("field", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("authorFieldVersion")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("value", "text")
    .addColumn("hash", "text")
    .addColumn("timestamp", "integer", (col) => col.notNull())
    .addColumn("deviceId", "text", (col) => col.notNull())
    .addColumn("localInsertedAt", "integer", (col) => col.notNull())
    .addColumn("authorId", "text", (col) => col.notNull())
    .addColumn("field", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("tagFieldVersion")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("value", "text")
    .addColumn("hash", "text")
    .addColumn("timestamp", "integer", (col) => col.notNull())
    .addColumn("deviceId", "text", (col) => col.notNull())
    .addColumn("localInsertedAt", "integer", (col) => col.notNull())
    .addColumn("tagId", "text", (col) => col.notNull())
    .addColumn("field", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("folderFieldVersion")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("value", "text")
    .addColumn("hash", "text")
    .addColumn("timestamp", "integer", (col) => col.notNull())
    .addColumn("deviceId", "text", (col) => col.notNull())
    .addColumn("localInsertedAt", "integer", (col) => col.notNull())
    .addColumn("folderId", "text", (col) => col.notNull())
    .addColumn("field", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("supplementFieldVersion")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("value", "text")
    .addColumn("hash", "text")
    .addColumn("timestamp", "integer", (col) => col.notNull())
    .addColumn("deviceId", "text", (col) => col.notNull())
    .addColumn("localInsertedAt", "integer", (col) => col.notNull())
    .addColumn("supplementId", "text", (col) => col.notNull())
    .addColumn("field", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("libraryFieldVersion")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("value", "text")
    .addColumn("hash", "text")
    .addColumn("timestamp", "integer", (col) => col.notNull())
    .addColumn("deviceId", "text", (col) => col.notNull())
    .addColumn("localInsertedAt", "integer", (col) => col.notNull())
    .addColumn("field", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("feedFieldVersion")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("value", "text")
    .addColumn("hash", "text")
    .addColumn("timestamp", "integer", (col) => col.notNull())
    .addColumn("deviceId", "text", (col) => col.notNull())
    .addColumn("localInsertedAt", "integer", (col) => col.notNull())
    .addColumn("feedId", "text", (col) => col.notNull())
    .addColumn("field", "text", (col) => col.notNull())
    .execute();

  // --- Relationship (OR-Set) tables ---
  await db.schema
    .createTable("paperAuthor")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("op", "text", (col) => col.notNull())
    .addColumn("timestamp", "integer", (col) => col.notNull())
    .addColumn("deviceId", "text", (col) => col.notNull())
    .addColumn("localInsertedAt", "integer", (col) => col.notNull())
    .addColumn("paperId", "text", (col) => col.notNull())
    .addColumn("authorId", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("paperTag")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("op", "text", (col) => col.notNull())
    .addColumn("timestamp", "integer", (col) => col.notNull())
    .addColumn("deviceId", "text", (col) => col.notNull())
    .addColumn("localInsertedAt", "integer", (col) => col.notNull())
    .addColumn("paperId", "text", (col) => col.notNull())
    .addColumn("tagId", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("paperFolder")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("op", "text", (col) => col.notNull())
    .addColumn("timestamp", "integer", (col) => col.notNull())
    .addColumn("deviceId", "text", (col) => col.notNull())
    .addColumn("localInsertedAt", "integer", (col) => col.notNull())
    .addColumn("paperId", "text", (col) => col.notNull())
    .addColumn("folderId", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("paperSupplement")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("createdAt", "integer", (col) => col.notNull())
    .addColumn("createdByDeviceId", "text", (col) => col.notNull())
    .addColumn("deletedAt", "integer")
    .addColumn("deletedByDeviceId", "text")
    .addColumn("libraryId", "text", (col) => col.notNull())
    .addColumn("op", "text", (col) => col.notNull())
    .addColumn("timestamp", "integer", (col) => col.notNull())
    .addColumn("deviceId", "text", (col) => col.notNull())
    .addColumn("localInsertedAt", "integer", (col) => col.notNull())
    .addColumn("paperId", "text", (col) => col.notNull())
    .addColumn("supplementId", "text", (col) => col.notNull())
    .execute();

  // --- Change stream view (UNION of all field version and or_set sources) ---
  const changeStreamViewSql = `
CREATE VIEW IF NOT EXISTS changeStream AS
  SELECT libraryId, 'field_version' AS type, 'paper' AS model, id, localInsertedAt FROM paperFieldVersion
  UNION ALL SELECT libraryId, 'field_version', 'author', id, localInsertedAt FROM authorFieldVersion
  UNION ALL SELECT libraryId, 'field_version', 'tag', id, localInsertedAt FROM tagFieldVersion
  UNION ALL SELECT libraryId, 'field_version', 'folder', id, localInsertedAt FROM folderFieldVersion
  UNION ALL SELECT libraryId, 'field_version', 'supplement', id, localInsertedAt FROM supplementFieldVersion
  UNION ALL SELECT libraryId, 'field_version', 'library', id, localInsertedAt FROM libraryFieldVersion
  UNION ALL SELECT libraryId, 'field_version', 'feed', id, localInsertedAt FROM feedFieldVersion
  UNION ALL SELECT libraryId, 'or_set', 'paperAuthor', id, localInsertedAt FROM paperAuthor
  UNION ALL SELECT libraryId, 'or_set', 'paperTag', id, localInsertedAt FROM paperTag
  UNION ALL SELECT libraryId, 'or_set', 'paperFolder', id, localInsertedAt FROM paperFolder
  UNION ALL SELECT libraryId, 'or_set', 'paperSupplement', id, localInsertedAt FROM paperSupplement
`;
  await sql.raw(changeStreamViewSql).execute(db);

  // --- Projection cursor state table ---
  await db.schema
  .createTable("local_projection_state")
  .addColumn("name", "text", (col) => col.notNull())
  .addColumn("libraryId", "text", (col) => col.notNull())
  .addColumn("lastLocalInsertedAt", "integer", (col) => col.notNull())
  .addPrimaryKeyConstraint("local_projection_state_pk", ["name", "libraryId"])
  .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropView("changeStream").ifExists().execute();

  await db.schema.dropTable("paperSupplement").ifExists().execute();
  await db.schema.dropTable("paperFolder").ifExists().execute();
  await db.schema.dropTable("paperTag").ifExists().execute();
  await db.schema.dropTable("paperAuthor").ifExists().execute();

  await db.schema.dropTable("feedFieldVersion").ifExists().execute();
  await db.schema.dropTable("libraryFieldVersion").ifExists().execute();
  await db.schema.dropTable("supplementFieldVersion").ifExists().execute();
  await db.schema.dropTable("folderFieldVersion").ifExists().execute();
  await db.schema.dropTable("tagFieldVersion").ifExists().execute();
  await db.schema.dropTable("authorFieldVersion").ifExists().execute();
  await db.schema.dropTable("paperFieldVersion").ifExists().execute();

  await db.schema.dropTable("feed").ifExists().execute();
  await db.schema.dropTable("supplement").ifExists().execute();
  await db.schema.dropTable("folder").ifExists().execute();
  await db.schema.dropTable("tag").ifExists().execute();
  await db.schema.dropTable("author").ifExists().execute();
  await db.schema.dropTable("paper").ifExists().execute();
  await db.schema.dropTable("library").ifExists().execute();

  await db.schema.dropTable("local_projection_state").ifExists().execute();

}
