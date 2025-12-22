import { Supplement as SqliteSupplement, SupplementFieldVersion } from "@/service/services/database/sqlite/models";
import { Supplementary, ISupplementaryObject } from "@/models/supplementary";
import { db, Transaction } from "../../database/sqlite/db";
import { v4 as uuidv4 } from 'uuid';
import { syncStateStore } from "../states";
import { LogService } from "@/common/services/log-service";

/**
 * Convert SQLite Supplement to Realm Supplement
 * @param txOrDb - Transaction or db instance. This function doesn't need to query the database, but we keep the parameter for consistency
 * @param sqliteSupplement - The SQLite supplement to convert
 * @returns The Realm supplement draft
 */
export async function toRealmSupplementary(txOrDb: Transaction, sqliteSupplement: SqliteSupplement, logger?: LogService): Promise<ISupplementaryObject> {
  logger?.info(
    `[Polyfill] Starting SQLite to Realm conversion for supplement`,
    `sqliteId: ${sqliteSupplement.id}, legacyOid: ${sqliteSupplement.legacyOid}, name: ${sqliteSupplement.name}`,
    false,
    "Polyfill"
  );

  const supplementaryRealmObject = new Supplementary({
    _id: sqliteSupplement.legacyOid || undefined,
    name: sqliteSupplement.name,
    url: sqliteSupplement.value,
  });

  logger?.info(
    `[Polyfill] Successfully converted SQLite supplement to Realm`,
    `sqliteId: ${sqliteSupplement.id}, legacyOid: ${supplementaryRealmObject._id?.toString()}`,
    false,
    "Polyfill"
  );

  return supplementaryRealmObject;
}


export async function toSqliteSupplement(supplementary: ISupplementaryObject, logger?: LogService): Promise<SqliteSupplement> {
  logger?.info(
    `[Polyfill] Starting Realm to SQLite conversion for supplement`,
    `legacyOid: ${supplementary._id?.toString()}, name: ${supplementary.name}`,
    false,
    "Polyfill"
  );

  const deviceId = syncStateStore.get("deviceId");
  const existedSqliteSupplement = await db.selectFrom("supplement").where("legacyOid", "=", supplementary._id).selectAll().executeTakeFirst();
  if (existedSqliteSupplement) {
    logger?.info(
      `[Polyfill] Found existing SQLite supplement`,
      `legacyOid: ${supplementary._id?.toString()}, sqliteId: ${existedSqliteSupplement.id}`,
      false,
      "Polyfill"
    );
    let updated = false;
    const updatedAt = new Date();
    const updatedTimestamp = updatedAt.getTime();
    const sqliteSupplementVersions: SupplementFieldVersion[] = [];
    if (existedSqliteSupplement.name !== supplementary.name) {
      existedSqliteSupplement.name = supplementary.name;
      updated = true;
      sqliteSupplementVersions.push({
        id: uuidv4(),
        supplementId: existedSqliteSupplement.id,
        field: "name",
        value: supplementary.name,
        timestamp: updatedTimestamp,
        deviceId: deviceId,
        createdAt: updatedTimestamp,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (existedSqliteSupplement.value !== supplementary.url) {
      existedSqliteSupplement.value = supplementary.url;
      updated = true;
      sqliteSupplementVersions.push({
        id: uuidv4(),
        supplementId: existedSqliteSupplement.id,
        field: "value",
        value: supplementary.url,
        timestamp: updatedTimestamp,
        deviceId: deviceId,
        createdAt: updatedTimestamp,
        createdByDeviceId: deviceId,
        deletedAt: null,
        deletedByDeviceId: null,
      });
    }
    if (updated) {
      logger?.info(
        `[Polyfill] Updating SQLite supplement with ${sqliteSupplementVersions.length} field changes`,
        `legacyOid: ${supplementary._id?.toString()}, sqliteId: ${existedSqliteSupplement.id}, changedFields: ${sqliteSupplementVersions.map(v => v.field).join(', ')}`,
        false,
        "Polyfill"
      );
      existedSqliteSupplement.updatedAt = updatedTimestamp;
      existedSqliteSupplement.updatedByDeviceId = deviceId;
      await db.insertInto("supplementFieldVersion").values(sqliteSupplementVersions).execute();
      await db.updateTable("supplement").set(existedSqliteSupplement).where("id", "=", existedSqliteSupplement.id).execute();
      logger?.info(
        `[Polyfill] Successfully updated SQLite supplement`,
        `legacyOid: ${supplementary._id?.toString()}, sqliteId: ${existedSqliteSupplement.id}`,
        false,
        "Polyfill"
      );
    } else {
      logger?.info(
        `[Polyfill] No field changes detected, skipping update`,
        `legacyOid: ${supplementary._id?.toString()}, sqliteId: ${existedSqliteSupplement.id}`,
        false,
        "Polyfill"
      );
    }
    return existedSqliteSupplement;
  }

  logger?.info(
    `[Polyfill] Creating new SQLite supplement`,
    `legacyOid: ${supplementary._id?.toString()}, name: ${supplementary.name}`,
    false,
    "Polyfill"
  );

  const supplement: SqliteSupplement = {
    id: uuidv4(),
    legacyOid: supplementary._id,
    name: supplementary.name,
    value: supplementary.url,
    type: "url",
    description: null,
    createdAt: new Date().getTime(),
    createdByDeviceId: deviceId,
    updatedAt: null,
    updatedByDeviceId: null,
    deletedAt: null,
    deletedByDeviceId: null,
  };
  const sqliteSupplementVersions: SupplementFieldVersion[] = [
    {
      id: uuidv4(),
      supplementId: supplement.id,
      field: "name",
      value: supplementary.name,
      timestamp: new Date().getTime(),
      deviceId: deviceId,
      createdAt: new Date().getTime(),
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      supplementId: supplement.id,
      field: "value",
      value: supplementary.url,
      timestamp: new Date().getTime(),
      deviceId: deviceId,
      createdAt: new Date().getTime(),
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
    {
      id: uuidv4(),
      supplementId: supplement.id,
      field: "type",
      value: "url",
      timestamp: new Date().getTime(),
      deviceId: deviceId,
      createdAt: new Date().getTime(),
      createdByDeviceId: deviceId,
      deletedAt: null,
      deletedByDeviceId: null,
    },
  ];
  await db.transaction().execute(async (trx) => {
    await trx.insertInto("supplement").values(supplement).execute();
    await trx.insertInto("supplementFieldVersion").values(sqliteSupplementVersions).execute();
  });

  logger?.info(
    `[Polyfill] Successfully created SQLite supplement`,
    `legacyOid: ${supplementary._id?.toString()}, sqliteId: ${supplement.id}, name: ${supplement.name}`,
    false,
    "Polyfill"
  );

  return supplement;
}