import { ipcRenderer } from "electron";
import os from "os";

import { createDecorator } from "@/base/injection/injection";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";

export enum APPTheme {
  System = "system",
  Light = "light",
  Dark = "dark",
}

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
    ipcRenderer.send("minimize");
  }
  /**
   * Maximize the application window. */
  maximize() {
    PLMainAPI.windowControlService.maximize();
  }
  /**
   * Close the application window. */
  close() {
    ipcRenderer.send("close");
  }
  /**
   * Force close the application window. */
  forceClose() {
    ipcRenderer.send("force-close");
  }
  /**
   * Change the theme of the application.
   * @param {APPTheme} theme The theme to change to. */
  changeTheme(theme: APPTheme) {
    ipcRenderer.send("theme-change", theme);
  }

  /**
   * Check if this is the first time running of the current version.
   */
  async isVersionChanged(): Promise<boolean> {
    const lastVersion = this.preferenceService.get("lastVersion");
    return lastVersion !== (await this.version());
  }
}
