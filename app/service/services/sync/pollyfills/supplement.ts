import { Supplement as SqliteSupplement, SupplementFieldVersion } from "@/service/services/database/sqlite/models";
import { Supplementary, ISupplementaryObject } from "@/models/supplementary";
import { db } from "../../database/sqlite/db";
import { v4 as uuidv4 } from 'uuid';
import { syncStateStore } from "../states";

export async function toRealmSupplementary(sqliteSupplement: SqliteSupplement): Promise<ISupplementaryObject> {
  const supplementaryRealmObject = new Supplementary({
    _id: sqliteSupplement.legacyOid || undefined,
    name: sqliteSupplement.name,
    url: sqliteSupplement.value,
  });

  return supplementaryRealmObject;
}


export async function toSqliteSupplement(supplementary: ISupplementaryObject): Promise<SqliteSupplement> {
  const deviceId = syncStateStore.get("deviceId");
  const existedSqliteSupplement = await db.selectFrom("supplement").where("legacyOid", "=", supplementary._id).selectAll().executeTakeFirst();
  if (existedSqliteSupplement) {
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
      existedSqliteSupplement.updatedAt = updatedTimestamp;
      existedSqliteSupplement.updatedByDeviceId = deviceId;
      await db.insertInto("supplementFieldVersion").values(sqliteSupplementVersions).execute();
      await db.updateTable("supplement").set(existedSqliteSupplement).where("id", "=", existedSqliteSupplement.id).execute();
    }
    return existedSqliteSupplement;
  }
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
  db.transaction().execute(async (trx) => {
    await trx.insertInto("supplement").values(supplement).execute();
    await trx.insertInto("supplementFieldVersion").values(sqliteSupplementVersions).execute();
  });
  return supplement;
}