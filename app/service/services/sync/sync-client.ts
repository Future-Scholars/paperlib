import { db } from "@/service/services/database/sqlite/db";
import { z } from 'zod';
import { syncStateStore } from "./states";
import { ensureLibraryId } from "./pollyfills/utils";
import { EntityCreate, EntityDelete, FieldChange, RelationChange, zAttachRequest, zAttachResponse, zPullResponse, zPushRequest, zSyncPushResponse } from "./dto";
import CRDT from "./crdt";
// const syncBaseUrl = new URL("https://coral-app-uijy2.ondigitalocean.app/");
export const SYNC_BASE_URL = "http://localhost:3001/"; // TODO: For testing

async function requestAPI(url: URL, method: string, body: any): Promise<any> {
  const accessToken = syncStateStore.get("accessToken");
  if (!accessToken) {
    throw new Error("Access token is not available for syncing.");
  }
  return await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  }).then(async response => {
    if (!response.ok) {
      console.error("Failed to request API", await response.json());
      throw new Error(response.statusText);
    }
    return await response.json();
  }).catch(error => {
    console.error("Failed to request API", error);
    throw error;
  });
}

export async function attach(library: "main" | "feeds") {
  const apiUrl = new URL(SYNC_BASE_URL);
  apiUrl.pathname = "/api/v1/sync/attach";
  // For now, only main library is supported
  if (library !== "main") {
    throw new Error("Only main library is supported for now");
  }

  const libraryId = await ensureLibraryId(library);
  const deviceId = syncStateStore.get("deviceId");

  const attachRequest: z.infer<typeof zAttachRequest> = {
    library: {
      libraryId: libraryId,
      libraryName: library,
    },
    device: {
      deviceId: deviceId,
    },
  };
  const response: z.infer<typeof zAttachResponse> = await requestAPI(apiUrl, "POST", attachRequest);
  if (response.attached.libraryId !== libraryId) {
    // Update all local library ids to the response library id
    const tx = await db.startTransaction().execute();
    try {
      tx.updateTable("library").set({
        id: response.attached.libraryId,
      }).where("id", "=", libraryId).execute();

      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
}


export async function pull() {
  const apiUrl = new URL(SYNC_BASE_URL);
  apiUrl.pathname = "/api/v1/sync/pull";
  const libraryId = await ensureLibraryId("main");
  const deviceId = syncStateStore.get("deviceId");
  const since = syncStateStore.get("lastSyncAt") || new Date().toISOString();
  apiUrl.searchParams.set("since", since);
  apiUrl.searchParams.set("libraryId", libraryId);
  apiUrl.searchParams.set("deviceId", deviceId);
  const response: z.infer<typeof zPullResponse> = await requestAPI(apiUrl, "GET", undefined);
  if (!response.success) {
    throw new Error(response.message || "Failed to pull");
  }
  const { entityCreates, entityDeletes, fieldsChanges, relationChanges } = response;
  const tx = await db.startTransaction().execute();

  try {
    // Process entity creates
    for (const entityCreate of entityCreates) {
      switch (entityCreate.model) {
        case 'paper':
          await CRDT.lifecycle.paperCreate(tx, entityCreate, libraryId)
          break
        case 'author':
          await CRDT.lifecycle.authorCreate(tx, entityCreate)
          break
        case 'folder':
          await CRDT.lifecycle.folderCreate(tx, entityCreate)
          break
        case 'tag':
          await CRDT.lifecycle.tagCreate(tx, entityCreate)
          break
        case 'supplement':
          await CRDT.lifecycle.supplementCreate(tx, entityCreate)
          break
        case 'feed':
          await CRDT.lifecycle.feedCreate(tx, entityCreate)
          break
        default:
          throw new Error(`Unknown model for the entityCreate ${JSON.stringify(entityCreate)}`)
      }
    }

    // Process entity deletes
    for (const entityDelete of entityDeletes) {
      switch (entityDelete.model) {
        case 'paper':
          await CRDT.lifecycle.paperDelete(tx, entityDelete, libraryId)
          break
        case 'author':
          await CRDT.lifecycle.authorDelete(tx, entityDelete)
          break
        case 'folder':
          await CRDT.lifecycle.folderDelete(tx, entityDelete)
          break
        case 'tag':
          await CRDT.lifecycle.tagDelete(tx, entityDelete)
          break
        case 'supplement':
          await CRDT.lifecycle.supplementDelete(tx, entityDelete)
          break
        case 'feed':
          await CRDT.lifecycle.feedDelete(tx, entityDelete)
          break
        default:
          throw new Error(`Unknown model for the entityDelete ${JSON.stringify(entityDelete)}`)
      }
    }

    // Process field changes
    for (const fieldChange of fieldsChanges) {
      switch (fieldChange.model) {
        case 'paper':
          await CRDT.lww.mergePaperFieldLWW(tx, fieldChange)
          break
        case 'folder':
          await CRDT.lww.mergeFolderFieldLWW(tx, fieldChange)
          break
        case 'author':
          await CRDT.lww.mergeAuthorFieldLWW(tx, fieldChange)
          break
        case 'supplement':
          await CRDT.lww.mergeSupplementFieldLWW(tx, fieldChange)
          break
        case 'tag':
          await CRDT.lww.mergeTagFieldLWW(tx, fieldChange)
          break
        case 'feed':
          await CRDT.lww.mergeFeedFieldLWW(tx, fieldChange)
          break
        default:
          throw new Error(`Unknown model for the fieldChange ${JSON.stringify(fieldChange)}`)
      }
    }

    // Process relation changes
    for (const relationChange of relationChanges) {
      switch (relationChange.model) {
        case 'paperTag':
          await CRDT.orset.mergePaperTagORSet(tx, relationChange)
          break
        case 'paperAuthor':
          await CRDT.orset.mergePaperAuthorORSet(tx, relationChange)
          break
        case 'paperFolder':
          await CRDT.orset.mergePaperFolderORSet(tx, relationChange)
          break
        case 'paperSupplement':
          await CRDT.orset.mergePaperSupplementORSet(tx, relationChange)
          break
        default:
          throw new Error(`Unknown model for the relationChange ${JSON.stringify(relationChange)}`)
      }
    }
    await tx.commit().execute()
  } catch (error) {
    await tx.rollback().execute()
    throw error
  }

}




export async function push() {
  const apiUrl = new URL(SYNC_BASE_URL);
  apiUrl.pathname = "/api/v1/sync/push";
  const libraryId = await ensureLibraryId("main");
  const deviceId = syncStateStore.get("deviceId");
  const since = syncStateStore.get("lastSyncAt") || new Date().getTime();
  const entityCreates: EntityCreate[] = []
  const entityDeletes: EntityDelete[] = []
  const fieldChanges: FieldChange[] = []
  const relationChanges: RelationChange[] = []
  const { paperCreates, paperDeletes, paperFieldChanges } = await pushPapers(libraryId, new Date(since))
  entityCreates.push(...paperCreates)
  entityDeletes.push(...paperDeletes)
  fieldChanges.push(...paperFieldChanges)
  const paperFolderRelationChanges = await pushPaperFolders(new Date(since))
  relationChanges.push(...paperFolderRelationChanges)
  const paperTagRelationChanges = await pushPaperTags(new Date(since))
  relationChanges.push(...paperTagRelationChanges)
  const paperAuthorRelationChanges = await pushPaperAuthors(new Date(since))
  relationChanges.push(...paperAuthorRelationChanges)
  const { authorCreates, authorDeletes, authorFieldChanges } = await pushAuthors(new Date(since))
  entityCreates.push(...authorCreates)
  entityDeletes.push(...authorDeletes)
  fieldChanges.push(...authorFieldChanges)
  const { tagCreates, tagDeletes, tagFieldChanges } = await pushTags(new Date(since))
  entityCreates.push(...tagCreates)
  entityDeletes.push(...tagDeletes)
  fieldChanges.push(...tagFieldChanges)
  const { folderCreates, folderDeletes, folderFieldChanges } = await pushFolders(libraryId, new Date(since))
  entityCreates.push(...folderCreates)
  entityDeletes.push(...folderDeletes)
  fieldChanges.push(...folderFieldChanges)
  const { supplementCreates, supplementDeletes, supplementFieldChanges } = await pushSupplements(new Date(since))
  entityCreates.push(...supplementCreates)
  entityDeletes.push(...supplementDeletes)
  fieldChanges.push(...supplementFieldChanges)
  const { feedCreates, feedDeletes, feedFieldChanges } = await pushFeeds(libraryId, new Date(since))
  entityCreates.push(...feedCreates)
  entityDeletes.push(...feedDeletes)
  fieldChanges.push(...feedFieldChanges)
  const request: z.infer<typeof zPushRequest> = {
    entityCreates,
    entityDeletes,
    fieldsChanges: fieldChanges,
    relationChanges: relationChanges,
    libraryId: libraryId,
    deviceId: deviceId,
  }
  const response: z.infer<typeof zSyncPushResponse> = await requestAPI(apiUrl, "POST", request);
  if (!response.success) {
    throw new Error(response.message || "Failed to push");
  }
  syncStateStore.set("lastSyncAt", new Date().getTime());

}

async function pushPapers(libraryId: string, since?: Date): Promise<{
  paperCreates: (EntityCreate & { model: 'paper', })[],
  paperDeletes: (EntityDelete & { model: 'paper' })[],
  paperFieldChanges: (FieldChange & { model: 'paper' })[],
}> {
  const paperCreates: (EntityCreate & { model: 'paper', })[] = []
  const paperDeletes: (EntityDelete & { model: 'paper' })[] = []
  const paperFieldChanges: (FieldChange & { model: 'paper' })[] = []

  // Build the query with conditional where clauses
  let query = db
    .selectFrom('paper')
    .selectAll()

  if (libraryId) {
    query = query.where('libraryId', '=', libraryId)
  }

  if (since) {
    query = query.where((eb) =>
      eb.or([
        eb('createdAt', '>', since.getTime()),
        eb('updatedAt', '>', since.getTime()),
        eb('deletedAt', '>', since.getTime())
      ])
    )
  }

  const papers = await query.execute()

  for (const paper of papers) {
    // Check newly created
    if (!since || paper.createdAt > since.getTime()) {
      paperCreates.push({
        model: 'paper',
        data: {
          ...paper,
          createdAt: paper.createdAt,
          updatedAt: paper.updatedAt ?? null,
          deletedAt: paper.deletedAt ?? null,
        }
      });
    }
    // Check deleted
    if (paper.deletedAt && (!since || paper.deletedAt > since.getTime())) {
      paperDeletes.push({
        model: 'paper',
        data: {
          ...paper,
          createdAt: paper.createdAt,
          updatedAt: paper.updatedAt ?? null,
          deletedAt: paper.deletedAt ?? null,
        }
      });
    }
    // Check updated
    if (since && paper.updatedAt && paper.updatedAt > since.getTime() && !paper.deletedAt) {
      const fieldVersions = await db
        .selectFrom('paperFieldVersion')
        .selectAll()
        .where('paperId', '=', paper.id)
        .where('createdAt', '>', since.getTime())
        .execute();

      for (const fieldVersion of fieldVersions) {
        paperFieldChanges.push({
          model: 'paper',
          data: {
            ...fieldVersion,
            timestamp: fieldVersion.timestamp,
            createdAt: fieldVersion.createdAt,
            deletedAt: fieldVersion.deletedAt ?? null,
          }
        });
      }
    }
  }
  return {
    paperCreates,
    paperDeletes,
    paperFieldChanges,
  }
}

async function pushPaperFolders(since?: Date): Promise<(RelationChange & { model: 'paperFolder' })[]> {
  const paperFolderRelationChanges: (RelationChange & { model: 'paperFolder' })[] = []

  let query = db
    .selectFrom('paperFolder')
    .selectAll()

  if (since) {
    query = query.where('timestamp', '>', since.getTime())
  }

  const paperFolderEntities = await query.execute()

  for (const paperFolderEntity of paperFolderEntities) {
    paperFolderRelationChanges.push({
      model: 'paperFolder',
      data: {
        ...paperFolderEntity,
        timestamp: paperFolderEntity.timestamp,
      }
    });
  }

  return paperFolderRelationChanges;
}

async function pushPaperTags(since?: Date): Promise<(RelationChange & { model: 'paperTag' })[]> {
  const paperTagRelationChanges: (RelationChange & { model: 'paperTag' })[] = []

  let query = db
    .selectFrom('paperTag')
    .selectAll()

  if (since) {
    query = query.where('timestamp', '>', since.getTime())
  }

  const paperTagEntities = await query.execute()

  for (const paperTagEntity of paperTagEntities) {
    paperTagRelationChanges.push({
      model: 'paperTag',
      data: {
        ...paperTagEntity,
        timestamp: paperTagEntity.timestamp,
      }
    });
  }
  return paperTagRelationChanges;
}

async function pushPaperAuthors(since?: Date): Promise<(RelationChange & { model: 'paperAuthor' })[]> {
  const paperAuthorRelationChanges: (RelationChange & { model: 'paperAuthor' })[] = []

  let query = db
    .selectFrom('paperAuthor')
    .selectAll()

  if (since) {
    query = query.where('timestamp', '>', since.getTime())
  }

  const paperAuthorEntities = await query.execute()

  for (const paperAuthorEntity of paperAuthorEntities) {
    paperAuthorRelationChanges.push({
      model: 'paperAuthor',
      data: {
        ...paperAuthorEntity,
        timestamp: paperAuthorEntity.timestamp,
      }
    });
  }
  return paperAuthorRelationChanges;
}

async function pushAuthors(since?: Date): Promise<{
  authorCreates: (EntityCreate & { model: 'author' })[],
  authorDeletes: (EntityDelete & { model: 'author' })[],
  authorFieldChanges: (FieldChange & { model: 'author' })[],
}> {
  const authorCreates: (EntityCreate & { model: 'author' })[] = []
  const authorDeletes: (EntityDelete & { model: 'author' })[] = []
  const authorFieldChanges: (FieldChange & { model: 'author' })[] = []

  let query = db
    .selectFrom('author')
    .selectAll()

  if (since) {
    query = query.where((eb) =>
      eb.or([
        eb('createdAt', '>', since.getTime()),
        eb('updatedAt', '>', since.getTime()),
        eb('deletedAt', '>', since.getTime())
      ])
    )
  }

  const authorEntities = await query.execute()

  for (const authorEntity of authorEntities) {
    // Check newly created
    if (!since || authorEntity.createdAt > since.getTime()) {
      authorCreates.push({
        model: 'author',
        data: {
          ...authorEntity,
          createdAt: authorEntity.createdAt,
          updatedAt: authorEntity.updatedAt ?? null,
          deletedAt: authorEntity.deletedAt ?? null,
        }
      });
    }
    // Check deleted
    if (authorEntity.deletedAt && (!since || authorEntity.deletedAt > since.getTime())) {
      authorDeletes.push({
        model: 'author',
        data: {
          ...authorEntity,
          createdAt: authorEntity.createdAt,
          updatedAt: authorEntity.updatedAt ?? null,
          deletedAt: authorEntity.deletedAt ?? null,
        }
      });
    }
    // Check updated
    if (since && authorEntity.updatedAt && authorEntity.updatedAt > since.getTime() && !authorEntity.deletedAt) {
      const fieldVersions = await db
        .selectFrom('authorFieldVersion')
        .selectAll()
        .where('authorId', '=', authorEntity.id)
        .where('createdAt', '>', since.getTime())
        .execute();

      for (const fieldVersion of fieldVersions) {
        authorFieldChanges.push({
          model: 'author',
          data: {
            ...fieldVersion,
            timestamp: fieldVersion.timestamp,
            createdAt: fieldVersion.createdAt,
            deletedAt: fieldVersion.deletedAt ?? null,
          }
        });
      }
    }
  }
  return {
    authorCreates,
    authorDeletes,
    authorFieldChanges,
  }
}

async function pushTags(since?: Date): Promise<{
  tagCreates: (EntityCreate & { model: 'tag', })[],
  tagDeletes: (EntityDelete & { model: 'tag' })[],
  tagFieldChanges: (FieldChange & { model: 'tag' })[],
}> {
  const tagCreates: (EntityCreate & { model: 'tag', })[] = []
  const tagDeletes: (EntityDelete & { model: 'tag' })[] = []
  const tagFieldChanges: (FieldChange & { model: 'tag' })[] = []

  let query = db
    .selectFrom('tag')
    .selectAll()

  if (since) {
    query = query.where((eb) =>
      eb.or([
        eb('createdAt', '>', since.getTime()),
        eb('updatedAt', '>', since.getTime()),
        eb('deletedAt', '>', since.getTime())
      ])
    )
  }

  const tags = await query.execute()

  for (const tag of tags) {
    // Check newly created
    if (!since || tag.createdAt > since.getTime()) {
      tagCreates.push({
        model: 'tag',
        data: {
          ...tag,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt ?? null,
          deletedAt: tag.deletedAt ? tag.deletedAt : null,
        }
      });
    }
    // Check deleted
    if (tag.deletedAt && (!since || tag.deletedAt > since.getTime())) {
      tagDeletes.push({
        model: 'tag',
        data: {
          ...tag,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt ?? null,
          deletedAt: tag.deletedAt ?? null,
        }
      });
    }
    // Check updated
    if (since && tag.updatedAt && tag.updatedAt > since.getTime() && !tag.deletedAt) {
      const fieldVersions = await db
        .selectFrom('tagFieldVersion')
        .selectAll()
        .where('tagId', '=', tag.id)
        .where('createdAt', '>', since.getTime())
        .execute();

      for (const fieldVersion of fieldVersions) {
        tagFieldChanges.push({
          model: 'tag',
          data: {
            ...fieldVersion,
            timestamp: fieldVersion.timestamp,
            createdAt: fieldVersion.createdAt,
            deletedAt: fieldVersion.deletedAt ?? null,
          }
        });
      }
    }
  }
  return {
    tagCreates,
    tagDeletes,
    tagFieldChanges,
  }
}

async function pushFolders(libraryId: string, since?: Date): Promise<{
  folderCreates: (EntityCreate & { model: 'folder', })[],
  folderDeletes: (EntityDelete & { model: 'folder' })[],
  folderFieldChanges: (FieldChange & { model: 'folder' })[],
}> {
  const folderCreates: (EntityCreate & { model: 'folder', })[] = []
  const folderDeletes: (EntityDelete & { model: 'folder' })[] = []
  const folderFieldChanges: (FieldChange & { model: 'folder' })[] = []

  let query = db
    .selectFrom('folder')
    .selectAll()
    .where('libraryId', '=', libraryId)




  if (since) {
    query = query.where((eb) =>
      eb.or([
        eb('createdAt', '>', since.getTime()),
        eb('updatedAt', '>', since.getTime()),
        eb('deletedAt', '>', since.getTime())
      ])
    )
  }

  const folders = await query.execute()

  for (const folder of folders) {
    // Check newly created
    if (!since || folder.createdAt > since.getTime()) {
      folderCreates.push({
        model: 'folder',
        data: {
          ...folder,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt ?? null,
          deletedAt: folder.deletedAt ?? null,
        }
      });
    }
    // Check deleted
    if (folder.deletedAt && (!since || folder.deletedAt > since.getTime())) {
      folderDeletes.push({
        model: 'folder',
        data: {
          ...folder,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt ?? null,
          deletedAt: folder.deletedAt ?? null,
        }
      });
    }
    // Check updated
    if (since && folder.updatedAt && folder.updatedAt > since.getTime() && !folder.deletedAt) {
      const fieldVersions = await db
        .selectFrom('folderFieldVersion')
        .selectAll()
        .where('folderId', '=', folder.id)
        .where('createdAt', '>', since.getTime())
        .execute();

      for (const fieldVersion of fieldVersions) {
        folderFieldChanges.push({
          model: 'folder',
          data: {
            ...fieldVersion,
            timestamp: fieldVersion.timestamp,
            createdAt: fieldVersion.createdAt,
            deletedAt: fieldVersion.deletedAt ?? null,
          }
        });
      }
    }
  }
  return {
    folderCreates,
    folderDeletes,
    folderFieldChanges,
  }
}


async function pushSupplements(since?: Date): Promise<
  {
    supplementCreates: (EntityCreate & { model: 'supplement', })[],
    supplementDeletes: (EntityDelete & { model: 'supplement' })[],
    supplementFieldChanges: (FieldChange & { model: 'supplement' })[],
  }> {
  const supplementCreates: (EntityCreate & { model: 'supplement', })[] = []
  const supplementDeletes: (EntityDelete & { model: 'supplement' })[] = []
  const supplementFieldChanges: (FieldChange & { model: 'supplement' })[] = []

  let query = db
    .selectFrom('supplement')
    .selectAll()

  if (since) {
    query = query.where((eb) =>
      eb.or([
        eb('createdAt', '>', since.getTime()),
        eb('updatedAt', '>', since.getTime()),
        eb('deletedAt', '>', since.getTime())
      ])
    )
  }

  const supplements = await query.execute()

  for (const supplement of supplements) {
    // Check newly created
    if (!since || supplement.createdAt > since.getTime()) {
      supplementCreates.push({
        model: 'supplement',
        data: {
          ...supplement,
          createdAt: supplement.createdAt,
          updatedAt: supplement.updatedAt ?? null,
          deletedAt: supplement.deletedAt ?? null,
        }
      });
    }
    // Check deleted
    if (supplement.deletedAt && (!since || supplement.deletedAt > since.getTime())) {
      supplementDeletes.push({
        model: 'supplement',
        data: {
          ...supplement,
          createdAt: supplement.createdAt,
          updatedAt: supplement.updatedAt ?? null,
          deletedAt: supplement.deletedAt ?? null,
        }
      });
    }
    // Check updated
    if (since && supplement.updatedAt && supplement.updatedAt > since.getTime() && !supplement.deletedAt) {
      const fieldVersions = await db
        .selectFrom('supplementFieldVersion')
        .selectAll()
        .where('supplementId', '=', supplement.id)
        .where('createdAt', '>', since.getTime())
        .execute();

      for (const fieldVersion of fieldVersions) {
        supplementFieldChanges.push({
          model: 'supplement',
          data: {
            ...fieldVersion,
            timestamp: fieldVersion.timestamp,
            createdAt: fieldVersion.createdAt,
            deletedAt: fieldVersion.deletedAt ?? null,
          }
        });
      }
    }
  }
  return {
    supplementCreates,
    supplementDeletes,
    supplementFieldChanges,
  }
}

async function pushFeeds(libraryId: string, since?: Date): Promise<{
  feedCreates: (EntityCreate & { model: 'feed', })[],
  feedDeletes: (EntityDelete & { model: 'feed' })[],
  feedFieldChanges: (FieldChange & { model: 'feed' })[],
}> {
  const feedCreates: (EntityCreate & { model: 'feed', })[] = []
  const feedDeletes: (EntityDelete & { model: 'feed' })[] = []
  const feedFieldChanges: (FieldChange & { model: 'feed' })[] = []

  let query = db
    .selectFrom('feed')
    .selectAll()
    .where('libraryId', '=', libraryId)

  if (since) {
    query = query.where((eb) =>
      eb.or([
        eb('createdAt', '>', since.getTime()),
        eb('updatedAt', '>', since.getTime()),
        eb('deletedAt', '>', since.getTime())
      ])
    )
  }

  const feeds = await query.execute()

  for (const feed of feeds) {
    // Check newly created
    if (!since || feed.createdAt > since.getTime()) {
      feedCreates.push({
        model: 'feed',
        data: {
          ...feed,
          createdAt: feed.createdAt,
          updatedAt: feed.updatedAt ?? null,
          deletedAt: feed.deletedAt ?? null,
        }
      });
    }
    // Check deleted
    if (feed.deletedAt && (!since || feed.deletedAt > since.getTime())) {
      feedDeletes.push({
        model: 'feed',
        data: {
          ...feed,
          createdAt: feed.createdAt,
          updatedAt: feed.updatedAt ?? null,
          deletedAt: feed.deletedAt ?? null,
        }
      });
    }
    // Check updated
    if (since && feed.updatedAt && feed.updatedAt > since.getTime() && !feed.deletedAt) {
      const fieldVersions = await db
        .selectFrom('feedFieldVersion')
        .selectAll()
        .where('feedId', '=', feed.id)
        .where('createdAt', '>', since.getTime())
        .execute();

      for (const fieldVersion of fieldVersions) {
        feedFieldChanges.push({
          model: 'feed',
          data: {
            ...fieldVersion,
            timestamp: fieldVersion.timestamp,
            createdAt: fieldVersion.createdAt,
            deletedAt: fieldVersion.deletedAt ?? null,
          }
        });
      }
    }
  }
  return {
    feedCreates,
    feedDeletes,
    feedFieldChanges,
  }
}
