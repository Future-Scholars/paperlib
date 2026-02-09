import { Migrator } from "kysely";
import { db } from "@/service/services/database/sqlite/db";
import * as migration from "@/service/services/database/sqlite/migrations/v3.2.0-beta0";

/**
 * Run SQLite migrations before any test so the schema exists.
 * Migrator only runs pending migrations, so this is safe to call every run.
 */
async function runMigrations(): Promise<void> {
  const migrator = new Migrator({
    db,
    provider: {
      getMigrations: async () => ({
        "v3.2.0-beta0": { up: migration.up, down: migration.down },
      }),
    },
  });
  const { error } = await migrator.migrateToLatest();
  if (error) {
    throw error;
  }
}

export default async function setup(): Promise<void> {
  await runMigrations();
}
