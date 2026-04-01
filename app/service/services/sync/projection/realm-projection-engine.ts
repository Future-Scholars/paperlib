import Realm from "realm";
import { createDecorator } from "@/base/injection/injection";
import { ILogService, LogService } from "@/common/services/log-service";
import { DatabaseCore, IDatabaseCore } from "@/service/services/database/core";
import { getChanges } from "./change-stream-reader";
import { hydrateChangeStreamBatch } from "./change-hydrator";
import { applyProjectionBatchToRealm } from "./realm-applier";
import * as cursorStore from "./projection-cursor-store";

const DEFAULT_MAX_BATCH = 5000;

/** Simple process-wide mutex for ensureCaughtUp / projectRange. */
let projectionMutex: Promise<void> = Promise.resolve();

function withMutex<T>(fn: () => Promise<T>): Promise<T> {
  const next = projectionMutex.then(
    () => fn(),
    (err) => {
      throw err;
    }
  );
  projectionMutex = next.then(() => undefined, () => undefined);
  return next;
}

export interface RealmProjectionEngineOptions {
  libraryId?: string;
  maxBatch?: number;
  /** When provided (e.g. from DatabaseCore.realm()), use this realm for projection to avoid re-entrancy. */
  realm?: Realm | null;
}

export interface ProjectRangeResult {
  applied: number;
  lastRowid?: number;
}

export const IRealmProjectionEngine = createDecorator("realmProjectionEngine");

/**
 * RealmProjectionEngine: reads change_records, hydrates to a projection batch,
 * applies to Realm, advances the rowid cursor.
 * Single entry point for "ensure Realm is up to date with SQLite".
 */
export class RealmProjectionEngine {
  constructor(
    @IDatabaseCore private readonly _databaseCore: DatabaseCore,
    @ILogService private readonly _logService: LogService
  ) {}

  /**
   * Ensures projection has caught up to the latest change_records for the library.
   * Runs under a process-wide mutex. Pass realm when called from DatabaseCore.realm()
   * to avoid recursion.
   */
  async ensureCaughtUp(opts?: RealmProjectionEngineOptions): Promise<void> {
    return withMutex(async () => {
      const libraryId = opts?.libraryId ?? (await this._getDefaultLibraryId());
      const maxBatch = opts?.maxBatch ?? DEFAULT_MAX_BATCH;
      const realm = opts?.realm ?? (await this._databaseCore.realm());

      let totalApplied = 0;
      let after = await cursorStore.loadCursor(libraryId);

      while (totalApplied < maxBatch) {
        const limit = Math.min(500, maxBatch - totalApplied);
        const result = await this._projectRangeInternal(realm, {
          libraryId,
          afterRowid: after,
          limit,
        });

        totalApplied += result.applied;
        if (result.lastRowid != null) {
          after = result.lastRowid;
          await cursorStore.saveCursor(libraryId, after);
        }
        if (result.applied === 0) break;
      }
    });
  }

  /**
   * Projects a range of change_records to Realm without advancing the cursor.
   */
  async projectRange(range: {
    libraryId: string;
    afterRowid?: number;
    limit: number;
  }): Promise<ProjectRangeResult> {
    return withMutex(async () => {
      const realm = await this._databaseCore.realm();
      return this._projectRangeInternal(realm, range);
    });
  }

  private async _projectRangeInternal(
    realm: Realm,
    range: {
      libraryId: string;
      afterRowid?: number;
      limit: number;
    }
  ): Promise<ProjectRangeResult> {
    const { libraryId, afterRowid = 0, limit } = range;

    const rows = await getChanges({
      libraryId,
      afterRowid,
      limit,
    });

    if (rows.length === 0) {
      return { applied: 0 };
    }

    const batch = hydrateChangeStreamBatch(libraryId, rows);
    await applyProjectionBatchToRealm(realm, batch);

    const applied =
      batch.feedIds.size +
      batch.paperIds.size +
      batch.tagIds.size +
      batch.collectionIds.size;

    return {
      applied,
      lastRowid: batch.lastRowid,
    };
  }

  private async _getDefaultLibraryId(): Promise<string> {
    try {
      const { ensureLibraryId } = await import("@/service/services/sync/sync-client");
      return await ensureLibraryId();
    } catch {
      return "main";
    }
  }
}
