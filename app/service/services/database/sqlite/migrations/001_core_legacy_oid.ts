/**
 * App-level migration that adds a nullable `legacy_oid` column to the
 * paperlib-core entity tables.  This column stores the 24-char hex string
 * of the original Realm ObjectId so we can project entities back to Realm
 * with their original primary keys after migration.
 *
 * Runs on top of the core `000_init` migration via the wrapped provider
 * in core-db.ts.
 */

import { type Kysely, type Migration } from "kysely";

const entityTables = [
  "papers",
  "authors",
  "attachments",
  "tags",
  "collections",
  "feeds",
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function up(db: Kysely<any>): Promise<void> {
  for (const table of entityTables) {
    await db.schema.alterTable(table).addColumn("legacy_oid", "varchar").execute();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function down(db: Kysely<any>): Promise<void> {
  for (const table of entityTables) {
    await db.schema.alterTable(table).dropColumn("legacy_oid").execute();
  }
}

export const migration: Migration = { up, down };
