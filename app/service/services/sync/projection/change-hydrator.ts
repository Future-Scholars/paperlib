/**
 * change-hydrator.ts
 *
 * Maps a page of change_records rows (from change-stream-reader) into a
 * ProjectionBatch: the set of entity IDs that need to be re-projected to Realm.
 *
 * Entity-type mapping (paperlib-core → projection batch):
 *   paper            → paperIds
 *   tag              → tagIds
 *   collection       → collectionIds   (old name: "folder")
 *   attachment       → (no Realm projection needed; attachments are not stored in Realm)
 *   feed             → feedIds
 *   paper_tag        → paperIds + tagIds  (both sides must be re-projected)
 *   paper_collection → paperIds + collectionIds
 *   paper_author     → paperIds         (authors are stored as a string on Entity)
 *   paper_attachment → (ignored for Realm projection)
 */

import type { ChangeRecordRow } from "./change-stream-reader";
import type { ProjectionBatch } from "./projection-types";
import { createEmptyProjectionBatch } from "./projection-types";

export function hydrateChangeStreamBatch(
  libraryId: string,
  rows: ChangeRecordRow[]
): ProjectionBatch {
  const lastRowid = rows.length > 0 ? Math.max(...rows.map((r) => r.rowid)) : 0;
  const batch = createEmptyProjectionBatch(libraryId, lastRowid);

  for (const row of rows) {
    const { entity_type, entity_id } = row;

    switch (entity_type) {
      case "paper":
        batch.paperIds.add(entity_id);
        break;

      case "tag":
        batch.tagIds.add(entity_id);
        break;

      case "collection":
        batch.collectionIds.add(entity_id);
        break;

      case "feed":
        batch.feedIds.add(entity_id);
        break;

      case "paper_tag": {
        // entity_id is "paperId_tagId"
        const [paperId, tagId] = entity_id.split("_");
        if (paperId) batch.paperIds.add(paperId);
        if (tagId) batch.tagIds.add(tagId);
        break;
      }

      case "paper_collection": {
        const [paperId, collectionId] = entity_id.split("_");
        if (paperId) batch.paperIds.add(paperId);
        if (collectionId) batch.collectionIds.add(collectionId);
        break;
      }

      case "paper_author": {
        const [paperId] = entity_id.split("_");
        if (paperId) batch.paperIds.add(paperId);
        break;
      }

      // author, attachment, paper_attachment — not projected directly to Realm
      default:
        break;
    }
  }

  return batch;
}
