import { ipcRenderer } from "electron";
import os from "os";

import { createDecorator } from "@/base/injection/injection";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import { APPTheme } from "@/main/services/window-control-service";

export const IAPPService = createDecorator("appService");

export class APPService {
  constructor(
    @IPreferenceService private readonly preferenceService: PreferenceService
  ) {}

  /**
   * Get the current version of the application.
   * @returns
   */
  async version(): Promise<string> {
    return await ipcRenderer.invoke("version");
  }

  /**
   * Get the current platform of the application.
   * @returns
   */
  platform(): NodeJS.Platform {
    return os.platform();
  }

  /**
   * Get the current user data path of the application.
   * @returns
   */
  async userDataPath(): Promise<string> {
    return await ipcRenderer.invoke("user-data-path");
  }

  /**
   * Minimize the application window. */
  minimize() {
    PLMainAPI.windowControlService.minimize();
  }
  /**
   * Maximize the application window. */
  maximize() {
    PLMainAPI.windowControlService.maximize();
  }
  /**
   * Close the application window. */
  close() {
    PLMainAPI.windowControlService.close();
  }
  /**
   * Force close the application window. */
  forceClose() {
    PLMainAPI.windowControlService.forceClose();
  }
  /**
   * Change the theme of the application.
   * @param {APPTheme} theme The theme to change to. */
  changeTheme(theme: APPTheme) {
    PLMainAPI.windowControlService.changeTheme(theme);
  }

  /**
   * Check if this is the first time running of the current version.
   */
  async isVersionChanged(): Promise<boolean> {
    const lastVersion = this.preferenceService.get("lastVersion");
    return lastVersion !== (await this.version());
  }
}
