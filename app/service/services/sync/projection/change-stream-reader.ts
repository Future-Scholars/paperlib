import { db } from "@/service/services/database/sqlite/db";
import { zChangeStreamRow } from "@/service/services/database/sqlite/models";

export type ChangeStreamRow = {
  libraryId: string;
  type: "field_version" | "or_set";
  model: string;
  id: string;
  localInsertedAt: number;
};

export interface GetChangesOptions {
  libraryId: string;
  afterLocalInsertedAt?: number;
  limit: number;
}

/**
 * Reads a range of changeStream rows (from the VIEW) in order of localInsertedAt.
 * No business logic; only reads the view.
 */
export async function getChanges(
  opts: GetChangesOptions
): Promise<ChangeStreamRow[]> {
  const { libraryId, afterLocalInsertedAt = 0, limit } = opts;

  const rows = await db
    .selectFrom("changeStream")
    .select(["libraryId", "type", "model", "id", "localInsertedAt"])
    .where("libraryId", "=", libraryId)
    .where("localInsertedAt", ">", afterLocalInsertedAt)
    .orderBy("localInsertedAt", "asc")
    .limit(limit)
    .execute();

  return rows.map((r) => zChangeStreamRow.parse(r)) as ChangeStreamRow[];
}
