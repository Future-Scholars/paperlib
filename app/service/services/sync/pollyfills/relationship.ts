import { z } from "zod";
import type { Transaction } from "@/service/services/database/sqlite/db";
import {
  zPaperAuthorModel,
  zPaperTagModel,
  zPaperFolderModel,
  zPaperSupplementModel,
} from "@/service/services/database/sqlite/models";

export type PaperAuthorOrSetRow = z.infer<typeof zPaperAuthorModel>;
export type PaperTagOrSetRow = z.infer<typeof zPaperTagModel>;
export type PaperFolderOrSetRow = z.infer<typeof zPaperFolderModel>;
export type PaperSupplementOrSetRow = z.infer<typeof zPaperSupplementModel>;

export const zAffectedPaperAuthorKey = z.object({
  libraryId: z.string().uuid(),
  paperId: z.string().uuid(),
  authorId: z.string().uuid(),
});
export const zAffectedPaperTagKey = z.object({
  libraryId: z.string().uuid(),
  paperId: z.string().uuid(),
  tagId: z.string().uuid(),
});
export const zAffectedPaperFolderKey = z.object({
  libraryId: z.string().uuid(),
  paperId: z.string().uuid(),
  folderId: z.string().uuid(),
});
export const zAffectedPaperSupplementKey = z.object({
  libraryId: z.string().uuid(),
  paperId: z.string().uuid(),
  supplementId: z.string().uuid(),
});

export type AffectedPaperAuthorKey = z.infer<typeof zAffectedPaperAuthorKey>;
export type AffectedPaperTagKey = z.infer<typeof zAffectedPaperTagKey>;
export type AffectedPaperFolderKey = z.infer<typeof zAffectedPaperFolderKey>;
export type AffectedPaperSupplementKey = z.infer<
  typeof zAffectedPaperSupplementKey
>;

type OrSetRow = {
  op: "add" | "remove";
  timestamp: number;
  createdAt: number;
  deletedAt: number | null;
};

/** Exported for unit tests: LWW selection of latest non-deleted op by timestamp then createdAt. */
export function pickLatestOpByTimestamp<T extends OrSetRow>(
  rows: readonly T[],
): T | null {
  const candidates = rows.filter((row) => row.deletedAt === null);
  if (candidates.length === 0) {
    return null;
  }
  return candidates.reduce<T>((latest, current) => {
    if (current.timestamp > latest.timestamp) {
      return current;
    }
    if (current.timestamp < latest.timestamp) {
      return latest;
    }
    if (current.createdAt > latest.createdAt) {
      return current;
    }
    if (current.createdAt < latest.createdAt) {
      return latest;
    }
    return latest;
  }, candidates[0]);
}

/**
 * Project OR-set state for paper–author: for each affected key, resolve current
 * membership from paperAuthor (latest non-deleted op wins; add => present,
 * remove => absent). Does not write to a separate table; use for consistency
 * with pull flow. Callers that need “current authors of paper” should query
 * paperAuthor with the same LWW rule or use a materialised view/table later.
 */
export async function applyPaperAuthorOrSet(
  tx: Transaction,
  affected: readonly AffectedPaperAuthorKey[],
): Promise<void> {
  const uniqueKeys = new Map<string, AffectedPaperAuthorKey>();
  for (const item of affected) {
    const key = `${item.libraryId}:${item.paperId}:${item.authorId}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, item);
    }
  }

  for (const { libraryId, paperId, authorId } of uniqueKeys.values()) {
    const rows = await tx
      .selectFrom("paperAuthor")
      .selectAll()
      .where("libraryId", "=", libraryId)
      .where("paperId", "=", paperId)
      .where("authorId", "=", authorId)
      .execute();

    const latest = pickLatestOpByTimestamp(rows);
    if (latest === null) {
      continue;
    }
    if (latest.op === "remove") {
      continue;
    }
    if (latest.op === "add") {
      continue;
    }
  }
}

/**
 * Project OR-set state for paper–tag: for each affected key, resolve current
 * membership from paperTag (latest non-deleted op wins; add => present,
 * remove => absent).
 */
export async function applyPaperTagOrSet(
  tx: Transaction,
  affected: readonly AffectedPaperTagKey[],
): Promise<void> {
  const uniqueKeys = new Map<string, AffectedPaperTagKey>();
  for (const item of affected) {
    const key = `${item.libraryId}:${item.paperId}:${item.tagId}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, item);
    }
  }

  for (const { libraryId, paperId, tagId } of uniqueKeys.values()) {
    const rows = await tx
      .selectFrom("paperTag")
      .selectAll()
      .where("libraryId", "=", libraryId)
      .where("paperId", "=", paperId)
      .where("tagId", "=", tagId)
      .execute();

    const latest = pickLatestOpByTimestamp(rows);
    if (latest === null) {
      continue;
    }
    if (latest.op === "remove") {
      continue;
    }
    if (latest.op === "add") {
      continue;
    }
  }
}

/**
 * Project OR-set state for paper–folder: for each affected key, resolve current
 * membership from paperFolder (latest non-deleted op wins; add => present,
 * remove => absent).
 */
export async function applyPaperFolderOrSet(
  tx: Transaction,
  affected: readonly AffectedPaperFolderKey[],
): Promise<void> {
  const uniqueKeys = new Map<string, AffectedPaperFolderKey>();
  for (const item of affected) {
    const key = `${item.libraryId}:${item.paperId}:${item.folderId}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, item);
    }
  }

  for (const { libraryId, paperId, folderId } of uniqueKeys.values()) {
    const rows = await tx
      .selectFrom("paperFolder")
      .selectAll()
      .where("libraryId", "=", libraryId)
      .where("paperId", "=", paperId)
      .where("folderId", "=", folderId)
      .execute();

    const latest = pickLatestOpByTimestamp(rows);
    if (latest === null) {
      continue;
    }
    if (latest.op === "remove") {
      continue;
    }
    if (latest.op === "add") {
      continue;
    }
  }
}

/**
 * Project OR-set state for paper–supplement: for each affected key, resolve
 * current membership from paperSupplement (latest non-deleted op wins;
 * add => present, remove => absent).
 */
export async function applyPaperSupplementOrSet(
  tx: Transaction,
  affected: readonly AffectedPaperSupplementKey[],
): Promise<void> {
  const uniqueKeys = new Map<string, AffectedPaperSupplementKey>();
  for (const item of affected) {
    const key = `${item.libraryId}:${item.paperId}:${item.supplementId}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, item);
    }
  }

  for (const { libraryId, paperId, supplementId } of uniqueKeys.values()) {
    const rows = await tx
      .selectFrom("paperSupplement")
      .selectAll()
      .where("libraryId", "=", libraryId)
      .where("paperId", "=", paperId)
      .where("supplementId", "=", supplementId)
      .execute();

    const latest = pickLatestOpByTimestamp(rows);
    if (latest === null) {
      continue;
    }
    if (latest.op === "remove") {
      continue;
    }
    if (latest.op === "add") {
      continue;
    }
  }
}
