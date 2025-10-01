import { ICategorizerObject, CategorizerType } from "@/models/categorizer";
import { zTag, zTagFieldVersion, Tag as SqliteTag } from "@/service/services/database/sqlite/models";
import { syncStateStore } from "@/service/services/sync/states";
import { db } from "@/service/services/database/sqlite/db";
import { v4 as uuidv4 } from 'uuid';
import z from "zod";
import { createFieldVersionValue, ensureUndefinedToNull, ensureLibraryId } from "./utils";
import { zFolder, zFolderFieldVersion, Folder as SqliteFolder } from "@/service/services/database/sqlite/models";



/**
 * Sync the categorizer to the sqlite database
 * @param categorizer - The categorizer to sync
 * @param type - The type of the categorizer
 * @returns The sqlite categorizer, guaranteed in database.
 */
export async function toSqliteCategorizer(
  categorizer: ICategorizerObject,
  type: CategorizerType
): Promise<z.infer<typeof zTag> | z.infer<typeof zFolder>> {
  const deviceId = syncStateStore.get("deviceId");

  if (type === CategorizerType.PaperTag) {
    const createdAtDate = new Date();
    const createdAtDateString = createdAtDate.toISOString();
    const createdAtTimestamp = createdAtDate.getTime();
    // Try get the existed sqlite tag by legacy oid
    const existedSqliteTag = await db.selectFrom("tag").where("name", "=", categorizer.name).selectAll().executeTakeFirst();
    const tagId = existedSqliteTag?.id || uuidv4();
    // If the tag is not existed, insert it to database
    if (!existedSqliteTag) {
      const sqliteTag: z.infer<typeof zTag> = {
        id: tagId,
        name: categorizer.name,
        description: null,
        colour: ensureUndefinedToNull(categorizer.color),
        createdAt: createdAtDateString,
        createdByDeviceId: deviceId,
        updatedAt: createdAtDateString,
        updatedByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      };
      await db.insertInto("tag").values(sqliteTag).execute();
      return sqliteTag;
    }

    // If the tag is already existed, update the sqlite tag if any difference
    let updated = false;
    const updatedTimestamp = createdAtTimestamp;
    const updatedDateTime = createdAtDateString;
    const sqliteTagVersions: z.infer<typeof zTagFieldVersion>[] = [];
    if (existedSqliteTag.name !== categorizer.name) {
      existedSqliteTag.name = categorizer.name;
      updated = true;
      existedSqliteTag.updatedAt = updatedDateTime;
      existedSqliteTag.updatedByDeviceId = deviceId;
      sqliteTagVersions.push({
        id: uuidv4(),
        tagId: tagId,
        field: "name",
        value: createFieldVersionValue('update', existedSqliteTag.name, categorizer.name),
        timestamp: updatedTimestamp,
        deviceId: deviceId,
        createdAt: updatedDateTime,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteTag.colour !== categorizer.color) {
      existedSqliteTag.colour = categorizer.color;
      updated = true;
      existedSqliteTag.updatedAt = updatedDateTime;
      existedSqliteTag.updatedByDeviceId = deviceId;
      sqliteTagVersions.push({
        id: uuidv4(),
        tagId: tagId,
        field: "colour",
        value: createFieldVersionValue('update', existedSqliteTag.colour, categorizer.color),
        timestamp: updatedTimestamp,
        deviceId: deviceId,
        createdAt: updatedDateTime,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (updated) {
      await db.updateTable("tag").set(existedSqliteTag).where("id", "=", tagId).execute();
      await db.insertInto("tagFieldVersion").values(sqliteTagVersions).execute();
    }

    return existedSqliteTag;
  }
  if (type === CategorizerType.PaperFolder) {
    // Try get the existed sqlite folder by legacy oid
    const existedSqliteFolder = await db.selectFrom("folder").where("name", "=", categorizer.name).selectAll().executeTakeFirst();
    const folderId = existedSqliteFolder?.id || uuidv4();
    // If the folder is not existed, insert it to database
    if (!existedSqliteFolder) {
      const createdAtDate = new Date();
      const createdAtDateString = createdAtDate.toISOString();
      const createdAtTimestamp = createdAtDate.getTime();
      const sqliteFolder: z.infer<typeof zFolder> = {
        id: folderId,
        legacyOid: categorizer._id.toString(),
        name: categorizer.name,
        colour: ensureUndefinedToNull(categorizer.color),
        description: null,
        parentId: null,
        createdAt: createdAtDateString,
        createdByDeviceId: deviceId,
        libraryId: await ensureLibraryId(),
        updatedAt: createdAtDateString,
        updatedByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      };
      await db.insertInto("folder").values(sqliteFolder).execute();
      // TODO: handle the children
      return sqliteFolder;
    }
    // If the folder is already existed, update the sqlite folder if any difference
    let updated = false;
    const updatedAt = new Date();
    const updatedAtString = updatedAt.toISOString();
    const updatedTimestamp = updatedAt.getTime();
    const sqliteFolderVersions: z.infer<typeof zFolderFieldVersion>[] = [];
    if (existedSqliteFolder.name !== categorizer.name) {
      existedSqliteFolder.name = categorizer.name;
      updated = true;
      existedSqliteFolder.updatedAt = updatedAtString;
      existedSqliteFolder.updatedByDeviceId = deviceId;
      sqliteFolderVersions.push({
        id: uuidv4(),
        folderId: folderId,
        field: "name",
        value: createFieldVersionValue('update', existedSqliteFolder.name, categorizer.name),
        timestamp: updatedTimestamp,
        deviceId: deviceId,
        createdAt: updatedAtString,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteFolder.colour !== categorizer.color) {
      existedSqliteFolder.colour = categorizer.color;
      updated = true;
      existedSqliteFolder.updatedAt = updatedAtString;
      existedSqliteFolder.updatedByDeviceId = deviceId;
      sqliteFolderVersions.push({
        id: uuidv4(),
        folderId: folderId,
        field: "colour",
        value: createFieldVersionValue('update', existedSqliteFolder.colour, categorizer.color),
        timestamp: updatedTimestamp,
        deviceId: deviceId,
        createdAt: updatedAtString,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (updated) {
      await db.updateTable("folder").set(existedSqliteFolder).where("id", "=", folderId).execute();
      await db.insertInto("folderFieldVersion").values(sqliteFolderVersions).execute();
    }
    // As the update would not affact the id and parentId, we don't need to update the children
    // TODO: handle the children update
    return existedSqliteFolder;
  }

  // If the categorizer is not a tag or folder, throw an error
  throw new Error(`Unknown categorizer type: ${type}`);
}



export async function deleteSqliteTag(name: string): Promise<void> {
  const deviceId = syncStateStore.get("deviceId");
  const existedSqliteTag = await db.selectFrom("tag").where("name", "=", name).selectAll().executeTakeFirst();
  if (existedSqliteTag) {
    await db.updateTable("tag").set({
      deletedAt: new Date().toISOString(),
      deletedByDeviceId: deviceId,
    }).where("id", "=", existedSqliteTag.id).execute();
    // Also delete the tagFieldVersion
    await db.deleteFrom("tagFieldVersion").where("tagId", "=", existedSqliteTag.id).execute();
    // Also add a delete operation to the paperTag
    const existedPaperTag = await db.selectFrom("paperTag").where("tagId", "=", existedSqliteTag.id).selectAll().executeTakeFirst();
    if (existedPaperTag) {
      const createdAtDate = new Date();
      const createdAtDateString = createdAtDate.toISOString();
      const createdAtTimestamp = createdAtDate.getTime();
      await db.insertInto("paperTag").values({
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        op: "remove",
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        paperId: existedPaperTag.paperId,
        tagId: existedPaperTag.tagId,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      }).execute();
    }
  }
}

export async function deleteSqliteFolder(legacyOid: string): Promise<void> {
  const deviceId = syncStateStore.get("deviceId");
  const existedSqliteFolder = await db.selectFrom("folder").where("legacyOid", "=", legacyOid).selectAll().executeTakeFirst();
  if (existedSqliteFolder) {
    await db.updateTable("folder").set({
      deletedAt: new Date().toISOString(),
      deletedByDeviceId: deviceId,
    }).where("id", "=", existedSqliteFolder.id).execute();
    // Also delete the folderFieldVersion
    await db.deleteFrom("folderFieldVersion").where("folderId", "=", existedSqliteFolder.id).execute();
    // Also add a delete operation to the paperFolder
    const existedPaperFolder = await db.selectFrom("paperFolder").where("folderId", "=", existedSqliteFolder.id).selectAll().executeTakeFirst();
    if (existedPaperFolder) {
      const createdAtDate = new Date();
      const createdAtDateString = createdAtDate.toISOString();
      const createdAtTimestamp = createdAtDate.getTime();
      await db.insertInto("paperFolder").values({
        id: uuidv4(),
        createdAt: createdAtDateString,
        op: "remove",
        timestamp: createdAtTimestamp,
        deviceId: deviceId,
        paperId: existedPaperFolder.paperId,
        folderId: existedPaperFolder.folderId,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      }).execute();
    }
  }
}


export async function deleteSqliteCategorizer(legacyOid: string, type: CategorizerType): Promise<void> {
  if (type === CategorizerType.PaperTag) {
    await deleteSqliteTag(legacyOid);
  }
  if (type === CategorizerType.PaperFolder) {
    await deleteSqliteFolder(legacyOid);
  }
}