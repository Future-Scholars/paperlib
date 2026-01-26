import { LogService } from "@/common/services/log-service";
import { db } from "@/service/services/database/sqlite/db";
import {
  ChangeRecord,
  toFieldVersionModel,
  toRelationshipModel,
  zAttachResponse,
  zPullResponse,
  zPushResponse,
  type AttachRequest,
  type ContinuationToken,
  type PushRequest,
} from "./dto";
import { fieldVersionRowSchemas, zChangeStreamRow } from "@/service/services/database/sqlite/models";
import { ensureLibraryId } from "./pollyfills/utils";
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
  const fieldChanges = changeRecords.filter(
    (record) => record.type === "field_version"
  );
  const relationChanges = changeRecords.filter(
    (record) => record.type === "or_set"
  );

  const tx = await db.startTransaction().execute();
  const localInsertedAt = new Date().getTime();
  try {
    // Process field changes
    for (const fieldChange of fieldChanges) {
      switch (fieldChange.model) {
        case "paper":
          await tx
            .insertInto("paperFieldVersion")
            .values({
              ...toFieldVersionModel(fieldChange.data),
              localInsertedAt
            })
            .execute();
          break;
        case "author":
          await tx
            .insertInto("authorFieldVersion")
            .values({
              ...toFieldVersionModel(fieldChange.data),
              localInsertedAt
            })
            .execute();
          break;
        case "tag":
          await tx
            .insertInto("tagFieldVersion")
            .values({
              ...toFieldVersionModel(fieldChange.data),
              localInsertedAt
            })
            .execute();
          break;
        case "folder":
          await tx
            .insertInto("folderFieldVersion")
            .values({
              ...toFieldVersionModel(fieldChange.data),
              localInsertedAt
            })
            .execute();
          break;
        case "supplement":
          await tx
            .insertInto("supplementFieldVersion")
            .values({
              ...toFieldVersionModel(fieldChange.data),
              localInsertedAt
            })
            .execute();
          break;
        case "library":
          await tx
            .insertInto("libraryFieldVersion")
            .values({
              ...toFieldVersionModel(fieldChange.data),
              localInsertedAt
            })
            .execute();
          break;
        case "feed":
          await tx
            .insertInto("feedFieldVersion")
            .values({
              ...toFieldVersionModel(fieldChange.data),
              localInsertedAt
            })
            .execute();
          break;
        default:
          throw new Error(`Unknown model: ${JSON.stringify(fieldChange)}`);
      }
    }
    // Process relation changes
    for (const relationChange of relationChanges) {
      switch (relationChange.model) {
        case "paperAuthor":
          await tx
            .insertInto("paperAuthor")
            .values({
              ...toRelationshipModel(relationChange.data),
              localInsertedAt: new Date().getTime(),
            })
            .execute();
          break;
        case "paperTag":
          await tx
            .insertInto("paperTag")
            .values({
              ...toRelationshipModel(relationChange.data),
              localInsertedAt: new Date().getTime(),
            })
            .execute();
          break;
        case "paperFolder":
          await tx
            .insertInto("paperFolder")
            .values({
              ...toRelationshipModel(relationChange.data),
              localInsertedAt: new Date().getTime(),
            })
            .execute();
          break;
        case "paperSupplement":
          await tx
            .insertInto("paperSupplement")
            .values({
              ...toRelationshipModel(relationChange.data),
              localInsertedAt: new Date().getTime(),
            })
            .execute();
          break;
        default:
          throw new Error(`Unknown model: ${JSON.stringify(relationChange)}`);
      }
    }
    await tx.commit().execute();
    // Update the continuation token
    syncStateStore.set("lastSyncAt", new Date().getTime());
    logger?.info(
      `[SyncClient] Successfully completed pull operation`,
      `fieldChanges: ${fieldChanges.length}, relationChanges: ${relationChanges.length}`,
      false,
      "SyncClient"
    );
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


async function getChangeRecords(continuationToken: ContinuationToken) {
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
  const changeRecords: Promise<ChangeRecord>[] = ChangeStreamRows.map(async (row) => {
    const rowData = zChangeStreamRow.parse(row);
    if (rowData.type === "field_version") {
      const fieldVersion = await db.selectFrom(`${rowData.model}FieldVersion`)
        .selectAll()
        .where("id", "=", rowData.id)
        .executeTakeFirstOrThrow();
      return {
        type: "field_version",
        model: rowData.model,
        data: {
          ...fieldVersion,
          localInsertedAt: rowData.localInsertedAt,
        },
      };
    } else if (rowData.type === "or_set") {
      return {
        type: "or_set",
        model: rowData.model,
        data: rowData.data,
      };
    } else {
      throw new Error(`Unknown type: ${JSON.stringify(row)}`);
    }
  });
  return changeRecords;
}