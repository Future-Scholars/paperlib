import { db } from "@/service/services/database/sqlite/db";
import type { ChangeStreamRow } from "./change-stream-reader";
import type { ProjectionBatch } from "./projection-types";
import { createEmptyProjectionBatch } from "./projection-types";

/**
 * Maps changeStream rows to a batch of affected entity ids (paperIds, tagIds, folderIds).
 * For field_version we need to resolve the entity id from the version row (paperId, tagId, folderId, etc.).
 * For or_set we add both the paper and the related tag/folder to the batch.
 */
export async function hydrateChangeStreamBatch(
  libraryId: string,
  rows: ChangeStreamRow[]
): Promise<ProjectionBatch> {
  const lastLocalInsertedAt =
    rows.length > 0
      ? Math.max(...rows.map((r) => r.localInsertedAt))
      : 0;
  const batch = createEmptyProjectionBatch(libraryId, lastLocalInsertedAt);

  for (const row of rows) {
    if (row.type === "field_version") {
      switch (row.model) {
        case "paper": {
          const v = await db
            .selectFrom("paperFieldVersion")
            .select("paperId")
            .where("id", "=", row.id)
            .where("libraryId", "=", libraryId)
            .executeTakeFirst();
          if (v) batch.paperIds.add(v.paperId);
          break;
        }
        case "tag": {
          const v = await db
            .selectFrom("tagFieldVersion")
            .select("tagId")
            .where("id", "=", row.id)
            .where("libraryId", "=", libraryId)
            .executeTakeFirst();
          if (v) batch.tagIds.add(v.tagId);
          break;
        }
        case "folder": {
          const v = await db
            .selectFrom("folderFieldVersion")
            .select("folderId")
            .where("id", "=", row.id)
            .where("libraryId", "=", libraryId)
            .executeTakeFirst();
          if (v) batch.folderIds.add(v.folderId);
          break;
        }
        case "feed": {
          const v = await db
            .selectFrom("feedFieldVersion")
            .select("feedId")
            .where("id", "=", row.id)
            .where("libraryId", "=", libraryId)
            .executeTakeFirst();
          if (v) batch.feedIds.add(v.feedId);
          break;
        }
        default:
          break;
      }
    } else if (row.type === "or_set") {
      switch (row.model) {
        case "paperTag": {
          const r = await db
            .selectFrom("paperTag")
            .select(["paperId", "tagId"])
            .where("id", "=", row.id)
            .where("libraryId", "=", libraryId)
            .executeTakeFirst();
          if (r) {
            batch.paperIds.add(r.paperId);
            batch.tagIds.add(r.tagId);
          }
          break;
        }
        case "paperFolder": {
          const r = await db
            .selectFrom("paperFolder")
            .select(["paperId", "folderId"])
            .where("id", "=", row.id)
            .where("libraryId", "=", libraryId)
            .executeTakeFirst();
          if (r) {
            batch.paperIds.add(r.paperId);
            batch.folderIds.add(r.folderId);
          }
          break;
        }
        default:
          break;
      }
    }
  }

  return batch;
}
