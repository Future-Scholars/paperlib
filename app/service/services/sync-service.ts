/**
 * Service for synchronization maintenance.
 * To avoid adding more data fields in current realm database, we will store the sync log in electron store.
 */

import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { processing, ProcessingKey } from "@/common/utils/processing";
import ElectronStore from "electron-store";
import * as openidClient from "openid-client";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

export interface ISyncServiceState {
  pkceCodeVerifier?: string;
  nonce?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  sub?: string;
  userInfo?: string;
  expiredAt?: number;
  syncLogs?: z.infer<typeof SyncLog>[];
  lastSyncAt?: string;
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
  value: z.any(), // JSON object of the new value
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
    super("syncService", {});
    this._store = new ElectronStore<ISyncServiceState>({
      name: "sync",
    });
  }

  private syncBaseUrl = new URL("https://coral-app-uijy2.ondigitalocean.app/");

  private _setStoreValue<K extends keyof ISyncServiceState>(
    key: K,
    value: ISyncServiceState[K]
  ) {
    // Delete first and then set to avoid merge issues in some ElectronStore implementations
    this._store.delete(key);
    this._store.set(key, value);
  }

  private _getStoreValue<K extends keyof ISyncServiceState>(
    key: K
  ): ISyncServiceState[K] | undefined {
    return this._store.get(key);
  }

  private _deleteStoreValue<K extends keyof ISyncServiceState>(key: K) {
    this._store.delete(key);
  }

  /**
   * Ensure _openidClientConfig is loaded, if not, perform discovery.
   * Avoid writing repeated if (!this._openidClientConfig) {...} in multiple places.
   */
  private async _ensureOidcConfig() {
    if (!this._openidClientConfig) {
      this._openidClientConfig = await openidClient.discovery(
        new URL("https://auth0.paperlib.app"),
        "JzGo9xzn3zbHM4He86JeHOCOu9FVAdim"
      );
      if (!this._openidClientConfig.serverMetadata().supportsPKCE()) {
        throw new Error("PKCE is not supported by the server");
      }
    }
  }

  @processing(ProcessingKey.General)
  @errorcatching("Failed to initialize sync service.", true, "SyncService")
  async initialize(reinit: boolean = true) {
    // 1) Initialize OIDC configuration
    await this._ensureOidcConfig();

    // 2) Check preferences, if using official sync, try to refresh token
    const syncType = await PLMainAPI.preferenceService.get("useSync");
    if (syncType === "official") {
      const tokens = await this.refreshAuth();
      if (!tokens) {
        // If refresh fails, force logout and re-login
        await this.handleLogoutOfficialCallback("");
        await this.invokeLoginOfficial();
        return;
      }

      // If refresh is successful, schedule the next refresh based on the new expiration time
      if (tokens.expires_in && tokens.refresh_token) {
        PLAPILocal.schedulerService.createTask(
          "syncService.refresh",
          this.refreshAuth.bind(this),
          // tokens.expires_in - 600, // Refresh about ten minutes before expiration
          // For testing convenience, change to 10 seconds
          10,
          undefined,
          false,
          false
        );
      }
      // Schedule a sync and create a sync task
      PLAPILocal.schedulerService.createTask(
        "syncService.invokeSync",
        this.invokeSync.bind(this),
        10, // Try to sync every 10 seconds
        undefined,
        false,
        false
      );
    }
  }

  @processing(ProcessingKey.General)
  @errorcatching("Login to official sync service failed", true, "SyncService")
  async invokeLoginOfficial() {
    // 1) Ensure OIDC configuration exists
    await this._ensureOidcConfig();

    // 2) Generate PKCE parameters and store them
    const codeVerifier = openidClient.randomPKCECodeVerifier();
    const nonce = openidClient.randomNonce();
    this._setStoreValue("pkceCodeVerifier", codeVerifier);
    this._setStoreValue("nonce", nonce);

    const codeChallenge = await openidClient.calculatePKCECodeChallenge(
      codeVerifier
    );

    // 3) Construct authorization URL
    const params = {
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      nonce,
      scope: "openid profile email sync:read sync:write offline_access",
      client_id: "JzGo9xzn3zbHM4He86JeHOCOu9FVAdim",
      redirect_uri:
        "paperlib://v3.desktop.paperlib.app/PLAPI/syncService/handleLoginOfficialCallback",
      audience: this.syncBaseUrl.origin,
    };

    const authorizationUrl = openidClient.buildAuthorizationUrl(
      this._openidClientConfig!,
      params
    );

    // 4) Open the URL with the system default browser to let the user complete the login
    PLMainAPI.fileSystemService.openExternal(authorizationUrl.href).then();
  }

  /**
   * Extract and encapsulate: when new tokens are obtained, write them to the store and update userInfo
   */
  private async _storeTokensAndUserInfo(
    tokens: openidClient.TokenEndpointResponse &
      openidClient.TokenEndpointResponseHelpers
  ) {
    // If tokens contain expiration duration, calculate the expiration timestamp and store it
    if (tokens.expires_in) {
      const expiredAt = new Date().getTime() + tokens.expires_in * 1000;
      this._setStoreValue("expiredAt", expiredAt);
    }

    // Write main tokens
    if (tokens.access_token)
      this._setStoreValue("accessToken", tokens.access_token);
    if (tokens.refresh_token)
      this._setStoreValue("refreshToken", tokens.refresh_token);
    if (tokens.id_token) this._setStoreValue("idToken", tokens.id_token);

    // Write sub
    // First check if there is a sub, if so, write it to the store
    const claims = tokens.claims();
    const sub = claims && claims.sub;
    if (sub) this._setStoreValue("sub", sub);

    // Update userInfo
    const accessToken = tokens.access_token;
    if (accessToken && sub) {
      const userInfo = await openidClient.fetchUserInfo(
        this._openidClientConfig!,
        accessToken,
        sub
      );
      this._setStoreValue("userInfo", JSON.stringify(userInfo));
    }
  }

  @processing(ProcessingKey.General)
  @errorcatching("Login to official sync service failed", true, "SyncService")
  async handleLoginOfficialCallback({ code }: { code: string }) {
    // 1) Ensure OIDC configuration exists
    await this._ensureOidcConfig();

    // 2) Get the currently stored pkceCodeVerifier, nonce
    const pkceCodeVerifier = this._getStoreValue("pkceCodeVerifier");
    const nonce = this._getStoreValue("nonce");
    if (!pkceCodeVerifier || !nonce) {
      throw new Error("Missing PKCE code verifier or nonce in store");
    }

    // 3) Use the authorization code to exchange for tokens
    const tokens = await openidClient.authorizationCodeGrant(
      this._openidClientConfig!,
      new URL(
        `paperlib://v3.desktop.paperlib.app/PLAPI/syncService/handleLoginOfficialCallback?code=${code}`
      ),
      {
        pkceCodeVerifier,
        expectedNonce: nonce,
        idTokenExpected: true,
      }
    );

    // 4) Schedule the next refresh
    if (tokens.expires_in && tokens.refresh_token) {
      PLAPILocal.schedulerService.createTask(
        "syncService.refresh",
        this.refreshAuth.bind(this),
        // 600, // Try to refresh in 10 minutes, can set the strategy as needed
        // For testing convenience, change to 10 seconds
        10,
        undefined,
        false,
        false
      );
    }

    // 5) Save token and other information
    await this._storeTokensAndUserInfo(tokens);

    // 6) Update user preferences
    await PLMainAPI.preferenceService.set({ useSync: "official" });

    // 7) Schedule a sync
    PLAPILocal.schedulerService.createTask(
      "syncService.invokeSync",
      this.invokeSync.bind(this),
      // 10, // Try to sync after 10 seconds
      // For testing convenience, change to 1 second
      10,
      undefined,
      false,
      false
    );
  }

  /**
   * Get a valid accessToken, if expired, automatically try to refresh
   */
  private async _getValidAccessToken(): Promise<string | null> {
    const expiredAt = this._getStoreValue("expiredAt");
    const now = new Date().getTime();

    // If it has expired, refresh it
    if (expiredAt && now > expiredAt) {
      const tokens = await this.refreshAuth();
      if (!tokens) {
        return null;
      }
    }
    // After refreshing or if not expired, check if there is an accessToken in the store
    const accessToken = this._getStoreValue("accessToken");
    return accessToken || null;
  }

  // ---------------------------
  // Refresh token
  //   - Requires refreshToken in the store
  //   - After successful refresh, update tokens and userInfo in the store
  // ---------------------------
  @processing(ProcessingKey.General)
  @errorcatching("Failed to refresh the access token", true, "SyncService")
  public async refreshAuth() {
    await this._ensureOidcConfig();

    const refreshToken = this._getStoreValue("refreshToken");
    if (!refreshToken) {
      // No refreshToken, cannot refresh, can only logout and re-login
      await this.handleLogoutOfficialCallback("");
      await this.invokeLoginOfficial();
      return null;
    }

    // Initiate refresh
    const tokens = await openidClient.refreshTokenGrant(
      this._openidClientConfig!,
      refreshToken
    );

    // Update local storage
    await this._storeTokensAndUserInfo(tokens);

    return tokens;
  }

  // ---------------------------
  // Initiate sync
 // 1. Get accessToken
 // 2. Pull remote `syncLogs` first
 // 3. Read local `syncLogs`
 // 4. **Merge using `last write wins` rule based on `log_id`**
 // 5. **Apply merged `syncLogs` to local**
 // 6. Push `mergedSyncLogs` to server
 // 7. Clear local `syncLogs` after confirming successful push
  // ---------------------------
  public async invokeSync() {
    // 1) Get a valid accessToken
    const accessToken = await this._getValidAccessToken();
    if (!accessToken) {
      throw new Error("Access token is not available for syncing.");
    }

    const syncUrl = new URL("/sync", this.syncBaseUrl);

    // 2) Pull incremental logs from the remote

    const lastSyncAt = this._getStoreValue("lastSyncAt");
    if (lastSyncAt) {
      syncUrl.searchParams.set("since", lastSyncAt);
    }

    // FIXME: replace fetch with a network service for proxy?
    const getResponse: { code: number; data: z.infer<typeof SyncLog>[] } =
      await fetch(syncUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .catch((error) => {
          throw new Error("Failed to sync data (GET). " + error);
        });

    // 3) Process the data returned from the remote and merge it with the local database
    if (getResponse.code !== 2000) {
      throw new Error("Failed to sync data (GET): " + JSON.stringify(getResponse));
    }

    const localLogs = this._getStoreValue("syncLogs") || [];

    const remoteLogs = getResponse.data || [];
    // Filter out logs that have already been pushed locally
    const filteredLogs = remoteLogs.filter(
      // 1. local log_id is different from remote log_id
      // 2. timestamp is later than lastSyncAt
      (r) =>
        (!localLogs.some(
          (local) =>
            local.log_id === r.log_id)) &&
        (!lastSyncAt || new Date(r.timestamp) > new Date(lastSyncAt))
    );


    // 4) Push local logs to the server
    if (localLogs.length > 0) {
      const postResponse = await fetch(syncUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(localLogs),
      }).catch((error) => {
        throw new Error("Failed to sync data (POST). " + error);
      });
      if (!postResponse.ok) {
        throw new Error(
          "Failed to sync data (POST). " + postResponse.statusText
        );
      }
      const postResponseData = await postResponse.json();
      if (postResponseData.code !== 2010) {
        throw new Error(
          "Failed to sync data: " + JSON.stringify(postResponseData)
        );
      }
      // If push is successful, update lastSyncAt
      this._deleteStoreValue("syncLogs");
      this._setStoreValue("lastSyncAt", new Date().toISOString());
    }

    // 5) Execute merge logic
    for (const log of filteredLogs) {
      if (!log.value) continue;

      const logValue = JSON.parse(log.value);
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
            case "create":
              // If create needs to be supported, add it yourself.
              // Currently we merged the create operation into the update operation.
              break;
            default:
              throw new Error("Unsupported paper operation: " + log.operation);
          }
          break;
        case "feed":
          switch (log.operation) {
            case "create":
              await PLAPILocal.feedService.create(logValue.feeds, true);
              break;
            case "update":
              await PLAPILocal.feedService.update(logValue.feeds, true);
              break;
            case "delete":
              await PLAPILocal.feedService.delete(logValue.ids, logValue.feeds);
              break;
            default:
              throw new Error("Unsupported feed operation: " + log.operation);
          }
          break;
        default:
          throw new Error("Unsupported entity type: " + log.entity_type);
      }
    }
  }

  /**
   * Add a local sync record, store it locally and wait for the next sync
   */
  public async addSyncLog(
    entity_type: z.infer<typeof SyncLog>["entity_type"],
    operation: z.infer<typeof SyncLog>["operation"],
    value: z.infer<typeof SyncLog>["value"]
  ) {
    const logs = this._getStoreValue("syncLogs") || [];
    const syncLogDatetime = new Date().toISOString();
    const syncLog: z.infer<typeof SyncLog> = {
      log_id: uuidv4(),
      entity_type,
      operation,
      value,
      timestamp: syncLogDatetime,
      created_at: syncLogDatetime,
      updated_at: syncLogDatetime,
    };
    logs.push(syncLog);
    this._setStoreValue("syncLogs", logs);
  }

  /**
   * Get user information, if accessToken is expired, it will automatically refresh
   */
  public async getUserInfo(): Promise<openidClient.UserInfoResponse> {
    await this._ensureOidcConfig();

    // If it has not expired or refreshed successfully, get the local userInfo
    const userInfoStr = this._getStoreValue("userInfo");
    if (userInfoStr) {
      try {
        return JSON.parse(userInfoStr);
      } catch (e) {
        // If JSON parse fails, you can choose to delete the data in the store as needed
        this._deleteStoreValue("userInfo");
      }
    }
    // If there is no local data or it is corrupted, use the current accessToken to fetch from the remote
    const accessToken = await this._getValidAccessToken();
    const sub = this._getStoreValue("sub");
    if (accessToken && sub) {
      const userInfo = await openidClient.fetchUserInfo(
        this._openidClientConfig!,
        accessToken,
        sub
      );
      this._setStoreValue("userInfo", JSON.stringify(userInfo));
      return userInfo;
    }
    throw new Error("Unable to get valid user info");
  }

  // ---------------------------
  // Logout
  //   - Requires idToken in the store to construct the logout URL
  // ---------------------------
  public async logoutOfficial() {
    await this._ensureOidcConfig();

    const idToken = this._getStoreValue("idToken");
    if (!idToken) {
      // If there is no idToken locally, you can directly perform local logout
      await this.handleLogoutOfficialCallback("");
      return;
    }

    const logoutUrl = openidClient.buildEndSessionUrl(
      this._openidClientConfig!,
      {
        id_token_hint: idToken,
        post_logout_redirect_uri:
          "paperlib://v3.desktop.paperlib.app/PLAPI/syncService/handleLogoutOfficialCallback",
      }
    );

    // Call the external browser to open the logout link
    PLMainAPI.fileSystemService.openExternal(logoutUrl.href).then();
  }

  // ---------------------------
  // Logout callback
  //   - Clear local tokens, userInfo, expiration time, etc.
  //   - Keep or clear syncLogs based on business needs
  // ---------------------------
  public async handleLogoutOfficialCallback(_callbackUrl: string) {
    this._deleteStoreValue("accessToken");
    this._deleteStoreValue("refreshToken");
    this._deleteStoreValue("idToken");
    this._deleteStoreValue("sub");
    this._deleteStoreValue("userInfo");
    this._deleteStoreValue("expiredAt");
    this._deleteStoreValue("pkceCodeVerifier");
    this._deleteStoreValue("nonce");

    // Clear syncLogs based on business needs
    // this._deleteStoreValue("syncLogs");

    this._deleteStoreValue("lastSyncAt");

    // Update user preferences
    await PLMainAPI.preferenceService.set({ useSync: "none" });
  }
}
