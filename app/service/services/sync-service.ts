/**
 * Service for synchronization maintenance.
 * To avoid adding more data fields in current realm database, we will store the sync log in electron store.
 */

import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { processing, ProcessingKey } from "@/common/utils/processing";
import ElectronStore from "electron-store";
import * as openidClient from "openid-client";
import { z } from "zod";

export interface ISyncServiceState {
  syncType: "none" | "Atlas" | "official" | "self-hosted";
  pkceCodeVerifier?: string;
  nonce?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  sub?: string;
  userInfo?: string;
  expiredAt?: number;
  syncLogs?: z.infer<typeof SyncLog>[];
  lastSyncAt?: Date;
}

export const SyncLog = z.object({
  log_id: z.string().uuid(),
  operation: z.enum(["create", "update", "delete"]),
  entity_type: z.enum([
    "feed",
    "paper",
    "folder",
    "tag",
    "supplement",
    "author",
  ]),
  value: z.string(), // JSON object of the new value
  timestamp: z.string().datetime(), // Timestamp of the operation happened
  created_at: z.string().datetime(), // Created time on local database
  updated_at: z.string().datetime(), // Updated time on local database
});

/**
 * Service for synchronization maintenance.
 * 1. Maintain the synchronization authentication.
 * 2. Maintain the synchronization trigger, trigger the synchronization when:
 *   - The synchronization type is changed.
 *   - The synchronization is enabled.
 *   - Network becomes available.
 *   - The synchronization is triggered manually.
 *   - Time interval is reached.
 */
export class SyncService extends Eventable<ISyncServiceState> {
  private _openidClientConfig?: openidClient.Configuration;
  private readonly _store: ElectronStore<ISyncServiceState>;

  constructor() {
    super("syncService", {
      syncType: "none",
    });
    this._store = new ElectronStore<ISyncServiceState>({
      name: "sync",
    });
  }

  @processing(ProcessingKey.General)
  @errorcatching("Failed to initialize sync service.", true, "SyncService")
  async initialize(reinit: boolean = true) {
    // Initialize the sync service.
    if (!this._openidClientConfig) {
      this._openidClientConfig = await openidClient.discovery(
        new URL("https://auth0.paperlib.app"),
        "JzGo9xzn3zbHM4He86JeHOCOu9FVAdim"
      );
    }
    if (!this._openidClientConfig.serverMetadata().supportsPKCE()) {
      throw new Error("PKCE is not supported by the server");
    }

    // Check if the sync service is already authenticated.
    const syncType = await PLMainAPI.preferenceService.get("useSync");
    if (syncType === "official") {
      // Refresh the access token.
      const tokens = await this.refreshAuth();
      if (tokens.expires_in && tokens.refresh_token) {
        PLAPILocal.schedulerService.createTask(
          "syncService.refresh",
          this.refreshAuth.bind(this),
          tokens.expires_in - 600,
          undefined,
          false,
          false,
          20
        );
      }
    }
  }

  @processing(ProcessingKey.General)
  @errorcatching("Login to official sync service failed", true, "SyncService")
  async invokeLoginOfficial() {
    if (!this._openidClientConfig) {
      await this.initialize();
    }
    // Login to the official sync service.
    const code_verifier = openidClient.randomPKCECodeVerifier();
    this._store.delete("pkceCodeVerifier");
    this._store.set("pkceCodeVerifier", code_verifier);
    const code_challenge = await openidClient.calculatePKCECodeChallenge(
      code_verifier
    );
    const nonce = openidClient.randomNonce();
    this._store.delete("nonce");
    this._store.set("nonce", nonce);
    const params = {
      code_challenge,
      nonce,
      scope: "openid profile email sync:read sync:write offline_access",
      client_id: "JzGo9xzn3zbHM4He86JeHOCOu9FVAdim",
      // TODO: Allow self hosted sync service (get url from preference)
      redirect_uri:
        "paperlib://v3.desktop.paperlib.app/PLAPI/syncService/handleLoginOfficialCallback",
      code_challenge_method: "S256",
      audience: "http://localhost:3000",
    };
    const authorizationUrl = openidClient.buildAuthorizationUrl(
      this._openidClientConfig!,
      params
    );
    PLMainAPI.fileSystemService.openExternal(authorizationUrl.href).then();
  }

  @processing(ProcessingKey.General)
  @errorcatching("Login to official sync service failed", true, "SyncService")
  async handleLoginOfficialCallback({ code }: { code: string }) {
    if (!this._openidClientConfig) {
      await this.initialize();
    }
    // Handle the callback from the official sync service.
    const tokens = await openidClient.authorizationCodeGrant(
      this._openidClientConfig!,
      new URL(
        `paperlib://v3.desktop.paperlib.app/PLAPI/syncService/handleLoginOfficialCallback?code=${code}`
      ),
      {
        pkceCodeVerifier: this._store.get("pkceCodeVerifier"),
        expectedNonce: this._store.get("nonce"),
        idTokenExpected: true,
      }
    );
    if (tokens.expires_in && tokens.refresh_token) {
      PLAPILocal.schedulerService.createTask(
        "syncService.refresh",
        this.refreshAuth.bind(this),
        600,
        undefined,
        false,
        false,
        20
      );
    }
    this._store.delete("accessToken");
    this._store.set("accessToken", tokens.access_token);
    this._store.delete("refreshToken");
    this._store.set("refreshToken", tokens.refresh_token);
    this._store.delete("idToken");
    this._store.set("idToken", tokens.id_token);
    this._store.delete("sub");
    this._store.set("sub", tokens.claims()!.sub);

    const userInfo = await openidClient.fetchUserInfo(
      this._openidClientConfig!,
      this._store.get("accessToken")!,
      this._store.get("sub")!
    );
    this._store.delete("userInfo");
    this._store.set("userInfo", JSON.stringify(userInfo));
    this._store.delete("expiredAt");
    this._store.set("accessToken", tokens.access_token);
    this._store.delete("refreshToken");
    this._store.set("refreshToken", tokens.refresh_token);
    this._store.delete("idToken");
    this._store.set("idToken", tokens.id_token);
    this._store.delete("sub");
    this._store.set("sub", tokens.claims()!.sub);
    this._store.delete("userInfo");
    this._store.set("userInfo", JSON.stringify(userInfo));
    await PLMainAPI.preferenceService.set({
      useSync: "official",
    });

    // Add invoke sync task
    PLAPILocal.schedulerService.createTask(
      "syncService.invokeSync",
      this.invokeSync.bind(this),
      10,
      undefined,
      false,
      true,
      10
    );
  }

  async getAccessToken() {
    const expiredAt: number | undefined = this._store.get("expiredAt");
    if (expiredAt && new Date().getTime() > expiredAt) {
      await this.refreshAuth();
    }
    return this._store.get("accessToken");
  }

  async invokeSync() {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error("Access token is not available");
    }
    // Get the sync log from the store
    const syncLogs = this._store.get("syncLogs") || [];
    const syncUrl = new URL("http://localhost:3000/sync");
    // Send the sync log to the server
    const postResponse = await fetch(syncUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(syncLogs),
    }).catch((error) => {
      throw new Error("Failed to sync the data", error);
    });

    const lastSyncAt = this._store.get("lastSyncAt");
    if (lastSyncAt) {
      syncUrl.searchParams.set("since", lastSyncAt.toISOString());
    }
    const getResponse = await fetch(syncUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).catch((error) => {
      throw new Error("Failed to sync the data", error);
    });

    if (postResponse.ok && getResponse.ok) {
      // Clear the sync log and update the last sync time
      this._store.delete("syncLogs");
      this._store.delete("lastSyncAt");
      this._store.set("lastSyncAt", new Date());
    }

    // Merge the remote sync log with the local database
    const remoteSyncLogsResponse: {
      code: number;
      data: z.infer<typeof SyncLog>[];
    } = await getResponse.json();
    if (remoteSyncLogsResponse.code !== 2000) {
      throw new Error("Failed to sync the data: " + remoteSyncLogsResponse);
    }
    const remoteSyncLogs = remoteSyncLogsResponse.data.filter((log) => {
      // Filter out the logs we just sent (log_id appears in the local sync logs)
      return !syncLogs.find((localLog) => localLog.log_id === log.log_id);
    });
    for (const log of remoteSyncLogs) {
      const logValue = JSON.parse(log.value);
      if (!logValue) {
        continue;
      }
      switch (log.entity_type) {
        case "paper":
          switch (log.operation) {
            case "update":
              await PLAPILocal.paperService.update(
                logValue.paperEntityDrafts,
                logValue.updateCache,
                logValue.isUpdate,
                true
              );
              break;
            case "delete":
              await PLAPILocal.paperService.delete(
                logValue.ids,
                logValue.paperEntities,
                true
              );
              break;
            default:
              throw new Error("Unsupported operation: " + log.operation);
          }
          break;

        case "feed":
          switch (log.operation) {
            case "create":
              await PLAPILocal.feedService.create(
                JSON.parse(log.value).feeds,
                true
              );
              break;
            case "update":
              await PLAPILocal.feedService.update(
                JSON.parse(log.value).feeds,
                true
              );
              break;
            case "delete":
              const logValue = JSON.parse(log.value);
              await PLAPILocal.feedService.delete(logValue.ids, logValue.feeds);
              break;
            default:
              throw new Error("Unsupported operation: " + log.operation);
          }
          break;
        default:
          throw new Error("Unsupported entity type: " + log.entity_type);
      }
    }
  }

  async addSyncLog(log: z.infer<typeof SyncLog>) {
    let syncLogs = this._store.get("syncLogs") || [];
    syncLogs.push(log);
    this._store.delete("syncLogs");
    this._store.set("syncLogs", syncLogs);
  }

  async getUserInfo(): Promise<openidClient.UserInfoResponse> {
    const expiredAt: number | undefined = this._store.get("expiredAt");
    if (!expiredAt || new Date().getTime() > expiredAt) {
      await this.refreshAuth();
    }
    let userInfoStr = this._store.get("userInfo");
    if (userInfoStr) {
      return JSON.parse(userInfoStr);
    }
    // No user info, refresh the token

    const userInfo = await openidClient.fetchUserInfo(
      this._openidClientConfig!,
      this._store.get("accessToken")!,
      this._store.get("sub")!
    );
    this._store.delete("userInfo");
    this._store.set("userInfo", JSON.stringify(userInfo));
    return userInfo;
  }

  @processing(ProcessingKey.General)
  @errorcatching("Failed to refresh the access token", true, "SyncService")
  async refreshAuth() {
    const tokens = await openidClient.refreshTokenGrant(
      this._openidClientConfig!,
      this._store.get("refreshToken")!
    );
    console.log("Refreshed tokens", tokens);

    // Refresh user info
    const userInfo = await openidClient.fetchUserInfo(
      this._openidClientConfig!,
      tokens.access_token,
      this._store.get("sub")!
    );
    this._store.delete("userInfo");
    this._store.set("userInfo", JSON.stringify(userInfo));

    // Update expiration time
    if (tokens.expires_in && tokens.refresh_token) {
      const expiredAt = new Date().getTime() + tokens.expires_in * 1000;
      this._store.delete("expiredAt");
      this._store.set("expiredAt", expiredAt);
    }
    this._store.delete("accessToken");
    this._store.set("accessToken", tokens.access_token);
    this._store.delete("refreshToken");
    this._store.set("refreshToken", tokens.refresh_token);
    this._store.delete("idToken");
    this._store.set("idToken", tokens.id_token);
    return tokens;
  }

  async logoutOfficial() {
    let logoutUrl = openidClient.buildEndSessionUrl(this._openidClientConfig!, {
      // TODO: hint should be device ID, allow user to logout from specific device
      id_token_hint: this._store.get("idToken")!,
      post_logout_redirect_uri:
        "paperlib://v3.desktop.paperlib.app/PLAPI/syncService/handleLogoutOfficialCallback",
    });
    PLMainAPI.fileSystemService.openExternal(logoutUrl.href).then();
  }

  async handleLogoutOfficialCallback(callbackUrl: string) {
    this._store.delete("accessToken");
    this._store.delete("refreshToken");
    this._store.delete("idToken");
    this._store.delete("sub");
    this._store.delete("userInfo");
    await PLMainAPI.preferenceService.set({
      useSync: "none",
    });
  }
}
