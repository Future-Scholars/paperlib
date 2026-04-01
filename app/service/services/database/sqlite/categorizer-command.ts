import { v4 as uuidv4 } from "uuid";
import { db } from "@/service/services/database/sqlite/db";
import { ensureLibraryId } from "@/service/services/sync/pollyfills/utils";
import { syncStateStore } from "@/service/services/sync/states";
import type { ICategorizerObject } from "@/models/categorizer";
import { CategorizerType } from "@/models/categorizer";

export interface UpsertCategorizerResult {
  id: string;
  libraryId: string;
  lastLocalInsertedAt: number;
}

/**
 * SQLite categorizer command: single entry for tag/folder writes.
 * Writes tag or folder row and field version rows.
 * Folder parent-child: draft.parentId must be set by the caller (CategorizerService
 * sets it from parentCategorizer in update()); root folders use parentId null.
 */
export async function upsertCategorizer(
  type: CategorizerType.PaperTag | CategorizerType.PaperFolder,
  draft: ICategorizerObject
): Promise<UpsertCategorizerResult> {
  const libraryId = await ensureLibraryId("main");
  const deviceId = syncStateStore.get("deviceId");
  const now = Date.now();
  const id =
    typeof draft._id === "string"
      ? draft._id
      : (draft._id as { toString: () => string }).toString();

  const isTag = type === CategorizerType.PaperTag;

  await db.transaction().execute(async (tx) => {
    const existing = await tx
      .selectFrom(isTag ? "tag" : "folder")
      .select("id")
      .where("id", "=", id)
      .where("libraryId", "=", libraryId)
      .executeTakeFirst();

    if (isTag) {
      const row = {
        id,
        libraryId,
        legacyOid: id,
        name: draft.name ?? "",
        description: (draft as any).description ?? null,
        colour: draft.color ?? null,
        createdAt: existing ? (await tx.selectFrom("tag").select("createdAt").where("id", "=", id).where("libraryId", "=", libraryId).executeTakeFirst())?.createdAt ?? now : now,
        createdByDeviceId: existing ? (await tx.selectFrom("tag").select("createdByDeviceId").where("id", "=", id).where("libraryId", "=", libraryId).executeTakeFirst())?.createdByDeviceId ?? deviceId : deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
        updatedAt: now,
        updatedByDeviceId: deviceId,
      };

      if (existing) {
        await tx
          .updateTable("tag")
          .set({
            name: row.name,
            description: row.description,
            colour: row.colour,
            updatedAt: row.updatedAt,
            updatedByDeviceId: row.updatedByDeviceId,
          })
          .where("id", "=", id)
          .where("libraryId", "=", libraryId)
          .execute();
      } else {
        await tx.insertInto("tag").values(row).execute();
      }

      // CRDT: one field_version record with field="entity", value = full entity (create: deletedAt null)
      const tagEntity = {
        id,
        libraryId,
        legacyOid: row.legacyOid,
        name: row.name,
        description: row.description,
        colour: row.colour,
        createdAt: row.createdAt,
        createdByDeviceId: row.createdByDeviceId,
        deletedAt: null,
        deletedByDeviceId: null,
        updatedAt: row.updatedAt,
        updatedByDeviceId: row.updatedByDeviceId,
      };
      await tx
        .insertInto("tagFieldVersion")
        .values({
          id: uuidv4(),
          tagId: id,
          field: "entity",
          value: JSON.stringify(tagEntity),
          timestamp: now,
          deviceId,
          hash: null,
          createdAt: now,
          createdByDeviceId: deviceId,
          deletedAt: null,
          deletedByDeviceId: null,
          libraryId,
          localInsertedAt: now,
        })
        .execute();
    } else {
      const row = {
        id,
        libraryId,
        legacyOid: id,
        name: draft.name ?? "",
        description: (draft as any).description ?? null,
        colour: draft.color ?? null,
        parentId: (draft as any).parentId ?? null,
        createdAt: existing ? (await tx.selectFrom("folder").select("createdAt").where("id", "=", id).where("libraryId", "=", libraryId).executeTakeFirst())?.createdAt ?? now : now,
        createdByDeviceId: existing ? (await tx.selectFrom("folder").select("createdByDeviceId").where("id", "=", id).where("libraryId", "=", libraryId).executeTakeFirst())?.createdByDeviceId ?? deviceId : deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
        updatedAt: now,
        updatedByDeviceId: deviceId,
      };

      if (existing) {
        await tx
          .updateTable("folder")
          .set({
            name: row.name,
            description: row.description,
            colour: row.colour,
            parentId: row.parentId,
            updatedAt: row.updatedAt,
            updatedByDeviceId: row.updatedByDeviceId,
          })
          .where("id", "=", id)
          .where("libraryId", "=", libraryId)
          .execute();
      } else {
        await tx.insertInto("folder").values(row).execute();
      }

      // CRDT: one field_version record with field="entity", value = full entity (create: deletedAt null)
      const folderEntity = {
        id,
        libraryId,
        legacyOid: row.legacyOid,
        name: row.name,
        description: row.description,
        colour: row.colour,
        parentId: row.parentId,
        createdAt: row.createdAt,
        createdByDeviceId: row.createdByDeviceId,
        deletedAt: null,
        deletedByDeviceId: null,
        updatedAt: row.updatedAt,
        updatedByDeviceId: row.updatedByDeviceId,
      };
      await tx
        .insertInto("folderFieldVersion")
        .values({
          id: uuidv4(),
          folderId: id,
          field: "entity",
          value: JSON.stringify(folderEntity),
          timestamp: now,
          deviceId,
          hash: null,
          createdAt: now,
          createdByDeviceId: deviceId,
          deletedAt: null,
          deletedByDeviceId: null,
          libraryId,
          localInsertedAt: now,
        })
        .execute();
    }
  });

  return { id, libraryId, lastLocalInsertedAt: now };
}

export interface DeleteCategorizerResult {
  id: string;
  libraryId: string;
  lastLocalInsertedAt: number;
}

/**
 * Soft-delete a single tag or folder by id. Recursive delete (e.g. folder + all
 * descendants) is handled by CategorizerService: it uses collectAllToDelete() then
 * calls this for each id.
 */
export async function deleteCategorizer(
  type: CategorizerType.PaperTag | CategorizerType.PaperFolder,
  categorizerId: string
): Promise<DeleteCategorizerResult | null> {
  const libraryId = await ensureLibraryId("main");
  const deviceId = syncStateStore.get("deviceId");
  const now = Date.now();
  const isTag = type === CategorizerType.PaperTag;

  const existing = await db
    .selectFrom(isTag ? "tag" : "folder")
    .select("id")
    .where("id", "=", categorizerId)
    .where("libraryId", "=", libraryId)
    .where("deletedAt", "is", null)
    .executeTakeFirst();

  if (!existing) return null;

  await db.transaction().execute(async (tx) => {
    if (isTag) {
      await tx
        .updateTable("tag")
        .set({
          deletedAt: now,
          deletedByDeviceId: deviceId,
          updatedAt: now,
          updatedByDeviceId: deviceId,
        })
        .where("id", "=", categorizerId)
        .where("libraryId", "=", libraryId)
        .execute();

      const updated = await tx
        .selectFrom("tag")
        .selectAll()
        .where("id", "=", categorizerId)
        .where("libraryId", "=", libraryId)
        .executeTakeFirst();

      if (updated) {
        // CRDT: one field_version record with field="entity", value = entity data (delete: deletedAt + deletedByDeviceId set)
        const tagEntity = {
          id: updated.id,
          libraryId: updated.libraryId,
          name: updated.name,
          description: updated.description,
          colour: updated.colour,
          createdAt: updated.createdAt,
          createdByDeviceId: updated.createdByDeviceId,
          deletedAt: updated.deletedAt,
          deletedByDeviceId: updated.deletedByDeviceId,
          updatedAt: updated.updatedAt,
          updatedByDeviceId: updated.updatedByDeviceId,
        };
        await tx
          .insertInto("tagFieldVersion")
          .values({
            id: uuidv4(),
            tagId: categorizerId,
            field: "entity",
            value: JSON.stringify(tagEntity),
            timestamp: now,
            deviceId,
            hash: null,
            createdAt: now,
            createdByDeviceId: deviceId,
            deletedAt: now,
            deletedByDeviceId: deviceId,
            libraryId,
            localInsertedAt: now,
          })
          .execute();
      }
    } else {
      await tx
        .updateTable("folder")
        .set({
          deletedAt: now,
          deletedByDeviceId: deviceId,
          updatedAt: now,
          updatedByDeviceId: deviceId,
        })
        .where("id", "=", categorizerId)
        .where("libraryId", "=", libraryId)
        .execute();

      const updated = await tx
        .selectFrom("folder")
        .selectAll()
        .where("id", "=", categorizerId)
        .where("libraryId", "=", libraryId)
        .executeTakeFirst();

      if (updated) {
        // CRDT: one field_version record with field="entity", value = entity data (delete: deletedAt + deletedByDeviceId set)
        const folderEntity = {
          id: updated.id,
          libraryId: updated.libraryId,
          name: updated.name,
          description: updated.description,
          colour: updated.colour,
          parentId: updated.parentId,
          createdAt: updated.createdAt,
          createdByDeviceId: updated.createdByDeviceId,
          deletedAt: updated.deletedAt,
          deletedByDeviceId: updated.deletedByDeviceId,
          updatedAt: updated.updatedAt,
          updatedByDeviceId: updated.updatedByDeviceId,
        };
        await tx
          .insertInto("folderFieldVersion")
          .values({
            id: uuidv4(),
            folderId: categorizerId,
            field: "entity",
            value: JSON.stringify(folderEntity),
            timestamp: now,
            deviceId,
            hash: null,
            createdAt: now,
            createdByDeviceId: deviceId,
            deletedAt: now,
            deletedByDeviceId: deviceId,
            libraryId,
            localInsertedAt: now,
          })
          .execute();
      }
    }
  });

  return { id: categorizerId, libraryId, lastLocalInsertedAt: now };
}
