/**
 * core-db.ts
 *
 * Initialises a Kysely instance that uses the paperlib-core schema
 * (papers, authors, tags, collections, attachments, feeds, paper_* relations,
 * change_records, libraries).  Separate from the legacy betcat.db.
 *
 * JSON columns (_lww, payload) are automatically serialised / deserialised by
 * kysely-plugin-serialize so the rest of the codebase can treat them as plain
 * JS objects.
 */

import SQLite from "better-sqlite3";
import { Kysely, Migration, MigrationProvider, Migrator, SqliteDialect } from "kysely";
import { SerializePlugin } from "kysely-plugin-serialize";
import type { Database } from "@future-scholars/paperlib-core";
import { PaperlibCoreMigrationProvider } from "@future-scholars/paperlib-core";
import { PaperlibWriteEngine } from "@future-scholars/paperlib-core";
import { migration as legacyOidMigration } from "./migrations/001_core_legacy_oid";

/**
 * Wraps the core migration provider with app-specific migrations that add
 * columns the desktop app needs (e.g. legacy_oid for Realm projection).
 */
class AppCoreMigrationProvider implements MigrationProvider {
  private core = new PaperlibCoreMigrationProvider("sqlite");
  async getMigrations(): Promise<Record<string, Migration>> {
    const coreMigrations = await this.core.getMigrations();
    return {
      ...coreMigrations,
      "001_legacy_oid": legacyOidMigration,
    };
  }
}

// ---------------------------------------------------------------------------
// Kysely instance
// ---------------------------------------------------------------------------

const dialect = new SqliteDialect({
  database: new SQLite("paperlib.db"),
});

export const coreDb = new Kysely<Database>({
  dialect,
  plugins: [new SerializePlugin()],
});

// ---------------------------------------------------------------------------
// Migration – run once at process startup (idempotent)
// ---------------------------------------------------------------------------

let _migrated = false;

export async function ensureCoreDbMigrated(): Promise<void> {
  if (_migrated) return;
  const migrator = new Migrator({
    db: coreDb,
    provider: new AppCoreMigrationProvider(),
  });
  const { error, results } = await migrator.migrateToLatest();
  if (error) throw error;
  if (results?.some((r) => r.status === "Error")) {
    throw new Error(
      `Core DB migration failed: ${JSON.stringify(results.filter((r) => r.status === "Error"))}`
    );
  }
  _migrated = true;
}

// ---------------------------------------------------------------------------
// Write engine factory
// ---------------------------------------------------------------------------

/**
 * Returns a PaperlibWriteEngine bound to coreDb.
 * Requires ensureCoreDbMigrated() to have been called first.
 */
export function createWriteEngine(deviceId: string): PaperlibWriteEngine {
  return new PaperlibWriteEngine(coreDb as never, deviceId);
}

// ---------------------------------------------------------------------------
// Library bootstrap
// ---------------------------------------------------------------------------

/**
 * Ensures a library row exists in the `libraries` table for the given id.
 * Creates one with the given deviceId if absent.  Returns the library id.
 */
export async function ensureCoreLibrary(
  libraryId: string,
  deviceId: string
): Promise<string> {
  const existing = await coreDb
    .selectFrom("libraries")
    .select("id")
    .where("id", "=", libraryId)
    .executeTakeFirst();

  if (!existing) {
    const now = new Date().toISOString();
    await coreDb
      .insertInto("libraries")
      .values({
        id: libraryId,
        created_at: now,
        created_by_device_id: deviceId,
        updated_at: now,
        updated_by_device_id: deviceId,
        is_deleted: false,
        deleted_at: null,
        deleted_by_device_id: null,
        _lww: {},
        name: "main",
        description: "",
      })
      .execute();
  }
  return libraryId;
}
