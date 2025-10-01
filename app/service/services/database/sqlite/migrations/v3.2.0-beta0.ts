import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create library table
  await db.schema
    .createTable('library')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('ownedBy', 'text')
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'numeric')
    .addColumn('updatedByDeviceId', 'text')
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  // Create author table
  await db.schema
    .createTable('author')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('affiliation', 'text')
    .addColumn('email', 'text')
    .addColumn('orcid', 'text')
    .addColumn('firstName', 'text')
    .addColumn('lastName', 'text')
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  // Create tag table
  await db.schema
    .createTable('tag')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('colour', 'text')
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'numeric')
    .addColumn('updatedByDeviceId', 'text')
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  // Create folder table
  await db.schema
    .createTable('folder')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('legacyOid', 'text')
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('colour', 'text')
    .addColumn('description', 'text')
    .addColumn('parentId', 'text')
    .addColumn('libraryId', 'text', (col) => col.references('library.id').onDelete('cascade').notNull())
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'numeric')
    .addColumn('updatedByDeviceId', 'text')
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  // Create paper table
  await db.schema
    .createTable('paper')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('legacyOid', 'text')
    .addColumn('libraryId', 'text', (col) => col.references('library.id').onDelete('cascade').notNull())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('abstract', 'text')
    .addColumn('journal', 'text')
    .addColumn('booktitle', 'text')
    .addColumn('year', 'integer')
    .addColumn('month', 'integer')
    .addColumn('volume', 'text')
    .addColumn('number', 'text')
    .addColumn('pages', 'text')
    .addColumn('publisher', 'text')
    .addColumn('series', 'text')
    .addColumn('edition', 'text')
    .addColumn('editor', 'text')
    .addColumn('howPublished', 'text')
    .addColumn('organization', 'text')
    .addColumn('school', 'text')
    .addColumn('institution', 'text')
    .addColumn('address', 'text')
    .addColumn('doi', 'text')
    .addColumn('arxiv', 'text')
    .addColumn('isbn', 'text')
    .addColumn('issn', 'text')
    .addColumn('notes', 'text')
    .addColumn('flag', 'integer')
    .addColumn('rating', 'integer')
    .addColumn('read', 'integer')
    .addColumn('feedId', 'text')
    .addColumn('feedItemId', 'text')
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'numeric')
    .addColumn('updatedByDeviceId', 'text')
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  // Create supplement table
  await db.schema
    .createTable('supplement')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('paperId', 'text', (col) => col.references('paper.id').onDelete('cascade').notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('value', 'text', (col) => col.notNull())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'numeric', (col) => col.notNull())
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  // Create feed table
  await db.schema
    .createTable('feed')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('legacyOid', 'text')
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('ownedBy', 'text')
    .addColumn('libraryId', 'text', (col) => col.references('library.id').onDelete('cascade').notNull())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('url', 'text', (col) => col.notNull())
    .addColumn('count', 'integer')
    .addColumn('color', 'text')
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'numeric')
    .addColumn('updatedByDeviceId', 'text')
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  // Create libraryShare table
  await db.schema
    .createTable('libraryShare')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('libraryId', 'text', (col) => col.references('library.id').onDelete('cascade').notNull())
    .addColumn('userId', 'text', (col) => col.notNull())
    .addColumn('permission', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'numeric')
    .addColumn('updatedByDeviceId', 'text')
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  // Create paperAuthor junction table
  await db.schema
    .createTable('paperAuthor')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('paperId', 'text', (col) => col.references('paper.id').onDelete('cascade').notNull())
    .addColumn('authorId', 'text', (col) => col.references('author.id').onDelete('cascade').notNull())
    .addColumn('op', 'text', (col) => col.notNull())
    .addColumn('timestamp', 'numeric', (col) => col.notNull())
    .addColumn('deviceId', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  // Create paperTag junction table
  await db.schema
    .createTable('paperTag')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('paperId', 'text', (col) => col.references('paper.id').onDelete('cascade').notNull())
    .addColumn('tagId', 'text', (col) => col.references('tag.id').onDelete('cascade').notNull())
    .addColumn('op', 'text', (col) => col.notNull())
    .addColumn('timestamp', 'numeric', (col) => col.notNull())
    .addColumn('deviceId', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  // Create paperFolder junction table
  await db.schema
    .createTable('paperFolder')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('paperId', 'text', (col) => col.references('paper.id').onDelete('cascade').notNull())
    .addColumn('folderId', 'text', (col) => col.references('folder.id').onDelete('cascade').notNull())
    .addColumn('op', 'text', (col) => col.notNull())
    .addColumn('timestamp', 'numeric', (col) => col.notNull())
    .addColumn('deviceId', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  // Create field version tables
  await db.schema
    .createTable('paperFieldVersion')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('paperId', 'text', (col) => col.references('paper.id').onDelete('cascade').notNull())
    .addColumn('field', 'text', (col) => col.notNull())
    .addColumn('value', 'text')
    .addColumn('timestamp', 'numeric', (col) => col.notNull())
    .addColumn('deviceId', 'text', (col) => col.notNull())
    .addColumn('hash', 'text')
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  await db.schema
    .createTable('authorFieldVersion')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('authorId', 'text', (col) => col.references('author.id').onDelete('cascade').notNull())
    .addColumn('field', 'text', (col) => col.notNull())
    .addColumn('value', 'text')
    .addColumn('timestamp', 'numeric', (col) => col.notNull())
    .addColumn('deviceId', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  await db.schema
    .createTable('tagFieldVersion')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('tagId', 'text', (col) => col.references('tag.id').onDelete('cascade').notNull())
    .addColumn('field', 'text', (col) => col.notNull())
    .addColumn('value', 'text')
    .addColumn('timestamp', 'numeric', (col) => col.notNull())
    .addColumn('deviceId', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  await db.schema
    .createTable('folderFieldVersion')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('folderId', 'text', (col) => col.references('folder.id').onDelete('cascade').notNull())
    .addColumn('field', 'text', (col) => col.notNull())
    .addColumn('value', 'text')
    .addColumn('timestamp', 'numeric', (col) => col.notNull())
    .addColumn('deviceId', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  await db.schema
    .createTable('supplementFieldVersion')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('supplementId', 'text', (col) => col.references('supplement.id').onDelete('cascade').notNull())
    .addColumn('field', 'text', (col) => col.notNull())
    .addColumn('value', 'text')
    .addColumn('timestamp', 'numeric', (col) => col.notNull())
    .addColumn('deviceId', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  await db.schema
    .createTable('libraryFieldVersion')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('libraryId', 'text', (col) => col.references('library.id').onDelete('cascade').notNull())
    .addColumn('field', 'text', (col) => col.notNull())
    .addColumn('value', 'text')
    .addColumn('timestamp', 'numeric', (col) => col.notNull())
    .addColumn('deviceId', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  await db.schema
    .createTable('feedFieldVersion')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('feedId', 'text', (col) => col.references('feed.id').onDelete('cascade').notNull())
    .addColumn('field', 'text', (col) => col.notNull())
    .addColumn('value', 'text')
    .addColumn('timestamp', 'numeric', (col) => col.notNull())
    .addColumn('deviceId', 'text', (col) => col.notNull())
    .addColumn('hash', 'text')
    .addColumn('createdAt', 'numeric', (col) => col.notNull())
    .addColumn('createdByDeviceId', 'text', (col) => col.notNull())
    .addColumn('deletedAt', 'numeric')
    .addColumn('deletedByDeviceId', 'text')
    .execute()

  // Create indexes for better performance
  await db.schema
    .createIndex('paper_library_id_index')
    .on('paper')
    .column('libraryId')
    .execute()

  await db.schema
    .createIndex('paper_author_paper_id_index')
    .on('paperAuthor')
    .column('paperId')
    .execute()

  await db.schema
    .createIndex('paper_author_author_id_index')
    .on('paperAuthor')
    .column('authorId')
    .execute()

  await db.schema
    .createIndex('paper_tag_paper_id_index')
    .on('paperTag')
    .column('paperId')
    .execute()

  await db.schema
    .createIndex('paper_tag_tag_id_index')
    .on('paperTag')
    .column('tagId')
    .execute()

  await db.schema
    .createIndex('paper_folder_paper_id_index')
    .on('paperFolder')
    .column('paperId')
    .execute()

  await db.schema
    .createIndex('paper_folder_folder_id_index')
    .on('paperFolder')
    .column('folderId')
    .execute()

  await db.schema
    .createIndex('folder_library_id_index')
    .on('folder')
    .column('libraryId')
    .execute()

  await db.schema
    .createIndex('folder_parent_id_index')
    .on('folder')
    .column('parentId')
    .execute()

  await db.schema
    .createIndex('supplement_paper_id_index')
    .on('supplement')
    .column('paperId')
    .execute()

  await db.schema
    .createIndex('feed_library_id_index')
    .on('feed')
    .column('libraryId')
    .execute()

  await db.schema
    .createIndex('library_share_library_id_index')
    .on('libraryShare')
    .column('libraryId')
    .execute()

  // Create unique constraints for junction tables
  await db.schema
    .createIndex('paper_author_unique')
    .on('paperAuthor')
    .columns(['paperId', 'authorId'])
    .unique()
    .execute()

  await db.schema
    .createIndex('paper_tag_unique')
    .on('paperTag')
    .columns(['paperId', 'tagId'])
    .unique()
    .execute()

  await db.schema
    .createIndex('paper_folder_unique')
    .on('paperFolder')
    .columns(['paperId', 'folderId'])
    .unique()
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop all tables in reverse order to respect foreign key constraints
  await db.schema.dropTable('paperFieldVersion').execute()
  await db.schema.dropTable('authorFieldVersion').execute()
  await db.schema.dropTable('tagFieldVersion').execute()
  await db.schema.dropTable('folderFieldVersion').execute()
  await db.schema.dropTable('supplementFieldVersion').execute()
  await db.schema.dropTable('libraryFieldVersion').execute()
  await db.schema.dropTable('feedFieldVersion').execute()

  await db.schema.dropTable('paperAuthor').execute()
  await db.schema.dropTable('paperTag').execute()
  await db.schema.dropTable('paperFolder').execute()

  await db.schema.dropTable('supplement').execute()
  await db.schema.dropTable('feed').execute()
  await db.schema.dropTable('libraryShare').execute()
  await db.schema.dropTable('paper').execute()
  await db.schema.dropTable('folder').execute()
  await db.schema.dropTable('tag').execute()
  await db.schema.dropTable('author').execute()
  await db.schema.dropTable('library').execute()
}
