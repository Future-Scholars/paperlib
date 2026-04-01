/**
 * projection-cursor-store.ts
 *
 * Persists the projection cursor (last SQLite rowid of change_records that has
 * been projected to Realm) using electron-store so it survives app restarts.
 * The cursor is keyed by libraryId.
 */

import ElectronStore from "electron-store";

interface ProjectionCursorState {
  cursors: Record<string, number>;
}

const store = new ElectronStore<ProjectionCursorState>({
  name: "projection-cursor",
  defaults: { cursors: {} },
});

/**
 * Returns the last projected rowid for the library, or 0 if never run.
 */
export async function loadCursor(libraryId: string): Promise<number> {
  return store.get("cursors")[libraryId] ?? 0;
}

/**
 * Saves the last projected rowid for the library.
 */
export async function saveCursor(libraryId: string, rowid: number): Promise<void> {
  const cursors = { ...store.get("cursors"), [libraryId]: rowid };
  store.set("cursors", cursors);
}
