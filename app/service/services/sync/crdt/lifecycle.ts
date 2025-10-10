import { type Transaction } from '@/service/services/database/sqlite/db'
import type { EntityCreate, EntityDelete } from '@/service/services/sync/dto'
import {
  paperFields,
  authorFields,
  folderFields,
  tagFields,
  supplementFields,
  feedFields,
  Paper as SqlitePaper,
  Author as SqliteAuthor,
  Folder as SqliteFolder,
  Tag as SqliteTag,
  Supplement as SqliteSupplement,
  Feed as SqliteFeed,
} from '@/service/services/database/sqlite/models'

/**
 * Create a new paper
 * @param tx The Kysely transaction client
 * @param entityCreate EntityCreate object with model "paper"
 * @param libraryId The library ID where the paper belongs
 * @returns Created sqlite paper object
 */
export async function paperCreate(
  tx: Transaction,
  entityCreate: EntityCreate & { model: "paper" },
  libraryId: string
): Promise<SqlitePaper> {
  // Check if the paper exists
  const existingArray = await tx
    .selectFrom('paper')
    .selectAll()
    .where('id', '=', entityCreate.data.id)
    .where('libraryId', '=', libraryId)
    .where('deletedAt', 'is', null)
    .execute()
  if (existingArray.length > 1) {
    throw new Error(`Multiple papers found for id ${entityCreate.data.id}`)
  }
  const existing = existingArray[0]

  if (existing) {
    return existing
  }

  // Create the paper
  await tx
    .insertInto('paper')
    .values({
      id: entityCreate.data.id,
      libraryId: entityCreate.data.libraryId,
      type: entityCreate.data.type,
      title: entityCreate.data.title,
      abstract: entityCreate.data.abstract,
      journal: entityCreate.data.journal,
      booktitle: entityCreate.data.booktitle,
      year: entityCreate.data.year,
      month: entityCreate.data.month,
      volume: entityCreate.data.volume,
      number: entityCreate.data.number,
      pages: entityCreate.data.pages,
      publisher: entityCreate.data.publisher,
      series: entityCreate.data.series,
      edition: entityCreate.data.edition,
      editor: entityCreate.data.editor,
      howPublished: entityCreate.data.howPublished,
      organization: entityCreate.data.organization,
      school: entityCreate.data.school,
      institution: entityCreate.data.institution,
      address: entityCreate.data.address,
      doi: entityCreate.data.doi,
      arxiv: entityCreate.data.arxiv,
      isbn: entityCreate.data.isbn,
      issn: entityCreate.data.issn,
      notes: entityCreate.data.notes,
      flag: entityCreate.data.flag ? 1 : 0,
      rating: entityCreate.data.rating,
      read: entityCreate.data.read ? 1 : 0,
      feedId: entityCreate.data.feedId,
      feedItemId: entityCreate.data.feedItemId,
      createdAt: new Date(entityCreate.data.createdAt).getTime(),
      createdByDeviceId: entityCreate.data.createdByDeviceId,
      updatedAt: entityCreate.data.updatedAt ? new Date(entityCreate.data.updatedAt).getTime() : null,
      updatedByDeviceId: entityCreate.data.updatedByDeviceId,
      deletedAt: entityCreate.data.deletedAt ? new Date(entityCreate.data.deletedAt).getTime() : null,
      deletedByDeviceId: entityCreate.data.deletedByDeviceId || null,
    })
    .execute()

  // Also create the initial field versions
  for (const field of paperFields) {
    if (paperFields.includes(field)) {
      await tx
        .insertInto('paperFieldVersion')
        .values({
          id: crypto.randomUUID(),
          paperId: entityCreate.data.id,
          field,
          value: JSON.stringify((entityCreate.data as any)[field]) || null,
          timestamp: new Date(entityCreate.data.createdAt).getTime(),
          deviceId: entityCreate.data.createdByDeviceId,
          hash: null,
          createdAt: new Date(entityCreate.data.createdAt).getTime(),
          createdByDeviceId: entityCreate.data.createdByDeviceId,
          deletedAt: null,
          deletedByDeviceId: null,
        })
        .execute()
    }
  }
  const created = await tx
    .selectFrom('paper')
    .selectAll()
    .where('id', '=', entityCreate.data.id)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create paper ${entityCreate.data.id}`)
  }
  return created
}

/**
 * Delete a paper
 * @param tx The Kysely transaction client
 * @param entityDelete EntityDelete object with model "paper"
 * @param libraryId The library ID where the paper belongs
 * @returns True if the paper was deleted, false if it does not exist or was already deleted
 */
export async function paperDelete(
  tx: Transaction,
  entityDelete: EntityDelete & { model: "paper" },
  libraryId: string
): Promise<SqlitePaper | null> {
  // Check if the paper exists
  const existingArray = await tx
    .selectFrom('paper')
    .selectAll()
    .where('id', '=', entityDelete.data.id)
    .where('libraryId', '=', libraryId)
    .where('deletedAt', 'is', null)
    .execute()
  if (existingArray.length > 1) {
    throw new Error(`Multiple papers found for id ${entityDelete.data.id}`)
  }
  const existing = existingArray[0]
  if (!existing) return null

  // If the paper is already deleted, we can skip the delete operation
  if (existing.deletedAt) return existing

  // Soft delete the paper
  await tx
    .updateTable('paper')
    .set({
      deletedAt: entityDelete.data.deletedAt ? new Date(entityDelete.data.deletedAt).getTime() : new Date().getTime(),
      deletedByDeviceId: entityDelete.data.deletedByDeviceId
    })
    .where('id', '=', entityDelete.data.id)
    .where('libraryId', '=', libraryId)
    .execute()

  // Also delete all field versions of this paper
  await tx
    .updateTable('paperFieldVersion')
    .set({
      deletedAt: new Date().getTime(),
      deletedByDeviceId: entityDelete.data.deletedByDeviceId
    })
    .where('paperId', '=', entityDelete.data.id)
    .execute()

  return existing
}

/**
 * Create a new author
 * @param tx The Kysely transaction client
 * @param entityCreate EntityCreate object with model "author"
 * @returns Created sqlite author object
 */
export async function authorCreate(
  tx: Transaction,
  entityCreate: EntityCreate & { model: "author" },
): Promise<SqliteAuthor> {
  // Check if the author exists
  const existingArray = await tx
    .selectFrom('author')
    .selectAll()
    .where('id', '=', entityCreate.data.id)
    .where('deletedAt', 'is', null)
    .execute()
  if (existingArray.length > 1) {
    throw new Error(`Multiple authors found for id ${entityCreate.data.id}`)
  }
  const existing = existingArray[0]
  if (existing) {
    return existing
  }

  // Create the author
  await tx
    .insertInto('author')
    .values({
      id: entityCreate.data.id,
      name: entityCreate.data.name,
      affiliation: entityCreate.data.affiliation,
      email: entityCreate.data.email,
      orcid: entityCreate.data.orcid,
      firstName: entityCreate.data.firstName,
      lastName: entityCreate.data.lastName,
      createdAt: new Date(entityCreate.data.createdAt).getTime(),
      createdByDeviceId: entityCreate.data.createdByDeviceId,
      updatedAt: entityCreate.data.updatedAt ? new Date(entityCreate.data.updatedAt).getTime() : null,
      updatedByDeviceId: entityCreate.data.updatedByDeviceId,
      deletedAt: entityCreate.data.deletedAt ? new Date(entityCreate.data.deletedAt).getTime() : null,
      deletedByDeviceId: entityCreate.data.deletedByDeviceId,
    })
    .execute()

  // Also create the initial field versions
  for (const field of authorFields) {
    if (authorFields.includes(field)) {
      await tx
        .insertInto('authorFieldVersion')
        .values({
          id: crypto.randomUUID(),
          authorId: entityCreate.data.id,
          field,
          value: (entityCreate.data as any)[field] || null,
          timestamp: new Date(entityCreate.data.createdAt).getTime(),
          deviceId: entityCreate.data.createdByDeviceId,
          createdAt: new Date(entityCreate.data.createdAt).getTime(),
          createdByDeviceId: entityCreate.data.createdByDeviceId,
          deletedAt: null,
          deletedByDeviceId: null,
        })
        .execute()
    }
  }
  const created = await tx
    .selectFrom('author')
    .selectAll()
    .where('id', '=', entityCreate.data.id)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create author ${entityCreate.data.id}`)
  }
  return created
}

/**
 * Delete an author
 * @param tx The Kysely transaction client
 * @param entityDelete EntityDelete object with model "author"
 * @returns True if the author was deleted, false if it does not exist or was already deleted
 */
export async function authorDelete(
  tx: Transaction,
  entityDelete: EntityDelete & { model: "author" },
): Promise<SqliteAuthor | null> {
  // Check if the author exists
  const existingArray = await tx
    .selectFrom('author')
    .selectAll()
    .where('id', '=', entityDelete.data.id)
    .where('deletedAt', 'is', null)
    .execute()

  if (existingArray.length > 1) {
    throw new Error(`Multiple authors found for id ${entityDelete.data.id}`)
  }
  const existing = existingArray[0]
  if (!existing) return null

  // If the author is already deleted, we can skip the delete operation
  if (existing.deletedAt) return existing

  // Soft delete the author
  await tx
    .updateTable('author')
    .set({
      deletedAt: entityDelete.data.deletedAt ? new Date(entityDelete.data.deletedAt).getTime() : new Date().getTime(),
      deletedByDeviceId: entityDelete.data.deletedByDeviceId
    })
    .where('id', '=', entityDelete.data.id)
    .execute()

  // Also delete all field versions of this author
  await tx
    .updateTable('authorFieldVersion')
    .set({
      deletedAt: new Date().getTime(),
      deletedByDeviceId: entityDelete.data.deletedByDeviceId
    })
    .where('authorId', '=', entityDelete.data.id)
    .execute()

  return existing
}

/**
 * Create a new folder
 * @param tx The Kysely transaction client
 * @param entityCreate EntityCreate object with model "folder"
 * @returns Created sqlite folder object
 */
export async function folderCreate(
  tx: Transaction,
  entityCreate: EntityCreate & { model: "folder" },
): Promise<SqliteFolder> {
  // Check if the folder exists
  const existingArray = await tx
    .selectFrom('folder')
    .selectAll()
    .where('id', '=', entityCreate.data.id)
    .where('deletedAt', 'is', null)
    .execute()
  if (existingArray.length > 1) {
    throw new Error(`Multiple folders found for id ${entityCreate.data.id}`)
  }
  const existing = existingArray[0]
  if (existing) {
    return existing
  }

  // Create the folder
  await tx
    .insertInto('folder')
    .values({
      id: entityCreate.data.id,
      name: entityCreate.data.name,
      description: entityCreate.data.description,
      colour: entityCreate.data.colour,
      parentId: entityCreate.data.parentId,
      libraryId: entityCreate.data.libraryId,
      createdAt: new Date(entityCreate.data.createdAt).getTime(),
      createdByDeviceId: entityCreate.data.createdByDeviceId,
      updatedAt: entityCreate.data.updatedAt ? new Date(entityCreate.data.updatedAt).getTime() : null,
      updatedByDeviceId: entityCreate.data.updatedByDeviceId,
      deletedAt: entityCreate.data.deletedAt ? new Date(entityCreate.data.deletedAt).getTime() : null,
      deletedByDeviceId: entityCreate.data.deletedByDeviceId,
    })
    .execute()

  // Also create the initial field versions
  for (const field of folderFields) {
    if (folderFields.includes(field)) {
      await tx
        .insertInto('folderFieldVersion')
        .values({
          id: crypto.randomUUID(),
          folderId: entityCreate.data.id,
          field,
          value: (entityCreate.data as any)[field] || null,
          timestamp: new Date(entityCreate.data.createdAt).getTime(),
          deviceId: entityCreate.data.createdByDeviceId,
          createdAt: new Date(entityCreate.data.createdAt).getTime(),
          createdByDeviceId: entityCreate.data.createdByDeviceId,
          deletedAt: null,
          deletedByDeviceId: null,
        })
        .execute()
    }
  }
  const created = await tx
    .selectFrom('folder')
    .selectAll()
    .where('id', '=', entityCreate.data.id)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create folder ${entityCreate.data.id}`)
  }
  return created
}

/**
 * Delete a folder
 * @param tx The Kysely transaction client
 * @param entityDelete EntityDelete object with model "folder"
 * @returns True if the folder was deleted, false if it does not exist or was already deleted
 */
export async function folderDelete(
  tx: Transaction,
  entityDelete: EntityDelete & { model: "folder" },
): Promise<SqliteFolder | null> {
  // Check if the folder exists
  const existingArray = await tx
    .selectFrom('folder')
    .selectAll()
    .where('id', '=', entityDelete.data.id)
    .where('deletedAt', 'is', null)
    .execute()

  if (existingArray.length > 1) {
    throw new Error(`Multiple folders found for id ${entityDelete.data.id}`)
  }
  const existing = existingArray[0]
  if (!existing) return null

  // If the folder is already deleted, we can skip the delete operation
  if (existing.deletedAt) return existing

  // Soft delete the folder
  await tx
    .updateTable('folder')
    .set({
      deletedAt: entityDelete.data.deletedAt ? new Date(entityDelete.data.deletedAt).getTime() : new Date().getTime(),
      deletedByDeviceId: entityDelete.data.deletedByDeviceId
    })
    .where('id', '=', entityDelete.data.id)
    .execute()

  // Also delete all field versions of this folder
  await tx
    .updateTable('folderFieldVersion')
    .set({
      deletedAt: new Date().getTime(),
      deletedByDeviceId: entityDelete.data.deletedByDeviceId
    })
    .where('folderId', '=', entityDelete.data.id)
    .execute()

  return existing
}

/**
 * Create a new tag
 * @param tx The Kysely transaction client
 * @param entityCreate EntityCreate object with model "tag"
 * @returns Created sqlite tag object
 */
export async function tagCreate(
  tx: Transaction,
  entityCreate: EntityCreate & { model: "tag" },
): Promise<SqliteTag> {
  // Check if the tag exists
  const existingArray = await tx
    .selectFrom('tag')
    .selectAll()
    .where('id', '=', entityCreate.data.id)
    .where('deletedAt', 'is', null)
    .execute()

  if (existingArray.length > 1) {
    throw new Error(`Multiple tags found for id ${entityCreate.data.id}`)
  }
  const existing = existingArray[0]
  if (existing) {
    return existing
  }

  // Create the tag
  await tx
    .insertInto('tag')
    .values({
      id: entityCreate.data.id,
      name: entityCreate.data.name,
      description: entityCreate.data.description,
      colour: entityCreate.data.colour,
      createdAt: new Date(entityCreate.data.createdAt).getTime(),
      createdByDeviceId: entityCreate.data.createdByDeviceId,
      updatedAt: entityCreate.data.updatedAt ? new Date(entityCreate.data.updatedAt).getTime() : null,
      updatedByDeviceId: entityCreate.data.updatedByDeviceId,
      deletedAt: entityCreate.data.deletedAt ? new Date(entityCreate.data.deletedAt).getTime() : null,
      deletedByDeviceId: entityCreate.data.deletedByDeviceId,
    })
    .execute()

  // Also create the initial field versions
  for (const field of tagFields) {
    if (tagFields.includes(field)) {
      await tx
        .insertInto('tagFieldVersion')
        .values({
          id: crypto.randomUUID(),
          tagId: entityCreate.data.id,
          field,
          value: (entityCreate.data as any)[field] || null,
          timestamp: new Date(entityCreate.data.createdAt).getTime(),
          deviceId: entityCreate.data.createdByDeviceId,
          createdAt: new Date(entityCreate.data.createdAt).getTime(),
          createdByDeviceId: entityCreate.data.createdByDeviceId,
          deletedAt: null,
          deletedByDeviceId: null,
        })
        .execute()
    }
  }
  const created = await tx
    .selectFrom('tag')
    .selectAll()
    .where('id', '=', entityCreate.data.id)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create tag ${entityCreate.data.id}`)
  }
  return created
}

/**
 * Delete a tag
 * @param tx The Kysely transaction client
 * @param entityDelete EntityDelete object with model "tag"
 * @returns True if the tag was deleted, false if it does not exist or was already deleted
 */
export async function tagDelete(
  tx: Transaction,
  entityDelete: EntityDelete & { model: "tag" },
): Promise<SqliteTag | null> {
  // Check if the tag exists
  const existingArray = await tx
    .selectFrom('tag')
    .selectAll()
    .where('id', '=', entityDelete.data.id)
    .where('deletedAt', 'is', null)
    .execute()
  if (existingArray.length > 1) {
    throw new Error(`Multiple tags found for id ${entityDelete.data.id}`)
  }
  const existing = existingArray[0]

  if (!existing) return null

  // If the tag is already deleted, we can skip the delete operation
  if (existing.deletedAt) return existing

  // Soft delete the tag
  await tx
    .updateTable('tag')
    .set({
      deletedAt: entityDelete.data.deletedAt ? new Date(entityDelete.data.deletedAt).getTime() : new Date().getTime(),
      deletedByDeviceId: entityDelete.data.deletedByDeviceId
    })
    .where('id', '=', entityDelete.data.id)
    .execute()

  // Also delete all field versions of this tag
  await tx
    .updateTable('tagFieldVersion')
    .set({
      deletedAt: new Date().getTime(),
      deletedByDeviceId: entityDelete.data.deletedByDeviceId
    })
    .where('tagId', '=', entityDelete.data.id)
    .execute()

  return existing
}

/**
 * Create a new supplement
 * @param tx The Kysely transaction client
 * @param entityCreate EntityCreate object with model "supplement"
 * @returns Created sqlite supplement object
 */
export async function supplementCreate(
  tx: Transaction,
  entityCreate: EntityCreate & { model: "supplement" },
): Promise<SqliteSupplement> {
  // Check if the supplement exists
  const existingArray = await tx
    .selectFrom('supplement')
    .selectAll()
    .where('id', '=', entityCreate.data.id)
    .where('deletedAt', 'is', null)
    .execute()
  if (existingArray.length > 1) {
    throw new Error(`Multiple supplements found for id ${entityCreate.data.id}`)
  }
  const existing = existingArray[0]

  if (existing) {
    return existing
  }

  // Create the supplement
  await tx
    .insertInto('supplement')
    .values({
      id: entityCreate.data.id,
      paperId: entityCreate.data.paperId,
      name: entityCreate.data.name,
      value: entityCreate.data.value,
      type: entityCreate.data.type,
      description: entityCreate.data.description,
      createdAt: new Date(entityCreate.data.createdAt).getTime(),
      createdByDeviceId: entityCreate.data.createdByDeviceId,
      updatedAt: entityCreate.data.updatedAt ? new Date(entityCreate.data.updatedAt).getTime() : null,
      updatedByDeviceId: entityCreate.data.updatedByDeviceId,
      deletedAt: entityCreate.data.deletedAt ? new Date(entityCreate.data.deletedAt).getTime() : null,
      deletedByDeviceId: entityCreate.data.deletedByDeviceId,
    })
    .execute()

  // Also create the initial field versions
  for (const field of supplementFields) {
    if (supplementFields.includes(field)) {
      await tx
        .insertInto('supplementFieldVersion')
        .values({
          id: crypto.randomUUID(),
          supplementId: entityCreate.data.id,
          field,
          value: (entityCreate.data as any)[field] || null,
          timestamp: new Date(entityCreate.data.createdAt).getTime(),
          deviceId: entityCreate.data.createdByDeviceId,
          createdAt: new Date(entityCreate.data.createdAt).getTime(),
          createdByDeviceId: entityCreate.data.createdByDeviceId,
          deletedAt: null,
          deletedByDeviceId: null,
        })
        .execute()
    }
  }
  const created = await tx
    .selectFrom('supplement')
    .selectAll()
    .where('id', '=', entityCreate.data.id)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create supplement ${entityCreate.data.id}`)
  }
  return created
}

/**
 * Delete a supplement
 * @param tx The Kysely transaction client
 * @param entityDelete EntityDelete object with model "supplement"
 * @returns True if the supplement was deleted, false if it does not exist or was already deleted
 */
export async function supplementDelete(
  tx: Transaction,
  entityDelete: EntityDelete & { model: "supplement" },
): Promise<SqliteSupplement | null> {
  // Check if the supplement exists
  const existingArray = await tx
    .selectFrom('supplement')
    .selectAll()
    .where('id', '=', entityDelete.data.id)
    .execute()
  if (existingArray.length > 1) {
    throw new Error(`Multiple supplements found for id ${entityDelete.data.id}`)
  }
  const existing = existingArray[0]

  if (!existing) return null

  // If the supplement is already deleted, we can skip the delete operation
  if (existing.deletedAt) return existing

  // Soft delete the supplement
  await tx
    .updateTable('supplement')
    .set({
      deletedAt: entityDelete.data.deletedAt ? new Date(entityDelete.data.deletedAt).getTime() : new Date().getTime(),
      deletedByDeviceId: entityDelete.data.deletedByDeviceId
    })
    .where('id', '=', entityDelete.data.id)
    .execute()

  // Also delete all field versions of this supplement
  await tx
    .updateTable('supplementFieldVersion')
    .set({
      deletedAt: new Date().getTime(),
      deletedByDeviceId: entityDelete.data.deletedByDeviceId
    })
    .where('supplementId', '=', entityDelete.data.id)
    .execute()

  return existing
}

/**
 * Create a new feed
 * @param tx The Kysely transaction client
 * @param entityCreate EntityCreate object with model "feed"
 * @returns Created sqlite feed object
 */
export async function feedCreate(
  tx: Transaction,
  entityCreate: EntityCreate & { model: "feed" },
): Promise<SqliteFeed> {
  // Check if the feed exists
  const existingArray = await tx
    .selectFrom('feed')
    .selectAll()
    .where('id', '=', entityCreate.data.id)
    .execute()
  if (existingArray.length > 1) {
    throw new Error(`Multiple feeds found for id ${entityCreate.data.id}`)
  }
  const existing = existingArray[0]

  if (existing) {
    return existing
  }

  // Create the feed
  await tx
    .insertInto('feed')
    .values({
      id: entityCreate.data.id,
      name: entityCreate.data.name,
      description: entityCreate.data.description,
      libraryId: entityCreate.data.libraryId,
      type: entityCreate.data.type,
      url: entityCreate.data.url,
      count: entityCreate.data.count,
      colour: entityCreate.data.colour,
      createdAt: new Date(entityCreate.data.createdAt).getTime(),
      createdByDeviceId: entityCreate.data.createdByDeviceId,
      updatedAt: entityCreate.data.updatedAt ? new Date(entityCreate.data.updatedAt).getTime() : null,
      updatedByDeviceId: entityCreate.data.updatedByDeviceId,
      deletedAt: entityCreate.data.deletedAt ? new Date(entityCreate.data.deletedAt).getTime() : null,
      deletedByDeviceId: entityCreate.data.deletedByDeviceId,
    })
    .execute()

  // Also create the initial field versions
  for (const field of feedFields) {
    if (feedFields.includes(field)) {
      await tx
        .insertInto('feedFieldVersion')
        .values({
          id: crypto.randomUUID(),
          feedId: entityCreate.data.id,
          field,
          value: JSON.stringify(entityCreate.data[field as keyof typeof entityCreate.data]) || null,
          timestamp: new Date(entityCreate.data.createdAt).getTime(),
          deviceId: entityCreate.data.createdByDeviceId,
          hash: null,
          createdAt: new Date(entityCreate.data.createdAt).getTime(),
          createdByDeviceId: entityCreate.data.createdByDeviceId,
          deletedAt: null,
          deletedByDeviceId: null,
        })
        .execute()
    }
  }
  const created = await tx
    .selectFrom('feed')
    .selectAll()
    .where('id', '=', entityCreate.data.id)
    .executeTakeFirst()
  if (!created) {
    throw new Error(`Failed to create feed ${entityCreate.data.id}`)
  }
  return created
}

/**
 * Delete a feed
 * @param tx The Kysely transaction client
 * @param entityDelete EntityDelete object with model "feed"
 * @returns True if the feed was deleted, false if it does not exist or was already deleted
 */
export async function feedDelete(
  tx: Transaction,
  entityDelete: EntityDelete & { model: "feed" },
): Promise<SqliteFeed | null> {
  // Check if the feed exists
  const existingArray = await tx
    .selectFrom('feed')
    .selectAll()
    .where('id', '=', entityDelete.data.id)
    .execute()
  if (existingArray.length > 1) {
    throw new Error(`Multiple feeds found for id ${entityDelete.data.id}`)
  }
  const existing = existingArray[0]

  if (!existing) return null

  // If the feed is already deleted, we can skip the delete operation
  if (existing.deletedAt) return existing

  // Soft delete the feed
  await tx
    .updateTable('feed')
    .set({
      deletedAt: entityDelete.data.deletedAt ? new Date(entityDelete.data.deletedAt).getTime() : new Date().getTime(),
      deletedByDeviceId: entityDelete.data.deletedByDeviceId
    })
    .where('id', '=', entityDelete.data.id)
    .execute()

  // Also delete all field versions of this feed
  await tx
    .updateTable('feedFieldVersion')
    .set({
      deletedAt: new Date().getTime(),
      deletedByDeviceId: entityDelete.data.deletedByDeviceId
    })
    .where('feedId', '=', entityDelete.data.id)
    .execute()

  return existing
}
