import ElectronStore from "electron-store";
import { v4 as uuidv4 } from "uuid";
import { UserInfoResponse } from "openid-client";
import { zContinuationToken } from "./dto";
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
  // infer zod type from UserInfoResponse
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

  // sync
  deviceId: z.string(),
  pullToken: zContinuationToken.optional().nullable(),
  pushToken: zContinuationToken.optional().nullable(),
  lasetServerTimeSeenAt: z.string().datetime().optional().nullable(),// Server timestamp
  lastPullOkAt: z.string().datetime().optional().nullable(), // Pull cursor
  lastPushOkAt: z.string().datetime().optional().nullable(), // Push cursor
  sync_lock: z.boolean(), // Sync lock avoid sync loop overlap
});

export type ISyncState = z.infer<typeof syncStateSchema>;

export const DEFAULT_SYNC_STATE = {
  databaseVersion: 0,
  syncMode: "realm" as z.infer<typeof syncStateSchema>["syncMode"],
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
  // sync
  deviceId: uuidv4(),
  pullToken: null,
  pushToken: null,
  lasetServerTimeSeenAt: null,
  lastPullOkAt: null,
  lastPushOkAt: null,
  sync_lock: false,
};

export const syncStateStore = new ElectronStore<ISyncState>({
  name: "sync",
  defaults: DEFAULT_SYNC_STATE,
});