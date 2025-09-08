import ElectronStore from "electron-store";
import { v4 as uuidv4 } from "uuid";

export interface ISyncState {
  databaseVersion: number;
  deviceId: string;
  userId: string | null;
  lastSyncAt: string | null;
}


export const syncStateStore = new ElectronStore<ISyncState>({
  name: "sync",
  defaults: {
    databaseVersion: 0,
    deviceId: uuidv4(),
    userId: null,
    lastSyncAt: null,
  },
});