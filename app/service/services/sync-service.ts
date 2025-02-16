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
import { v4 as uuidv4 } from "uuid";

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

  private _setStoreValue<K extends keyof ISyncServiceState>(
    key: K,
    value: ISyncServiceState[K]
  ) {
    // 先删后设，避免有些 ElectronStore 实现里 merge 的问题
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
   * 确保 _openidClientConfig 已经加载，如没有就做 discovery。
   * 避免在多处写重复的 if (!this._openidClientConfig) {...}。
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
    // 1) 初始化 OIDC 配置
    await this._ensureOidcConfig();

    // 2) 检查偏好设置，如果使用官方 sync，则尝试刷新 token
    const syncType = await PLMainAPI.preferenceService.get("useSync");
    if (syncType === "official") {
      const tokens = await this.refreshAuth();
      if (!tokens) {
        // 刷新失败，则强制登出并重新登录
        await this.handleLogoutOfficialCallback("");
        await this.invokeLoginOfficial();
        return;
      }

      // 如果成功刷新，则根据新的过期时间安排下次刷新
      if (tokens.expires_in && tokens.refresh_token) {
        PLAPILocal.schedulerService.createTask(
          "syncService.refresh",
          this.refreshAuth.bind(this),
          // tokens.expires_in - 600, // 过期前十分钟左右再刷新
          // 为了方便测试，改为 10 秒
          10,
          undefined,
          false,
          false,
        );
      }
      // 安排一次同步, 并创建一个同步任务
      PLAPILocal.schedulerService.createTask(
        "syncService.invokeSync",
        this.invokeSync.bind(this),
        10, // 10 秒后尝试同步
        undefined,
        false,
        false
      );
    }
  }

  @processing(ProcessingKey.General)
  @errorcatching("Login to official sync service failed", true, "SyncService")
  async invokeLoginOfficial() {
    // 1) 确保 OIDC 配置存在
    await this._ensureOidcConfig();

    // 2) 生成 PKCE 参数并存储
    const codeVerifier = openidClient.randomPKCECodeVerifier();
    const nonce = openidClient.randomNonce();
    this._setStoreValue("pkceCodeVerifier", codeVerifier);
    this._setStoreValue("nonce", nonce);

    const codeChallenge = await openidClient.calculatePKCECodeChallenge(
      codeVerifier
    );

    // 3) 构造授权地址
    const params = {
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      nonce,
      scope: "openid profile email sync:read sync:write offline_access",
      client_id: "JzGo9xzn3zbHM4He86JeHOCOu9FVAdim",
      redirect_uri:
        "paperlib://v3.desktop.paperlib.app/PLAPI/syncService/handleLoginOfficialCallback",
      audience: "http://localhost:3000",
    };

    const authorizationUrl = openidClient.buildAuthorizationUrl(
      this._openidClientConfig!,
      params
    );

    // 4) 用系统默认浏览器打开该地址，让用户完成登录
    PLMainAPI.fileSystemService.openExternal(authorizationUrl.href).then();
  }

  /**
   * 提取封装：当获取到新的 token 时，统一写入 store 并更新 userInfo
   */
  private async _storeTokensAndUserInfo(
    tokens: openidClient.TokenEndpointResponse &
      openidClient.TokenEndpointResponseHelpers
  ) {
    // 如果 tokens 中有过期时长，则计算过期时间戳存储
    if (tokens.expires_in) {
      const expiredAt = new Date().getTime() + tokens.expires_in * 1000;
      this._setStoreValue("expiredAt", expiredAt);
    }

    // 写入主要 token
    if (tokens.access_token)
      this._setStoreValue("accessToken", tokens.access_token);
    if (tokens.refresh_token)
      this._setStoreValue("refreshToken", tokens.refresh_token);
    if (tokens.id_token) this._setStoreValue("idToken", tokens.id_token);

    // 写入 sub
    // 先检查是否有 sub，有则写入 store
    const claims = tokens.claims();
    const sub = claims && claims.sub;
    if (sub) this._setStoreValue("sub", sub);

    // 更新 userInfo
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
    // 1) 确保 OIDC 配置存在
    await this._ensureOidcConfig();

    // 2) 获取当前存储的 pkceCodeVerifier, nonce
    const pkceCodeVerifier = this._getStoreValue("pkceCodeVerifier");
    const nonce = this._getStoreValue("nonce");
    if (!pkceCodeVerifier || !nonce) {
      throw new Error("Missing PKCE code verifier or nonce in store");
    }

    // 3) 使用授权码交换 token
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

    // 4) 设置下一次刷新计划
    if (tokens.expires_in && tokens.refresh_token) {
      PLAPILocal.schedulerService.createTask(
        "syncService.refresh",
        this.refreshAuth.bind(this),
        // 600, // 10 分钟后尝试刷新，可以自行设置策略
        // 为了方便测试，改为 10 秒
        10,
        undefined,
        false,
        false
      );
    }

    // 5) 保存 token 等信息
    await this._storeTokensAndUserInfo(tokens);

    // 6) 更新用户偏好
    await PLMainAPI.preferenceService.set({ useSync: "official" });

    // 7) 安排一次同步
    PLAPILocal.schedulerService.createTask(
      "syncService.invokeSync",
      this.invokeSync.bind(this),
      // 10, // 10 秒后尝试同步
      // 为了方便测试，改为 1 秒
      1,
      undefined,
      false,
      false
    );
  }

  /**
   * 获取可用的 accessToken，如果过期则自动尝试刷新
   */
  private async _getValidAccessToken(): Promise<string | null> {
    const expiredAt = this._getStoreValue("expiredAt");
    const now = new Date().getTime();

    // 如果已经过期了，就刷新
    if (expiredAt && now > expiredAt) {
      const tokens = await this.refreshAuth();
      if (!tokens) {
        return null;
      }
    }
    // 刷新完或没有过期，看看现在 store 中有没有 accessToken
    const accessToken = this._getStoreValue("accessToken");
    return accessToken || null;
  }

  // ---------------------------
  // 刷新 token
  //   - 需要 store 中的 refreshToken
  //   - 刷新成功后更新 store 中的 token 和 userInfo
  // ---------------------------
  @processing(ProcessingKey.General)
  @errorcatching("Failed to refresh the access token", true, "SyncService")
  public async refreshAuth() {
    await this._ensureOidcConfig();

    const refreshToken = this._getStoreValue("refreshToken");
    if (!refreshToken) {
      // 没有 refreshToken，无法刷新，只能登出再登录
      await this.handleLogoutOfficialCallback("");
      await this.invokeLoginOfficial();
      return null;
    }

    // 发起刷新
    const tokens = await openidClient.refreshTokenGrant(
      this._openidClientConfig!,
      refreshToken
    );

    // 更新本地存储
    await this._storeTokensAndUserInfo(tokens);

    return tokens;
  }


// ---------------------------
  // 发起同步
  //   - 需要 store 中的 syncLogs, lastSyncAt
  //   - 如果有 accessToken 则进行 push + pull
  // ---------------------------
  public async invokeSync() {
    // 1) 获取有效 accessToken
    const accessToken = await this._getValidAccessToken();
    if (!accessToken) {
      throw new Error("Access token is not available for syncing.");
    }

    // 2) 推送本地日志到服务器
    const localLogs = this._getStoreValue("syncLogs") || [];
    const syncUrl = new URL("http://localhost:3000/sync");
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
        throw new Error("Failed to sync data (POST). " + postResponse.statusText);
      }
      const postResponseData = await postResponse.json();
      if (postResponseData.code !== 2010) {
        throw new Error("Failed to sync data: " + JSON.stringify(postResponseData));
      }
      // 如果成功推送，清空本地 syncLogs
      this._deleteStoreValue("syncLogs");
      this._setStoreValue("lastSyncAt", new Date().toISOString());
    }
    // 3) 拉取远端的增量日志
    const lastSyncAt = this._getStoreValue("lastSyncAt");
    if (lastSyncAt) {
      syncUrl.searchParams.set("since", lastSyncAt);
    }

    const getResponse = await fetch(syncUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch((error) => {
      throw new Error("Failed to sync data (GET). " + error);
    });
    if (!getResponse.ok) {
      throw new Error("Failed to sync data (GET). " + getResponse.statusText);
    }

    // 4) 处理远端返回的数据，与本地数据库合并
    const remoteData: { code: number; data: z.infer<typeof SyncLog>[] } = await getResponse.json();
    if (remoteData.code !== 2000) {
      throw new Error("Failed to sync data: " + JSON.stringify(remoteData));
    }

    const remoteLogs = remoteData.data || [];
    // 过滤掉与本地已经推送的重复 log
    const filteredLogs = remoteLogs.filter(
      (r) => !localLogs.some((local) => local.log_id === r.log_id)
    );

    // 6) 执行合并逻辑
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
              // 如果需要支持 create，则自行添加
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
   * 添加一条本地同步记录，先存在本地等待下次同步
   */
  public async addSyncLog(entity_type: z.infer<typeof SyncLog>["entity_type"], operation: z.infer<typeof SyncLog>["operation"], value: z.infer<typeof SyncLog>["value"]) {
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
   * 获取用户信息，如果 accessToken 过期会自动刷新
   */
  public async getUserInfo(): Promise<openidClient.UserInfoResponse> {
    await this._ensureOidcConfig();

    // 如果没有过期或刷新成功，再获取本地 userInfo
    const userInfoStr = this._getStoreValue("userInfo");
    if (userInfoStr) {
      try {
        return JSON.parse(userInfoStr);
      } catch (e) {
        // 如果 JSON parse 失败，可以视情况删除 store 中的数据
        this._deleteStoreValue("userInfo");
      }
    }
    // 如果本地没有或已损坏，就用当前 accessToken 去远端拉取
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
  // 登出
  //   - 需要 store 中的 idToken，用于构造登出 URL
  // ---------------------------
  public async logoutOfficial() {
    await this._ensureOidcConfig();

    const idToken = this._getStoreValue("idToken");
    if (!idToken) {
      // 如果本地已经没有 idToken，可以直接做本地登出即可
      await this.handleLogoutOfficialCallback("");
      return;
    }

    const logoutUrl = openidClient.buildEndSessionUrl(this._openidClientConfig!, {
      id_token_hint: idToken,
      post_logout_redirect_uri: "paperlib://v3.desktop.paperlib.app/PLAPI/syncService/handleLogoutOfficialCallback",
    });

    // 调用外部浏览器打开注销链接
    PLMainAPI.fileSystemService.openExternal(logoutUrl.href).then();
  }

  // ---------------------------
  // 登出回调
  //   - 清理本地的 token、userInfo、过期时间等
  //   - 保留或清空 syncLogs 看业务需求
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

    // 同步日志是否清理，根据业务需要做选择
    // this._deleteStoreValue("syncLogs");

    this._deleteStoreValue("lastSyncAt");

    // 更新用户偏好
    await PLMainAPI.preferenceService.set({ useSync: "none" });
  }

}
