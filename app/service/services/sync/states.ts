import ElectronStore from "electron-store";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const syncStateSchema = z.object({
  databaseVersion: z.number(),
  syncMode: z.enum(["realm", "official", "self-hosted"]),
  syncServerUrl: z.string().url().optional().nullable(),
  attachedLibraryId: z.array(z.string().uuid()),
  syncEnabled: z.boolean(),

  // auth
  pkceCodeVerifier: z.string().optional().nullable(),
  nonce: z.string().optional().nullable(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  sub: z.string().optional().nullable(),
  userInfo: z.object({
    sub: z.string(),
    name: z.string().optional(),
    given_name: z.string().optional(),
    family_name: z.string().optional(),
    middle_name: z.string().optional(),
    nickname: z.string().optional(),
    preferred_username: z.string().optional(),
  }).passthrough().optional().nullable(),
  accessTokenExpiredAt: z.number().optional().nullable(),
  connected: z.boolean(),

  // sync identity
  deviceId: z.string(),
  /** UUID of the local "main" library row in the paperlib-core DB. */
  libraryId: z.string().optional().nullable(),

  // cursor-based sync tracking (replaces legacy ContinuationToken)
  /** Last cursor_id received from the server pull endpoint. 0 = never pulled. */
  pullCursor: z.number().int().nonnegative().default(0),

  lastPullOkAt: z.string().datetime().optional().nullable(),
  lastPushOkAt: z.string().datetime().optional().nullable(),
  sync_lock: z.boolean(),
});

export type ISyncState = z.infer<typeof syncStateSchema>;

export const DEFAULT_SYNC_STATE: ISyncState = {
  databaseVersion: 0,
  syncMode: "realm",
  syncServerUrl: null,
  attachedLibraryId: [],
  syncEnabled: false,
  // auth
  pkceCodeVerifier: null,
  nonce: null,
  accessToken: null,
  refreshToken: null,
  idToken: null,
  sub: null,
  userInfo: null,
  accessTokenExpiredAt: null,
  connected: false,
  // sync identity
  deviceId: uuidv4(),
  libraryId: null,
  // cursors
  pullCursor: 0,
  lastPullOkAt: null,
  lastPushOkAt: null,
  sync_lock: false,
};

export const syncStateStore = new ElectronStore<ISyncState>({
  name: "sync",
  defaults: DEFAULT_SYNC_STATE,
});
