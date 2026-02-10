export { getChanges } from "./change-stream-reader";
export type { ChangeStreamRow, GetChangesOptions } from "./change-stream-reader";
export { hydrateChangeStreamBatch } from "./change-hydrator";
export type { ProjectionBatch } from "./projection-types";
export { createEmptyProjectionBatch } from "./projection-types";
export { applyProjectionBatchToRealm } from "./realm-applier";
export {
  RealmProjectionEngine,
  IRealmProjectionEngine,
  type RealmProjectionEngineOptions,
  type ProjectRangeResult,
} from "./realm-projection-engine";
export { loadCursor, saveCursor } from "./projection-cursor-store";
export type { ProjectionCursor } from "./projection-cursor-store";
