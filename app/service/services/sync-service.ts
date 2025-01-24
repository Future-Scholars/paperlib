import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import ElectronStore from "electron-store";
import { processing, ProcessingKey } from "@/common/utils/processing";
import * as openidClient from "openid-client";

export interface ISyncServiceState {
  syncType: "none" | "Atlas" | "official" | "self-hosted";
  pkceCodeVerifier?: string;
  nonce?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  sub?: string;
  userInfo?: string;
}

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
  }

  @processing(ProcessingKey.General)
  @errorcatching("Login to official sync service failed", true, "SyncService")
  async invokeLoginOfficial() {
    if (!this._openidClientConfig) {
      await this.initialize();
    }
    // Login to the official sync service.
    const code_verifier = openidClient.randomPKCECodeVerifier();
    this._store.set("pkceCodeVerifier", code_verifier);
    const code_challenge = await openidClient.calculatePKCECodeChallenge(
      code_verifier
    );
    const nonce = openidClient.randomNonce();
    this._store.set("nonce", nonce);
    const params = {
      code_challenge,
      nonce,
      scope: "openid profile email sync:read sync:write offline_access",
      client_id: "ZYiqvQp2dbO4eiowGir6avJdIeP6hAOG",
      // TODO: Allow self hosted sync service (get url from preference)
      redirect_uri: "paperlib://PLAPI.syncService.handleLoginOfficialCallback/auth",
      code_challenge_method: "S256",
    };
    const authorizationUrl = openidClient.buildAuthorizationUrl(
      this._openidClientConfig!,
      params
    );
    PLMainAPI.fileSystemService.openExternal(authorizationUrl.href).then();
  }

  async handleLoginOfficialCallback({code} : {code: string}) {
    console.log("Handling callback", code);
    if (!this._openidClientConfig) {
      await this.initialize();
    }
    // Handle the callback from the official sync service.
    const tokens = await openidClient.authorizationCodeGrant(
      this._openidClientConfig!,
      new URL(`paperlib://PLAPI.syncService.handleLoginOfficialCallback/auth?code=${code}`),
      {
        pkceCodeVerifier: this._store.get("pkceCodeVerifier"),
        expectedNonce: this._store.get("nonce"),
        idTokenExpected: true,
      }
    );
    this._store.set("accessToken", tokens.access_token);
    this._store.set("refreshToken", tokens.refresh_token);
    this._store.set("idToken", tokens.id_token);
    this._store.set("sub", tokens.claims()!.sub);
  }

  async updateUserInfo() {
    const userInfo = await openidClient.fetchUserInfo(
      this._openidClientConfig!,
      this._store.get("accessToken")!,
      this._store.get("sub")!
    );
    this._store.set("userInfo", JSON.stringify(userInfo));
  }

  async getUserInfo() {
    return JSON.parse(this._store.get("userInfo")!);
  }

  async getAccessToken() {
    return this._store.get("accessToken");
  }

  @processing(ProcessingKey.General)
  async refresh() {
    const tokens = await openidClient.refreshTokenGrant(
      this._openidClientConfig!,
      this._store.get("refreshToken")!
    );
    this._store.set("accessToken", tokens.access_token);
    this._store.set("refreshToken", tokens.refresh_token);
    this._store.set("idToken", tokens.id_token);
  }

  async logoutOfficial() {
    let logoutUrl = openidClient.buildEndSessionUrl(this._openidClientConfig!, {
      // TODO: hint should be device ID, allow user to logout from specific device
      id_token_hint: this._store.get("sub")!,
      post_logout_redirect_uri:
        "paperlib://auth0.paperlib.app/app/logout/callback",
    });
    PLMainAPI.fileSystemService.openExternal(logoutUrl.href).then();
  }

  async handleLogoutOfficialCallback(callbackUrl: string) {
    this._store.delete("accessToken");
    this._store.delete("refreshToken");
    this._store.delete("idToken");
    this._store.delete("sub");
    this._store.delete("userInfo");
  }
}
