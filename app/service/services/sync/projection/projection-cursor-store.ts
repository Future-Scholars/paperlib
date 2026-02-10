import { db } from "@/service/services/database/sqlite/db";

const DEFAULT_PROJECTION_NAME = "realm_main";

export interface ProjectionCursor {
  name: string;
  libraryId: string;
  lastLocalInsertedAt: number;
}

/**
 * Loads the projection cursor for a given (name, libraryId).
 * Returns lastLocalInsertedAt or 0 if no row exists.
 */
export async function loadCursor(
  libraryId: string,
  name: string = DEFAULT_PROJECTION_NAME
): Promise<number> {
  const row = await db
    .selectFrom("local_projection_state")
    .select("lastLocalInsertedAt")
    .where("name", "=", name)
    .where("libraryId", "=", libraryId)
    .executeTakeFirst();

  return row?.lastLocalInsertedAt ?? 0;
}

/**
 * Saves the projection cursor for (name, libraryId).
 * Upserts so that the row is created or updated.
 */
export async function saveCursor(
  libraryId: string,
  lastLocalInsertedAt: number,
  name: string = DEFAULT_PROJECTION_NAME
): Promise<void> {
  await db
    .insertInto("local_projection_state")
    .values({
      name,
      libraryId,
      lastLocalInsertedAt,
    })
    .onConflict((oc) =>
      oc.columns(["name", "libraryId"]).doUpdateSet({
        lastLocalInsertedAt,
      })
    )
    .execute();
}
