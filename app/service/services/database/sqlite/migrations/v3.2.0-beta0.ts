import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop all tables in reverse order to respect foreign key constraints
}
