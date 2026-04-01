/**
 * change-stream-reader.ts
 *
 * Reads a page of change_records from the paperlib-core SQLite database,
 * ordered by SQLite rowid (insertion order).  The rowid acts as a monotonic
 * cursor for the projection engine so it never re-processes the same record.
 */

import { sql } from "kysely";
import { coreDb } from "@/service/services/database/sqlite/core-db";

export type ChangeRecordRow = {
  rowid: number;
  id: string;
  library_id: string;
  entity_type: string;
  entity_id: string;
};

export interface GetChangesOptions {
  libraryId: string;
  afterRowid?: number;
  limit: number;
}

/**
 * Returns up to `limit` change_records rows for the library whose rowid is
 * greater than `afterRowid`, ordered ascending.
 */
export async function getChanges(
  opts: GetChangesOptions
): Promise<ChangeRecordRow[]> {
  const { libraryId, afterRowid = 0, limit } = opts;

  const rows = await coreDb
    .selectFrom("change_records as cr")
    .select([
      sql<number>`cr.rowid`.as("rowid"),
      "cr.id",
      "cr.library_id",
      "cr.entity_type",
      "cr.entity_id",
    ])
    .where("cr.library_id", "=", libraryId)
    .where(sql`cr.rowid`, ">", afterRowid)
    .orderBy(sql`cr.rowid`, "asc")
    .limit(limit)
    .execute();

  return rows as ChangeRecordRow[];
}
