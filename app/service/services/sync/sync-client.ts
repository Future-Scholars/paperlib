/**
 * sync-client.ts
 *
 * Client for the official Paperlib sync API.
 * CRDT merge logic is fully delegated to PaperlibWriteEngine from paperlib-core;
 * this module only handles HTTP transport and coordination with the Realm
 * projection engine.
 *
 * API paths (relative to SYNC_BASE_URL):
 *   POST /v1/sync/libraries/{libraryId}/push   – upload local unpushed oplogs
 *   GET  /v1/sync/libraries/{libraryId}/pull   – download remote oplogs since cursor
 */

import { LogService } from "@/common/services/log-service";
import { coreDb, createWriteEngine, ensureCoreDbMigrated, ensureCoreLibrary } from "@/service/services/database/sqlite/core-db";
import { syncStateStore } from "./states";
import { sql } from "kysely";

export const SYNC_BASE_URL = "http://localhost:3001/"; // TODO: change for production
// export const SYNC_BASE_URL = "https://dev.sync.paperlib.app/";
// export const SYNC_BASE_URL = "https://sync.paperlib.app/";

// ---------------------------------------------------------------------------
// Local type for a remote oplog record as returned by the pull API.
// Mirrors zRemoteOplogRecordSchema from paperlib-core without importing Zod v4.
// ---------------------------------------------------------------------------
type RemoteOplogRecord = {
  id: string;
  library_id: string;
  entity_type: string;
  entity_id: string;
  timestamp: number;
  device_id: string;
  payload: Record<string, unknown>;
  api_version: number;
  action?: string;
  created_at?: string;
  created_by_device_id?: string;
  deleted_at?: string | null;
  deleted_by_device_id?: string | null;
  cursor_id?: number | null;
};

type PullResponse = {
  records: RemoteOplogRecord[];
  next_cursor: number | null;
  has_more: boolean;
};

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function requestAPI(
  url: URL,
  method: string,
  body: unknown,
  logger?: LogService
): Promise<unknown> {
  const accessToken = syncStateStore.get("accessToken");
  if (!accessToken) {
    throw new Error("Access token is not available for syncing.");
  }

  if (logger) {
    logger.info(
      "[SyncClient] HTTP Request",
      `${method} ${url.toString()}`,
      false,
      "SyncClient"
    );
  }

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    if (logger) {
      logger.error(
        "[SyncClient] HTTP error",
        JSON.stringify(errBody),
        false,
        "SyncClient"
      );
    }
    throw new Error(`Sync API error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  if (logger) {
    logger.info(
      "[SyncClient] HTTP response",
      JSON.stringify(result),
      false,
      "SyncClient"
    );
  }
  return result;
}

// ---------------------------------------------------------------------------
// Library ID helper
// ---------------------------------------------------------------------------

/**
 * Returns the library UUID for the given library name from sync state,
 * creating the library row in the core DB if it does not yet exist.
 */
export async function ensureLibraryId(): Promise<string> {
  await ensureCoreDbMigrated();
  const deviceId = syncStateStore.get("deviceId");
  let libraryId: string | null = syncStateStore.get("libraryId") ?? null;
  if (!libraryId) {
    const { v4: uuidv4 } = await import("uuid");
    libraryId = uuidv4() as string;
    syncStateStore.set("libraryId", libraryId);
  }
  await ensureCoreLibrary(libraryId, deviceId);
  return libraryId;
}

// ---------------------------------------------------------------------------
// Pull: download remote oplogs and apply via PaperlibWriteEngine
// ---------------------------------------------------------------------------

/**
 * Pulls change records from the server since the stored pull cursor and applies
 * them locally using PaperlibWriteEngine.applyRemoteOplogs().
 * Loops until has_more is false (server has no more pages).
 */
export async function pull(logger?: LogService): Promise<void> {
  const libraryId = await ensureLibraryId();
  const deviceId = syncStateStore.get("deviceId");
  const engine = createWriteEngine(deviceId);

  let cursor: number = syncStateStore.get("pullCursor") ?? 0;
  let totalApplied = 0;
  let hasMore = true;

  while (hasMore) {
    const apiUrl = new URL(`v1/sync/libraries/${libraryId}/pull`, SYNC_BASE_URL);
    apiUrl.searchParams.set("after", String(cursor));
    apiUrl.searchParams.set("limit", "1000");

    const response = (await requestAPI(apiUrl, "GET", undefined, logger)) as PullResponse;
    const { records, next_cursor, has_more } = response;

    if (records.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await engine.applyRemoteOplogs(records as any);
      totalApplied += records.length;
    }

    if (next_cursor != null) {
      cursor = next_cursor;
      syncStateStore.set("pullCursor", cursor);
    }
    hasMore = has_more;
  }

  syncStateStore.set("lastPullOkAt", new Date().toISOString());

  if (logger) {
    logger.info(
      "[SyncClient] Pull completed",
      `applied ${totalApplied} records, cursor now ${cursor}`,
      false,
      "SyncClient"
    );
  }

  // Project freshly pulled data to Realm so the UI sees it without waiting.
  const projEngine = PLAPILocal.realmProjectionEngine;
  if (projEngine) {
    await projEngine.ensureCaughtUp({ libraryId, maxBatch: 10000 });
  }
}

// ---------------------------------------------------------------------------
// Push: upload unpushed local oplogs (cursor_id IS NULL)
// ---------------------------------------------------------------------------

/**
 * Selects local change_records that have not yet been acknowledged by the server
 * (cursor_id IS NULL) and pushes them in pages of up to 500 records.
 */
export async function push(logger?: LogService): Promise<void> {
  const libraryId = await ensureLibraryId();

  const PAGE_SIZE = 500;
  let pushed = 0;
  let hasMore = true;

  const apiUrl = new URL(`v1/sync/libraries/${libraryId}/push`, SYNC_BASE_URL);

  while (hasMore) {
    // Select the next page of unpushed records ordered by rowid (insertion order).
    const rows = await coreDb
      .selectFrom("change_records")
      .selectAll()
      .select(sql<number>`rowid`.as("_rowid"))
      .where("library_id", "=", libraryId)
      .where("cursor_id", "is", null)
      .orderBy(sql`rowid`, "asc")
      .limit(PAGE_SIZE)
      .execute();

    if (rows.length === 0) break;

    // Strip the synthetic _rowid field before sending to the server.
    const records = rows.map(({ _rowid: _r, ...rest }) => rest) as RemoteOplogRecord[];

    await requestAPI(apiUrl, "POST", { records }, logger);
    pushed += records.length;
    hasMore = rows.length === PAGE_SIZE;
  }

  syncStateStore.set("lastPushOkAt", new Date().toISOString());

  if (logger) {
    logger.info(
      "[SyncClient] Push completed",
      `sent ${pushed} records`,
      false,
      "SyncClient"
    );
  }
}
