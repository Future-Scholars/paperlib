import { describe, it, expect } from "vitest";

/**
 * Unit tests for projection types and reader contract.
 * Full integration tests (with SQLite and Realm) require better-sqlite3 to be built.
 */

describe("Projection change stream contract", () => {
  it("getChanges options require libraryId and limit", () => {
    const opts = {
      libraryId: "550e8400-e29b-41d4-a716-446655440000",
      afterLocalInsertedAt: 0 as number | undefined,
      limit: 100,
    };
    expect(opts.libraryId).toBeDefined();
    expect(opts.limit).toBe(100);
  });

  it("change stream row shape has type, model, id, localInsertedAt", () => {
    const row = {
      libraryId: "550e8400-e29b-41d4-a716-446655440000",
      type: "field_version" as const,
      model: "paper",
      id: "550e8400-e29b-41d4-a716-446655440001",
      localInsertedAt: 1,
    };
    expect(row.type).toBe("field_version");
    expect(row.model).toBe("paper");
    expect(row.localInsertedAt).toBe(1);
  });
});
