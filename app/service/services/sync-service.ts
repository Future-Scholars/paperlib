/**
 * Service for synchronization maintenance.
 * To avoid adding more data fields in current realm database, we will store the sync log in electron store.
 */

import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { processing, ProcessingKey } from "@/common/utils/processing";
import { DEFAULT_SYNC_STATE, ISyncState, syncStateStore } from "./sync/states";
import { attach, pull, push } from "./sync/sync-client";
import { ILogService, LogService } from "@/common/services/log-service";
import { ISchedulerService, SchedulerService } from "@/service/services/scheduler-service";
import { IPaperEntityRepository, PaperEntityRepository } from "@/service/repositories/db-repository/paper-entity-repository";
import { FeedRepository, IFeedRepository } from "../repositories/db-repository/feed-repository";
import { CategorizerRepository, ICategorizerRepository } from "../repositories/db-repository/categorizer-repository";
import { DatabaseCore, IDatabaseCore } from "./database/core";

export interface UserInfo {
  sub: string;
  name: string;
  email: string;
  picture: string;
}
export interface ISyncServiceState {
  connected: boolean;
  syncProgress: number; // -1: not syncing, positive: syncing [0, 1]
  userInfo: UserInfo | null;
  accessToken: string | null;
}

const _DEFAULTSTATE: ISyncServiceState = {
  connected: false,
  syncProgress: -1,
  userInfo: null,
  accessToken: null,
};

const ISSUER = "https://dev.better-auth.paperlib.app";
const CLIENT_ID = "rObSDWEAuDzhsEZXVNDiOCXZpohYhEOK";
const REDIRECT_URI = "paperlib://v3.desktop.paperlib.app/PLAPI/syncService/handleLoginOfficialCallback";
const AUDIENCE = "paperlib://v3.desktop.paperlib.app";
const SCOPE = "offline_access openid profile email";



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

  @processing(ProcessingKey.General)
  @errorcatching("Failed to set API key.", true, "SyncService")
  async setAccessToken(apiKey: string) {
    this._setStoreValue("accessToken", apiKey);
    try {
      await attach("main");
    } catch (error) {
      this._deleteStoreValue("accessToken");
      if (error instanceof Error) {
        throw new Error("Failed to set API key: " + error.message);
      } else {
        throw new Error("Failed to set API key: Unknown error");
      }
    }
  }


  @processing(ProcessingKey.General)
  @errorcatching("Failed to initialize sync service.", true, "SyncService")
  async initialize(reinit: boolean = true) {

    const accessToken = this._getStoreValue("accessToken") || null;
    if (!accessToken) {
      this.handleLogoutOfficialCallback();
    }

    // 1) Check preferences, if using official sync, try to refresh token
    const syncType = await PLMainAPI.preferenceService.get("useSync");
    if (syncType === "official") {
      // 2) Check if the access token is valid
      const accessToken = this._getStoreValue("accessToken") || null;
      if (!accessToken) {
        this.handleLogoutOfficialCallback();
      }
      else {
        // 3) Schedule a sync and create a sync task
        this._schedulerService.createTask(
          "syncService.invokeSync",
          this.invokeSync.bind(this),
          10, // Try to sync every 10 seconds
          undefined,
          false,
          false
        );
      }
    }
    this._logService.info("SyncService initialized");
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

    // 1) Get accessToken from store
    const accessToken = this._getStoreValue("accessToken") || null;
    if (!accessToken) {
      this.handleLogoutOfficialCallback();
      return;
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
  public async getUserInfo(): Promise<UserInfo | null> {
    const accessToken = this._getStoreValue("accessToken") || null;
    if (!accessToken) {
      return null;
    }
    try {
      const response: UserInfo = await fetch(ISSUER + "/api/auth/userinfo", {
        headers: {
          "Authorization": "Bearer " + accessToken,
        },
      }).then(response => {
        if (!response.ok) {
          throw new Error("Failed to get user info: " + response.statusText);
        }
        return response.json();
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error("Failed to get user info: " + error.message);
      } else {
        throw new Error("Failed to get user info: Unknown error");
      }
    }
  }


  // ---------------------------
  // Logout callback
  //   - Clear local tokens, userInfo, expiration time, etc.
  //   - Keep or clear syncLogs based on business needs
  // ---------------------------
  public async handleLogoutOfficialCallback() {
    this._setStoreValue("connected", false);
    this._deleteStoreValue("accessToken");
    this._deleteStoreValue("userInfo");
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
