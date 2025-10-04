import { syncStateStore } from "@/service/services/sync/states";
import { db } from "@/service/services/database/sqlite/db";
import { v4 as uuidv4 } from 'uuid';
import { zLibrary, Library as SqliteLibrary } from "@/service/services/database/sqlite/models";
import z from "zod";

/**
 * Creates a structured value object for field versions that includes operation type,
 * previous value, and new value for complete audit trail.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createFieldVersionValue(operation: 'create' | 'update', previousValue: any, newValue: any): string {
  // return JSON.stringify({
  //   operation,
  //   previousValue: previousValue ?? null,
  //   newValue: newValue ?? null,
  // });

  // At the moment we don't discriminate the operation type, so we return the new value but 
  // guaranteed to be a json compatible string
  return JSON.stringify(newValue);
}

/**
 * Converts undefined values to null for SQLite compatibility.
 * SQLite cannot handle undefined values but can handle null.
 */
export function ensureUndefinedToNull(value: any): any {
  return value === undefined ? null : value;
}

/**
 * Converts boolean values to integers (0 or 1) for SQLite compatibility.
 * SQLite cannot bind boolean values directly, so we convert them to integers.
 * @param value - The boolean value to convert
 * @returns 1 for true, 0 for false, null for null/undefined
 */
export function booleanToInt(value: boolean | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value ? 1 : 0;
}

/**
 * Converts integer values back to booleans for application use.
 * @param value - The integer value to convert (0, 1, or null)
 * @returns true for 1, false for 0, null for null
 */
export function intToBoolean(value: number | null | undefined): boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value === 1;
}

/**
 * Ensure the library ID in sqlite database. If the library is not in database, insert it to database.
 * Otherwise, return the library ID.
 * @param library The library name. If not provided, the default library "main" will be used.
 * @returns The library ID. Guaranteed in database.
 */
export async function ensureLibraryId(library?: string): Promise<string> {
  // For now, only main library is supported, remove this check if further support is needed
  if (library !== "main") {
    throw new Error("Only main library is supported for now");
  }

  const deviceId = syncStateStore.get("deviceId");

  // Try get the existed sqlite library by legacy oid
  const existedSqliteLibrary: SqliteLibrary | undefined = await db.selectFrom("library")
    .where("name", "=", library ?? "main")
    .where("deletedAt", "is", null)
    .selectAll()
    .executeTakeFirst();
  if (!existedSqliteLibrary) {
    const newSqliteLibrary: z.infer<typeof zLibrary> = {
      id: uuidv4(),
      name: library ?? "main",
      description: null,
      ownedBy: syncStateStore.get("userId"),
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
      createdByDeviceId: deviceId,
      updatedByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    }
    await db.insertInto("library").values(newSqliteLibrary).execute();
    return newSqliteLibrary.id;
  }
  return existedSqliteLibrary.id;
}
