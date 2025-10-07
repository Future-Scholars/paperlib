/**
 * Service for synchronization maintenance.
 * To avoid adding more data fields in current realm database, we will store the sync log in electron store.
 */

import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { processing, ProcessingKey } from "@/common/utils/processing";
import * as openidClient from "openid-client";
import { DEFAULT_SYNC_STATE, ISyncState, syncStateStore } from "./sync/states";
import { attach, pull, push } from "./sync/sync-client";
import { UserInfoResponse } from "openid-client";
import { ILogService, LogService } from "@/common/services/log-service";
import { ISchedulerService, SchedulerService } from "@/service/services/scheduler-service";
import { IPaperEntityRepository, PaperEntityRepository } from "@/service/repositories/db-repository/paper-entity-repository";
import { FeedRepository, IFeedRepository } from "../repositories/db-repository/feed-repository";
import { CategorizerRepository, ICategorizerRepository } from "../repositories/db-repository/categorizer-repository";
import { DatabaseCore, IDatabaseCore } from "./database/core";

export interface ISyncServiceState {
  connected: boolean;
  syncProgress: number; // -1: not syncing, positive: syncing [0, 1]
  userInfo: UserInfoResponse | null;
}

const _DEFAULTSTATE: ISyncServiceState = {
  connected: false,
  syncProgress: -1,
  userInfo: null,
};


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

  constructor(
    @IDatabaseCore private readonly _databaseCore: DatabaseCore,
    @ISchedulerService private readonly _schedulerService: SchedulerService,
    @ILogService private readonly _logService: LogService,
    @IPaperEntityRepository private readonly _paperEntityRepository: PaperEntityRepository,
    @IFeedRepository private readonly _feedRepository: FeedRepository,
    @ICategorizerRepository private readonly _categorizerRepository: CategorizerRepository,
  ) {
    super("syncService", _DEFAULTSTATE);
  }

  private _setStoreValue<K extends keyof ISyncState>(
    key: K,
    value: ISyncState[K]
  ) {
    // Delete first and then set to avoid merge issues in some ElectronStore implementations
    syncStateStore.delete(key);
    syncStateStore.set(key, value);

    // Emit event
    this.fire({
      [key]: value,
    }, false);
  }

  private _getStoreValue<K extends keyof ISyncState>(
    key: K
  ): ISyncState[K] | undefined {
    return syncStateStore.get(key);
  }

  private _deleteStoreValue<K extends keyof ISyncState>(key: K) {
    this._setStoreValue(key, DEFAULT_SYNC_STATE[key]);
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
        this._schedulerService.createTask(
          "syncService.refresh",
          this.refreshAuth.bind(this),
          // tokens.expires_in - 600, // Refresh about 10 minutes before expiration
          // TODO: For testing convenience, change to 10 seconds
          10,
          undefined,
          false,
          false
        );
      }

      // Schedule a sync and create a sync task
      this._schedulerService.createTask(
        "syncService.invokeSync",
        this.invokeSync.bind(this),
        10, // Try to sync every 10 seconds
        undefined,
        false,
        false
      );
    }
    this._logService.info("SyncService initialized");
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
      scope: "offline_access openid profile email sync.read",
      client_id: "JzGo9xzn3zbHM4He86JeHOCOu9FVAdim",
      redirect_uri:
        "paperlib://v3.desktop.paperlib.app/PLAPI/syncService/handleLoginOfficialCallback",
      audience: "http://localhost:3001",
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
      this._setStoreValue("accessTokenExpiredAt", expiredAt);
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

      this._setStoreValue("userInfo", userInfo);
      this._setStoreValue("connected", true);
      this.fire({ userInfo: userInfo });
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
      this._setStoreValue("connected", false);
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
      this._schedulerService.createTask(
        "syncService.refresh",
        this.refreshAuth.bind(this),
        tokens.expires_in,
        undefined,
        false,
        true
      );
    }

    // 5) Save token and other information
    await this._storeTokensAndUserInfo(tokens);
    this._setStoreValue("connected", true);

    // 6) Update user preferences
    await PLMainAPI.preferenceService.set({ useSync: "official" });
    await attach("main");
    // 7) Schedule a sync
    this._schedulerService.createTask(
      "syncService.invokeSync",
      this.invokeSync.bind(this),
      // 10, // Try to sync after 10 seconds
      // For testing convenience, change to 1 second
      10,
      undefined, // error handler
      true, // run immediately
      false // not to run once
    );
  }

  /**
   * Get a valid accessToken, if expired, automatically try to refresh
   */
  private async _getValidAccessToken(): Promise<string | null> {
    const expiredAt = this._getStoreValue("accessTokenExpiredAt");
    const now = new Date().getTime();

    // If it has expired, refresh it
    if (expiredAt && now > expiredAt) {
      const tokens = await this.refreshAuth();
      if (!tokens) {
        this._setStoreValue("connected", false);
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
    // Schedule the next refresh
    if (tokens.expires_in && tokens.refresh_token) {
      this._schedulerService.removeTask("syncService.refresh");
      this._schedulerService.createTask(
        "syncService.refresh",
        this.refreshAuth.bind(this),
        tokens.expires_in,
        undefined,
        false,
        true
      );
    }

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
    // TODO: check if network is available.

    // 1) Get a valid accessToken
    const accessToken = await this._getValidAccessToken();
    if (!accessToken) {
      throw new Error("Access token is not available for syncing.");
    }
    try {
      await attach("main");
      // this.fire({ syncProgress: 0.3 });
      await pull(
        this._paperEntityRepository,
        this._feedRepository,
        this._categorizerRepository,
        this._databaseCore,
      );
      // this.fire({ syncProgress: 0.7 });
      await push();
      syncStateStore.delete("lastSyncAt");
      syncStateStore.set("lastSyncAt", new Date().getTime());
      // this.fire({ syncProgress: 1 });
    } catch (error) {
      // if (error instanceof Error && error.message.includes("Unauthorized")) {
      //   this.handleLogoutOfficialCallback("");
      // } else {
      //   throw error;
      // }
      throw error;
    }

  }


  /**
   * Get user information, if accessToken is expired, it will automatically refresh
   */
  public async getUserInfo(): Promise<openidClient.UserInfoResponse> {
    await this._ensureOidcConfig();

    // If it has not expired or refreshed successfully, get the local userInfo
    const userInfo = this._getStoreValue("userInfo");
    if (userInfo) {
      try {
        return userInfo;
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
      this._setStoreValue("userInfo", userInfo);
      this.fire({ userInfo: userInfo });
      return userInfo;
    }
    this.handleLogoutOfficialCallback("");
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
    this._setStoreValue("connected", false);
    this._deleteStoreValue("accessToken");
    this._deleteStoreValue("refreshToken");
    this._deleteStoreValue("idToken");
    this._deleteStoreValue("sub");
    this._deleteStoreValue("userInfo");
    this._deleteStoreValue("accessTokenExpiredAt");
    this._deleteStoreValue("pkceCodeVerifier");
    this._deleteStoreValue("nonce");

    // Clear syncLogs based on business needs
    // this._deleteStoreValue("syncLogs");

    this._deleteStoreValue("lastSyncAt");

    // Update user preferences
    await PLMainAPI.preferenceService.set({ useSync: "none" });

    // Clear scheduled tasks
    this._schedulerService.removeTask("syncService.refresh");
    this._schedulerService.removeTask("syncService.invokeSync");
  }

  useState(): ISyncServiceState {
    if (this._eventStateProxy) {
      return this._eventStateProxy;
    } else {
      this._eventStateProxy = new Proxy(this._eventState, {
        get: (target, prop) => {
          return target[prop as keyof ISyncServiceState];
        },
        set: (_target, prop, value) => {
          this.fire({ [prop as any]: value }, true);
          return true;
        },
      });

      return this._eventStateProxy;
    }
  }
}
