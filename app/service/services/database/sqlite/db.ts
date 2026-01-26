import SQLite from "better-sqlite3";
import {
  Dialect,
  Kysely,
  Transaction as KyselyTransaction,
  SqliteDialect,
} from "kysely";
import { Database } from "./models";

const dialect: Dialect = new SqliteDialect({
  database: new SQLite("betcat.db"),
});

export const db = new Kysely<Database>({
  dialect,
});

export type Transaction = KyselyTransaction<Database>;
