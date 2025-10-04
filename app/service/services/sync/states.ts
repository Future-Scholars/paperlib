import ElectronStore from "electron-store";
import { v4 as uuidv4 } from "uuid";
import { UserInfoResponse } from "openid-client";
export interface ISyncState {
  databaseVersion: number;
  deviceId: string;
  userId: string | null;
  lastSyncAt: string | null;
  pkceCodeVerifier: string | null;
  nonce: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  sub: string | null;
  userInfo: UserInfoResponse | null;
  accessTokenExpiredAt: number | null;
  connected: boolean;
}

export const DEFAULT_SYNC_STATE = {
  databaseVersion: 0,
  deviceId: uuidv4(),
  userId: null,
  lastSyncAt: null,
  pkceCodeVerifier: null,
  nonce: null,
  accessToken: null,
  refreshToken: null,
  idToken: null,
  sub: null,
  userInfo: null,
  accessTokenExpiredAt: null,
  connected: false,
};

export const syncStateStore = new ElectronStore<ISyncState>({
  name: "sync",
  defaults: DEFAULT_SYNC_STATE,
});