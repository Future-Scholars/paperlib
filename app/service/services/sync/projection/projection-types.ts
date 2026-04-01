/**
 * Output of the change hydrator: which entities need to be (re)projected to
 * Realm after processing a batch of change_records rows.
 *
 * Feeds, tags, and collections are upserted before papers so that foreign-key
 * objects exist when papers reference them.
 * FeedEntity rows are derived from papers that have a non-null feed_id
 * (no separate batch set is needed).
 *
 * NOTE: "folder" → "collection" in the new paperlib-core schema.
 */
export interface ProjectionBatch {
  libraryId: string;
  feedIds: Set<string>;
  paperIds: Set<string>;
  tagIds: Set<string>;
  /** Collections (formerly "folders" in the old schema). */
  collectionIds: Set<string>;
  /** Monotonically increasing SQLite rowid of the last change_record processed. */
  lastRowid: number;
}

export function createEmptyProjectionBatch(
  libraryId: string,
  lastRowid: number
): ProjectionBatch {
  return {
    libraryId,
    feedIds: new Set(),
    paperIds: new Set(),
    tagIds: new Set(),
    collectionIds: new Set(),
    lastRowid,
  };
}
