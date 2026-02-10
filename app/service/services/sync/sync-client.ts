import { LogService } from "@/common/services/log-service";
import { db, type Transaction } from "@/service/services/database/sqlite/db";
import {
  ChangeRecord,
  zAttachResponse,
  zPullResponse,
  zPushResponse,
  zAuthorFieldVersion,
  zFeedFieldVersion,
  zFolderFieldVersion,
  zPaperAuthor,
  zPaperFieldVersion,
  zPaperFolder,
  zPaperSupplement,
  zPaperTag,
  zSupplementFieldVersion,
  zTagFieldVersion,
  type AttachRequest,
  type ContinuationToken,
  type PushRequest,
} from "./dto";
import { zChangeStreamRow } from "@/service/services/database/sqlite/models";
import { ensureLibraryId } from "./pollyfills/utils";
import {
  applyAuthorFieldVersions,
  applyFeedFieldVersions,
  applyFolderFieldVersions,
  applyPaperFieldVersions,
  applySupplementFieldVersions,
  applyTagFieldVersions,
} from "./pollyfills/entities";
import {
  applyPaperAuthorOrSet,
  applyPaperFolderOrSet,
  applyPaperSupplementOrSet,
  applyPaperTagOrSet,
} from "./pollyfills/relationship";
import { syncStateStore } from "./states";

// export const SYNC_BASE_URL = "http://localhost:3001/"; // TODO: For testing
export const SYNC_BASE_URL = "https://dev.sync.paperlib.app/"; // TODO: For development
// export const SYNC_BASE_URL = "https://sync.paperlib.app/"; // TODO: For production

async function requestAPI(
  url: URL,
  method: string,
  body: any,
  logger?: LogService
): Promise<any> {
  const accessToken = syncStateStore.get("accessToken");
  if (!accessToken) {
    throw new Error("Access token is not available for syncing.");
  }

  // Log request details
  if (logger) {
    logger.info(
      `[SyncClient] HTTP ${method} Request`,
      `URL: ${url.toString()}`,
      false,
      "SyncClient"
    );
    if (body) {
      logger.info(
        `[SyncClient] Request Body`,
        JSON.stringify(body, null, 2),
        false,
        "SyncClient"
      );
    }
  }

  return await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
    .then(async (response) => {
      // Log response status
      if (logger) {
        logger.info(
          `[SyncClient] HTTP Response Status`,
          `${response.status} ${response.statusText}`,
          false,
          "SyncClient"
        );
      }

      if (!response.ok) {
        const errorBody = await response.json();
        if (logger) {
          logger.error(
            `[SyncClient] HTTP Error Response Body`,
            JSON.stringify(errorBody, null, 2),
            false,
            "SyncClient"
          );
        }
        throw new Error(response.statusText);
      }

      const responseBody = await response.json();
      // Log response body
      if (logger) {
        logger.info(
          `[SyncClient] HTTP Response Body`,
          JSON.stringify(responseBody, null, 2),
          false,
          "SyncClient"
        );
      }
      return responseBody;
    })
    .catch((error) => {
      if (logger) {
        logger.error(
          `[SyncClient] HTTP Request Failed`,
          error,
          false,
          "SyncClient"
        );
      }
      throw error;
    });
}

type AffectedForProjection = {
  affectedPaperFields: {
    libraryId: string;
    paperId: string;
    field: (typeof zPaperFieldVersion.shape.field)["_type"];
  }[];
  affectedAuthorFields: {
    libraryId: string;
    authorId: string;
    field: (typeof zAuthorFieldVersion.shape.field)["_type"];
  }[];
  affectedTagFields: {
    libraryId: string;
    tagId: string;
    field: (typeof zTagFieldVersion.shape.field)["_type"];
  }[];
  affectedFolderFields: {
    libraryId: string;
    folderId: string;
    field: (typeof zFolderFieldVersion.shape.field)["_type"];
  }[];
  affectedSupplementFields: {
    libraryId: string;
    supplementId: string;
    field: (typeof zSupplementFieldVersion.shape.field)["_type"];
  }[];
  affectedFeedFields: {
    libraryId: string;
    feedId: string;
    field: (typeof zFeedFieldVersion.shape.field)["_type"];
  }[];
  affectedPaperAuthorKeys: { libraryId: string; paperId: string; authorId: string }[];
  affectedPaperTagKeys: { libraryId: string; paperId: string; tagId: string }[];
  affectedPaperFolderKeys: {
    libraryId: string;
    paperId: string;
    folderId: string;
  }[];
  affectedPaperSupplementKeys: {
    libraryId: string;
    paperId: string;
    supplementId: string;
  }[];
};

/**
 * Writes change records (field_version and or_set) into the database within
 * the given transaction. Returns the affected keys for projection (entity and
 * OR-set). Used by pull() and by unit tests.
 */

async function writeChangeRecordsToDb(
  tx: Transaction,
  changeRecords: ChangeRecord[],
  localInsertedAt: number,
): Promise<AffectedForProjection> {
  const fieldChanges = changeRecords.filter(
    (record) => record.type === "field_version",
  );
  const relationChanges = changeRecords.filter(
    (record) => record.type === "or_set",
  );

  const affectedPaperFields: AffectedForProjection["affectedPaperFields"] = [];
  const affectedAuthorFields: AffectedForProjection["affectedAuthorFields"] = [];
  const affectedTagFields: AffectedForProjection["affectedTagFields"] = [];
  const affectedFolderFields: AffectedForProjection["affectedFolderFields"] = [];
  const affectedSupplementFields: AffectedForProjection["affectedSupplementFields"] = [];
  const affectedFeedFields: AffectedForProjection["affectedFeedFields"] = [];
  const affectedPaperAuthorKeys: AffectedForProjection["affectedPaperAuthorKeys"] = [];
  const affectedPaperTagKeys: AffectedForProjection["affectedPaperTagKeys"] = [];
  const affectedPaperFolderKeys: AffectedForProjection["affectedPaperFolderKeys"] = [];
  const affectedPaperSupplementKeys: AffectedForProjection["affectedPaperSupplementKeys"] = [];

  for (const fieldChange of fieldChanges) {
    switch (fieldChange.model) {
      case "paper": {
        const data = zPaperFieldVersion.parse(fieldChange.data);
        await tx
          .insertInto("paperFieldVersion")
          .values({
            id: data.id,
            createdAt: new Date(data.createdAt).getTime(),
            createdByDeviceId: data.createdByDeviceId,
            deletedAt: data.deletedAt ? new Date(data.deletedAt).getTime() : null,
            deletedByDeviceId: data.deletedByDeviceId,
            libraryId: data.libraryId,
            value: data.value,
            hash: data.hash,
            timestamp: new Date(data.timestamp).getTime(),
            deviceId: data.deviceId,
            localInsertedAt,
            field: data.field,
            paperId: data.paperId,
          })
          .execute();
        affectedPaperFields.push({
          libraryId: data.libraryId,
          paperId: data.paperId,
          field: data.field,
        });
        break;
      }
      case "author": {
        const data = zAuthorFieldVersion.parse(fieldChange.data);
        await tx
          .insertInto("authorFieldVersion")
          .values({
            id: data.id,
            createdAt: new Date(data.createdAt).getTime(),
            createdByDeviceId: data.createdByDeviceId,
            deletedAt: data.deletedAt ? new Date(data.deletedAt).getTime() : null,
            deletedByDeviceId: data.deletedByDeviceId,
            libraryId: data.libraryId,
            value: data.value,
            hash: data.hash,
            timestamp: new Date(data.timestamp).getTime(),
            deviceId: data.deviceId,
            localInsertedAt,
            field: data.field,
            authorId: data.authorId,
          })
          .execute();
        affectedAuthorFields.push({
          libraryId: data.libraryId,
          authorId: data.authorId,
          field: data.field,
        });
        break;
      }
      case "tag": {
        const data = zTagFieldVersion.parse(fieldChange.data);
        await tx
          .insertInto("tagFieldVersion")
          .values({
            id: data.id,
            createdAt: new Date(data.createdAt).getTime(),
            createdByDeviceId: data.createdByDeviceId,
            deletedAt: data.deletedAt ? new Date(data.deletedAt).getTime() : null,
            deletedByDeviceId: data.deletedByDeviceId,
            libraryId: data.libraryId,
            value: data.value,
            hash: data.hash,
            timestamp: new Date(data.timestamp).getTime(),
            deviceId: data.deviceId,
            localInsertedAt,
            field: data.field,
            tagId: data.tagId,
          })
          .execute();
        affectedTagFields.push({
          libraryId: data.libraryId,
          tagId: data.tagId,
          field: data.field,
        });
        break;
      }
      case "folder": {
        const data = zFolderFieldVersion.parse(fieldChange.data);
        await tx
          .insertInto("folderFieldVersion")
          .values({
            id: data.id,
            createdAt: new Date(data.createdAt).getTime(),
            createdByDeviceId: data.createdByDeviceId,
            deletedAt: data.deletedAt ? new Date(data.deletedAt).getTime() : null,
            deletedByDeviceId: data.deletedByDeviceId,
            libraryId: data.libraryId,
            value: data.value,
            hash: data.hash,
            timestamp: new Date(data.timestamp).getTime(),
            deviceId: data.deviceId,
            localInsertedAt,
            field: data.field,
            folderId: data.folderId,
          })
          .execute();
        affectedFolderFields.push({
          libraryId: data.libraryId,
          folderId: data.folderId,
          field: data.field,
        });
        break;
      }
      case "supplement": {
        const data = zSupplementFieldVersion.parse(fieldChange.data);
        await tx
          .insertInto("supplementFieldVersion")
          .values({
            id: data.id,
            createdAt: new Date(data.createdAt).getTime(),
            createdByDeviceId: data.createdByDeviceId,
            deletedAt: data.deletedAt ? new Date(data.deletedAt).getTime() : null,
            deletedByDeviceId: data.deletedByDeviceId,
            libraryId: data.libraryId,
            value: data.value,
            hash: data.hash,
            timestamp: new Date(data.timestamp).getTime(),
            deviceId: data.deviceId,
            localInsertedAt,
            field: data.field,
            supplementId: data.supplementId,
          })
          .execute();
        affectedSupplementFields.push({
          libraryId: data.libraryId,
          supplementId: data.supplementId,
          field: data.field,
        });
        break;
      }
      case "feed": {
        const data = zFeedFieldVersion.parse(fieldChange.data);
        await tx
          .insertInto("feedFieldVersion")
          .values({
            id: data.id,
            createdAt: new Date(data.createdAt).getTime(),
            createdByDeviceId: data.createdByDeviceId,
            deletedAt: data.deletedAt ? new Date(data.deletedAt).getTime() : null,
            deletedByDeviceId: data.deletedByDeviceId,
            libraryId: data.libraryId,
            value: data.value,
            hash: data.hash,
            timestamp: new Date(data.timestamp).getTime(),
            deviceId: data.deviceId,
            localInsertedAt,
            field: data.field,
            feedId: data.feedId,
          })
          .execute();
        affectedFeedFields.push({
          libraryId: data.libraryId,
          feedId: data.feedId,
          field: data.field,
        });
        break;
      }
      case "library":
        // library field version write omitted for brevity; add if needed for tests
        break;
      default:
        throw new Error(`Unknown model: ${JSON.stringify(fieldChange)}`);
    }
  }

  for (const relationChange of relationChanges) {
    switch (relationChange.model) {
      case "paperAuthor": {
        const data = zPaperAuthor.parse(relationChange.data);
        await tx
          .insertInto("paperAuthor")
          .values({
            id: data.id,
            createdAt: new Date(data.createdAt).getTime(),
            createdByDeviceId: data.createdByDeviceId,
            deletedAt: data.deletedAt ? new Date(data.deletedAt).getTime() : null,
            deletedByDeviceId: data.deletedByDeviceId,
            libraryId: data.libraryId,
            op: data.op,
            timestamp: new Date(data.timestamp).getTime(),
            deviceId: data.deviceId,
            localInsertedAt,
            paperId: data.paperId,
            authorId: data.authorId,
          })
          .execute();
        affectedPaperAuthorKeys.push({
          libraryId: data.libraryId,
          paperId: data.paperId,
          authorId: data.authorId,
        });
        break;
      }
      case "paperTag": {
        const data = zPaperTag.parse(relationChange.data);
        await tx
          .insertInto("paperTag")
          .values({
            id: data.id,
            createdAt: new Date(data.createdAt).getTime(),
            createdByDeviceId: data.createdByDeviceId,
            deletedAt: data.deletedAt ? new Date(data.deletedAt).getTime() : null,
            deletedByDeviceId: data.deletedByDeviceId,
            libraryId: data.libraryId,
            op: data.op,
            timestamp: new Date(data.timestamp).getTime(),
            deviceId: data.deviceId,
            localInsertedAt,
            paperId: data.paperId,
            tagId: data.tagId,
          })
          .execute();
        affectedPaperTagKeys.push({
          libraryId: data.libraryId,
          paperId: data.paperId,
          tagId: data.tagId,
        });
        break;
      }
      case "paperFolder": {
        const data = zPaperFolder.parse(relationChange.data);
        await tx
          .insertInto("paperFolder")
          .values({
            id: data.id,
            createdAt: new Date(data.createdAt).getTime(),
            createdByDeviceId: data.createdByDeviceId,
            deletedAt: data.deletedAt ? new Date(data.deletedAt).getTime() : null,
            deletedByDeviceId: data.deletedByDeviceId,
            libraryId: data.libraryId,
            op: data.op,
            timestamp: new Date(data.timestamp).getTime(),
            deviceId: data.deviceId,
            localInsertedAt,
            paperId: data.paperId,
            folderId: data.folderId,
          })
          .execute();
        affectedPaperFolderKeys.push({
          libraryId: data.libraryId,
          paperId: data.paperId,
          folderId: data.folderId,
        });
        break;
      }
      case "paperSupplement": {
        const data = zPaperSupplement.parse(relationChange.data);
        await tx
          .insertInto("paperSupplement")
          .values({
            id: data.id,
            createdAt: new Date(data.createdAt).getTime(),
            createdByDeviceId: data.createdByDeviceId,
            deletedAt: data.deletedAt ? new Date(data.deletedAt).getTime() : null,
            deletedByDeviceId: data.deletedByDeviceId,
            libraryId: data.libraryId,
            op: data.op,
            timestamp: new Date(data.timestamp).getTime(),
            deviceId: data.deviceId,
            localInsertedAt,
            paperId: data.paperId,
            supplementId: data.supplementId,
          })
          .execute();
        affectedPaperSupplementKeys.push({
          libraryId: data.libraryId,
          paperId: data.paperId,
          supplementId: data.supplementId,
        });
        break;
      }
      default:
        throw new Error(`Unknown model: ${JSON.stringify(relationChange)}`);
    }
  }

  return {
    affectedPaperFields,
    affectedAuthorFields,
    affectedTagFields,
    affectedFolderFields,
    affectedSupplementFields,
    affectedFeedFields,
    affectedPaperAuthorKeys,
    affectedPaperTagKeys,
    affectedPaperFolderKeys,
    affectedPaperSupplementKeys,
  };
}


export async function attach(library: "main" | "feeds", logger?: LogService) {
  const apiUrl = new URL(SYNC_BASE_URL);
  apiUrl.pathname = "/api/v1/sync/attach";
  // For now, only main library is supported
  if (library !== "main") {
    throw new Error("Only main library is supported for now");
  }

  const libraryId = await ensureLibraryId(library);
  const deviceId = syncStateStore.get("deviceId");

  const attachRequest: AttachRequest = {
    library: {
      libraryId: libraryId,
      libraryName: library,
    },
    device: {
      deviceId: deviceId,
    },
  };
  const res = await requestAPI(apiUrl, "POST", attachRequest, logger);
  const response = zAttachResponse.parse(res);
  if (response.success && response.data.attached.libraryId !== libraryId) {
    // Update all local library ids to the response library id
    const tx = await db.startTransaction().execute();
    try {
      await tx
        .updateTable("library")
        .set({
          id: response.data.attached.libraryId,
        })
        .where("id", "=", libraryId)
        .execute();

      await tx.commit().execute();
      if (logger) {
        logger.info(
          `[SyncClient] Library ID updated`,
          `${libraryId} -> ${response.data.attached.libraryId}`,
          false,
          "SyncClient"
        );
      }
    } catch (error) {
      if (logger) {
        logger.error(
          `[SyncClient] Failed to attach`,
          error as Error,
          false,
          "SyncClient"
        );
      }
      await tx.rollback();
      throw error;
    }
  }
}

export async function pull(
  continuationToken: ContinuationToken,
  logger?: LogService
) {
  const apiUrl = new URL(SYNC_BASE_URL);
  apiUrl.pathname = "/api/v1/sync/pull";
  const libraryId = await ensureLibraryId("main");
  const deviceId = syncStateStore.get("deviceId");
  const { since_committed_at, since_id } = continuationToken;

  apiUrl.searchParams.set("since_committed_at", since_committed_at);
  apiUrl.searchParams.set("since_id", since_id);
  apiUrl.searchParams.set("libraryId", libraryId);
  apiUrl.searchParams.set("deviceId", deviceId);
  const res = await requestAPI(apiUrl, "GET", undefined, logger);
  const response = zPullResponse.parse(res);
  if (!response.success) {
    throw new Error(response.message || "Failed to pull");
  }

  const changeRecords = response.data;

  const tx = await db.startTransaction().execute();
  const localInsertedAt = new Date().getTime();
  try {
    const affected = await writeChangeRecordsToDb(tx, changeRecords, localInsertedAt);

    await applyPaperFieldVersions(tx, affected.affectedPaperFields);
    await applyAuthorFieldVersions(tx, affected.affectedAuthorFields);
    await applyTagFieldVersions(tx, affected.affectedTagFields);
    await applyFolderFieldVersions(tx, affected.affectedFolderFields);
    await applySupplementFieldVersions(tx, affected.affectedSupplementFields);
    await applyFeedFieldVersions(tx, affected.affectedFeedFields);

    await applyPaperAuthorOrSet(tx, affected.affectedPaperAuthorKeys);
    await applyPaperTagOrSet(tx, affected.affectedPaperTagKeys);
    await applyPaperFolderOrSet(tx, affected.affectedPaperFolderKeys);
    await applyPaperSupplementOrSet(tx, affected.affectedPaperSupplementKeys);

    await tx.commit().execute();
    // Update the continuation token
    syncStateStore.set("lastSyncAt", new Date().getTime());
    const fieldCount = changeRecords.filter((r) => r.type === "field_version").length;
    const relationCount = changeRecords.filter((r) => r.type === "or_set").length;
    logger?.info(
      `[SyncClient] Successfully completed pull operation`,
      `fieldChanges: ${fieldCount}, relationChanges: ${relationCount}`,
      false,
      "SyncClient"
    );
    // Project pulled data to Realm so UI sees it without waiting for next realm() call
    const engine = PLAPILocal.realmProjectionEngine;
    if (engine) {
      await engine.ensureCaughtUp({ libraryId, maxBatch: 10000 });
    }
  } catch (error) {
    logger?.error(
      `[SyncClient] Error during pull operation, rolling back transaction`,
      error as Error,
      false,
      "SyncClient"
    );
    await tx.rollback().execute();
    throw error;
  }
}

export async function push(
  logger: LogService,
  continuationToken: ContinuationToken
) {
  const apiUrl = new URL(SYNC_BASE_URL);
  apiUrl.pathname = "/api/v1/sync/push";
  const libraryId = await ensureLibraryId("main");
  const deviceId = syncStateStore.get("deviceId");
  const changeRecords = await getChangeRecords(continuationToken);

  const request: PushRequest = {
    libraryId: libraryId,
    deviceId: deviceId,
    changes: changeRecords,
  };

  const res = await requestAPI(apiUrl, "POST", request, logger);
  const response = zPushResponse.parse(res);
  if (!response.success) {
    throw new Error(response.message || "Failed to push");
  }
}


/** Exported for unit tests: reads change stream and merges DB rows into ChangeRecord DTOs. */
export async function getChangeRecords(continuationToken: ContinuationToken): Promise<ChangeRecord[]> {
  const libraryId = await ensureLibraryId("main");
  const sinceCommittedAt = new Date(continuationToken.since_committed_at).getTime();
  const sinceId = continuationToken.since_id;
  const limit = continuationToken.limit;
  const changeRecordsStm = await db.selectFrom("changeStream")
    .where("libraryId", "=", libraryId)
    .where("localInsertedAt", ">=", sinceCommittedAt)
    .where("id", ">", sinceId)
    .where("localInsertedAt", "<", new Date().getTime())
  if (limit) {
    changeRecordsStm.limit(limit);
  }
  const ChangeStreamRows = await changeRecordsStm.execute();
  const changeRecords = ChangeStreamRows.map(async (row): Promise<ChangeRecord> => {
    const rowData = zChangeStreamRow.parse(row);
    if (rowData.type === "field_version") {
      switch (rowData.model) {
        case "paper":
          const paperFieldVersionModel = await db.selectFrom("paperFieldVersion")
            .selectAll()
            .where("id", "=", rowData.id)
            .executeTakeFirstOrThrow();
          return {
            type: "field_version",
            model: "paper",
            data: {
              id: paperFieldVersionModel.id,
              libraryId: paperFieldVersionModel.libraryId,
              value: paperFieldVersionModel.value,
              hash: paperFieldVersionModel.hash,
              timestamp: new Date(paperFieldVersionModel.timestamp).toISOString(),
              deviceId: paperFieldVersionModel.deviceId,
              createdAt: new Date(paperFieldVersionModel.createdAt).toISOString(),
              createdByDeviceId: paperFieldVersionModel.createdByDeviceId,
              deletedAt: paperFieldVersionModel.deletedAt ? new Date(paperFieldVersionModel.deletedAt).toISOString() : null,
              deletedByDeviceId: paperFieldVersionModel.deletedByDeviceId,

              field: paperFieldVersionModel.field,
              paperId: paperFieldVersionModel.paperId,
            },
          };
        case "author":
          const authorFieldVersionModel = await db.selectFrom("authorFieldVersion")
            .selectAll()
            .where("id", "=", rowData.id)
            .executeTakeFirstOrThrow();
          return {
            type: "field_version",
            model: "author",
            data: {
              id: authorFieldVersionModel.id,
              libraryId: authorFieldVersionModel.libraryId,
              value: authorFieldVersionModel.value,
              hash: authorFieldVersionModel.hash,
              timestamp: new Date(authorFieldVersionModel.timestamp).toISOString(),
              deviceId: authorFieldVersionModel.deviceId,
              createdAt: new Date(authorFieldVersionModel.createdAt).toISOString(),
              createdByDeviceId: authorFieldVersionModel.createdByDeviceId,
              deletedAt: authorFieldVersionModel.deletedAt ? new Date(authorFieldVersionModel.deletedAt).toISOString() : null,
              deletedByDeviceId: authorFieldVersionModel.deletedByDeviceId,

              field: authorFieldVersionModel.field,
              authorId: authorFieldVersionModel.authorId,
            },
          };
        case "tag":
          const tagFieldVersionModel = await db.selectFrom("tagFieldVersion")
            .selectAll()
            .where("id", "=", rowData.id)
            .executeTakeFirstOrThrow();
          return {
            type: "field_version",
            model: "tag",
            data: {
              id: tagFieldVersionModel.id,
              libraryId: tagFieldVersionModel.libraryId,
              value: tagFieldVersionModel.value,
              hash: tagFieldVersionModel.hash,
              timestamp: new Date(tagFieldVersionModel.timestamp).toISOString(),
              deviceId: tagFieldVersionModel.deviceId,
              createdAt: new Date(tagFieldVersionModel.createdAt).toISOString(),
              createdByDeviceId: tagFieldVersionModel.createdByDeviceId,
              deletedAt: tagFieldVersionModel.deletedAt ? new Date(tagFieldVersionModel.deletedAt).toISOString() : null,
              deletedByDeviceId: tagFieldVersionModel.deletedByDeviceId,

              field: tagFieldVersionModel.field,
              tagId: tagFieldVersionModel.tagId,
            },
          };
        case "folder":
          const folderFieldVersionModel = await db.selectFrom("folderFieldVersion")
            .selectAll()
            .where("id", "=", rowData.id)
            .executeTakeFirstOrThrow();
          return {
            type: "field_version",
            model: "folder",
            data: {
              id: folderFieldVersionModel.id,
              libraryId: folderFieldVersionModel.libraryId,
              value: folderFieldVersionModel.value,
              hash: folderFieldVersionModel.hash,
              timestamp: new Date(folderFieldVersionModel.timestamp).toISOString(),
              deviceId: folderFieldVersionModel.deviceId,
              createdAt: new Date(folderFieldVersionModel.createdAt).toISOString(),
              createdByDeviceId: folderFieldVersionModel.createdByDeviceId,
              deletedAt: folderFieldVersionModel.deletedAt ? new Date(folderFieldVersionModel.deletedAt).toISOString() : null,
              deletedByDeviceId: folderFieldVersionModel.deletedByDeviceId,

              field: folderFieldVersionModel.field,
              folderId: folderFieldVersionModel.folderId,
            }
          };
        case "supplement":
          const supplementFieldVersionModel = await db.selectFrom("supplementFieldVersion")
            .selectAll()
            .where("id", "=", rowData.id)
            .executeTakeFirstOrThrow();
          return {
            type: "field_version",
            model: "supplement",
            data: {
              id: supplementFieldVersionModel.id,
              libraryId: supplementFieldVersionModel.libraryId,
              value: supplementFieldVersionModel.value,
              hash: supplementFieldVersionModel.hash,
              timestamp: new Date(supplementFieldVersionModel.timestamp).toISOString(),
              deviceId: supplementFieldVersionModel.deviceId,
              createdAt: new Date(supplementFieldVersionModel.createdAt).toISOString(),
              createdByDeviceId: supplementFieldVersionModel.createdByDeviceId,
              deletedAt: supplementFieldVersionModel.deletedAt ? new Date(supplementFieldVersionModel.deletedAt).toISOString() : null,
              deletedByDeviceId: supplementFieldVersionModel.deletedByDeviceId,

              field: supplementFieldVersionModel.field,
              supplementId: supplementFieldVersionModel.supplementId,
            }
          };
        case "library":
          const libraryFieldVersionModel = await db.selectFrom("libraryFieldVersion")
            .selectAll()
            .where("id", "=", rowData.id)
            .executeTakeFirstOrThrow();
          return {
            type: "field_version",
            model: "library",
            data: {
              id: libraryFieldVersionModel.id,
              libraryId: libraryFieldVersionModel.libraryId,
              value: libraryFieldVersionModel.value,
              hash: libraryFieldVersionModel.hash,
              timestamp: new Date(libraryFieldVersionModel.timestamp).toISOString(),
              deviceId: libraryFieldVersionModel.deviceId,
              createdAt: new Date(libraryFieldVersionModel.createdAt).toISOString(),
              createdByDeviceId: libraryFieldVersionModel.createdByDeviceId,
              deletedAt: libraryFieldVersionModel.deletedAt ? new Date(libraryFieldVersionModel.deletedAt).toISOString() : null,
              deletedByDeviceId: libraryFieldVersionModel.deletedByDeviceId,

              field: libraryFieldVersionModel.field,
              // libraryId is not included in the DTO because it is the same as the libraryId in the base DTO
            }
          };
        case "feed":
          const feedFieldVersionModel = await db.selectFrom("feedFieldVersion")
            .selectAll()
            .where("id", "=", rowData.id)
            .executeTakeFirstOrThrow();
          return {
            type: "field_version",
            model: "feed",
            data: {
              id: feedFieldVersionModel.id,
              libraryId: feedFieldVersionModel.libraryId,
              value: feedFieldVersionModel.value,
              hash: feedFieldVersionModel.hash,
              timestamp: new Date(feedFieldVersionModel.timestamp).toISOString(),
              deviceId: feedFieldVersionModel.deviceId,
              createdAt: new Date(feedFieldVersionModel.createdAt).toISOString(),
              createdByDeviceId: feedFieldVersionModel.createdByDeviceId,
              deletedAt: feedFieldVersionModel.deletedAt ? new Date(feedFieldVersionModel.deletedAt).toISOString() : null,
              deletedByDeviceId: feedFieldVersionModel.deletedByDeviceId,

              field: feedFieldVersionModel.field,
              feedId: feedFieldVersionModel.feedId,
            }
          };
        default:
          throw new Error(`Unknown model: ${JSON.stringify(rowData)}`);
      }
    } else if (rowData.type === "or_set") {
      const relationship = await db.selectFrom(`${rowData.model}`)
        .selectAll()
        .where("id", "=", rowData.id)
        .executeTakeFirstOrThrow();
      switch (rowData.model) {
        case "paperAuthor":
          return {
            type: "or_set",
            model: "paperAuthor",
            data: {
              id: relationship.id,
              libraryId: relationship.libraryId,
              op: relationship.op,
              timestamp: new Date(relationship.timestamp).toISOString(),
              deviceId: relationship.deviceId,
              createdAt: new Date(relationship.createdAt).toISOString(),
              createdByDeviceId: relationship.createdByDeviceId,
              deletedAt: relationship.deletedAt ? new Date(relationship.deletedAt).toISOString() : null,
              deletedByDeviceId: relationship.deletedByDeviceId,

              paperId: relationship.paperId,
              authorId: relationship.authorId,
            },
          };
        case "paperTag":
          return {
            type: "or_set",
            model: "paperTag",
            data: {
              id: relationship.id,
              libraryId: relationship.libraryId,
              op: relationship.op,
              timestamp: new Date(relationship.timestamp).toISOString(),
              deviceId: relationship.deviceId,
              createdAt: new Date(relationship.createdAt).toISOString(),
              createdByDeviceId: relationship.createdByDeviceId,
              deletedAt: relationship.deletedAt ? new Date(relationship.deletedAt).toISOString() : null,
              deletedByDeviceId: relationship.deletedByDeviceId,

              paperId: relationship.paperId,
              tagId: relationship.tagId,
            },
          };
        case "paperFolder":
          return {
            type: "or_set",
            model: "paperFolder",
            data: {
              id: relationship.id,
              libraryId: relationship.libraryId,
              op: relationship.op,
              timestamp: new Date(relationship.timestamp).toISOString(),
              deviceId: relationship.deviceId,
              createdAt: new Date(relationship.createdAt).toISOString(),
              createdByDeviceId: relationship.createdByDeviceId,
              deletedAt: relationship.deletedAt ? new Date(relationship.deletedAt).toISOString() : null,
              deletedByDeviceId: relationship.deletedByDeviceId,

              paperId: relationship.paperId,
              folderId: relationship.folderId,
            },
          };
        case "paperSupplement":
          return {
            type: "or_set",
            model: "paperSupplement",
            data: {
              id: relationship.id,
              libraryId: relationship.libraryId,
              op: relationship.op,
              timestamp: new Date(relationship.timestamp).toISOString(),
              deviceId: relationship.deviceId,
              createdAt: new Date(relationship.createdAt).toISOString(),
              createdByDeviceId: relationship.createdByDeviceId,
              deletedAt: relationship.deletedAt ? new Date(relationship.deletedAt).toISOString() : null,
              deletedByDeviceId: relationship.deletedByDeviceId,

              paperId: relationship.paperId,
              supplementId: relationship.supplementId,
            },
          };
        default:
          throw new Error(`Unknown model: ${JSON.stringify(rowData)}`);
      }
    } else {
      throw new Error(`Unknown type: ${JSON.stringify(row)}`);
    }
  });
  return await Promise.all(changeRecords);
}