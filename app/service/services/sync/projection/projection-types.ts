/**
 * Output of ChangeHydrator: which entities need to be (re)projected to Realm after processing a batch of changeStream rows.
 * Applier will upsert these in order: feeds first, then tags, folders, then papers (so paper.tags/folders can link).
 * FeedEntity is derived from papers with feedId set (no separate batch set).
 */
export interface ProjectionBatch {
  libraryId: string;
  feedIds: Set<string>;
  paperIds: Set<string>;
  tagIds: Set<string>;
  folderIds: Set<string>;
  lastLocalInsertedAt: number;
}

export function createEmptyProjectionBatch(
  libraryId: string,
  lastLocalInsertedAt: number
): ProjectionBatch {
  return {
    libraryId,
    feedIds: new Set(),
    paperIds: new Set(),
    tagIds: new Set(),
    folderIds: new Set(),
    lastLocalInsertedAt,
  };
}
