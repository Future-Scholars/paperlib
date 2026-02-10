import { describe, it, expect } from "vitest";
import {
  createEmptyProjectionBatch,
  type ProjectionBatch,
} from "../../../../app/service/services/sync/projection/projection-types";

describe("ProjectionBatch", () => {
  it("createEmptyProjectionBatch returns batch with empty sets and correct libraryId", () => {
    const libraryId = "lib-123";
    const last = 1000;
    const batch = createEmptyProjectionBatch(libraryId, last);

    expect(batch.libraryId).toBe(libraryId);
    expect(batch.lastLocalInsertedAt).toBe(last);
    expect(batch.paperIds).toBeInstanceOf(Set);
    expect(batch.tagIds).toBeInstanceOf(Set);
    expect(batch.folderIds).toBeInstanceOf(Set);
    expect(batch.paperIds.size).toBe(0);
    expect(batch.tagIds.size).toBe(0);
    expect(batch.folderIds.size).toBe(0);
  });

  it("batch sets are mutable and can be used for collection", () => {
    const batch = createEmptyProjectionBatch("lib", 0);
    batch.paperIds.add("paper-1");
    batch.paperIds.add("paper-2");
    batch.tagIds.add("tag-1");
    batch.folderIds.add("folder-1");

    expect(batch.paperIds.size).toBe(2);
    expect(batch.tagIds.size).toBe(1);
    expect(batch.folderIds.size).toBe(1);
    expect(batch.paperIds.has("paper-1")).toBe(true);
    expect(batch.tagIds.has("tag-1")).toBe(true);
  });
});
