import {
  BrowserWindow,
  Menu,
  MessageChannelMain,
  app,
  nativeTheme,
  shell,
  utilityProcess,
} from "electron";
import { join, posix } from "node:path";
import os from "os";

export enum APPTheme {
  System = "system",
  Light = "light",
  Dark = "dark",
}

export class WindowControlService {
  constructor() {}

  /**
   * Minimize the window with the given id.
   */
  minimize(windowId: string) {
    if (windowId === "rendererProcess") {
      const win = browserWindows.get(windowId);
      win.minimize();

      for (const [windowId, win] of Object.entries(browserWindows.all())) {
        if (windowId !== "rendererProcess") {
          win.hide();
        }
      }
    }
  }

  /**
   * Maximize the window with the given id.
   */
  maximize(windowId: string) {
    if (windowId === "rendererProcess") {
      const win = browserWindows.get(windowId);
      win.maximize();
    }
  }

  /**
   * Close the window with the given id.
   */
  close(windowId: string) {
    if (os.platform() === "darwin") {
      if (windowId === "rendererProcess") {
        for (const [windowId, win] of Object.entries(browserWindows.all())) {
          win.hide();
        }
      } else {
        const win = browserWindows.get(windowId);
        win.hide();
      }
    } else {
      if (windowId === "rendererProcess") {
        for (const [windowId, win] of Object.entries(browserWindows.all())) {
          win.close();
        }
        app.quit();
      } else {
        const win = browserWindows.get(windowId);
        win.close();
      }
    }
  }

  /**
   * Force close the window with the given id.
   */
  forceClose(windowId: string) {
    if (windowId === "rendererProcess") {
      for (const [windowId, win] of Object.entries(browserWindows.all())) {
        win.close();
      }
    } else {
      const win = browserWindows.get(windowId);
      win.close();
    }
  }

  /**
   * Change the theme of the app.
   * @param theme - The theme to be changed to
   */
  changeTheme(theme: APPTheme, windowId: string) {
    nativeTheme.themeSource = theme;
  }

  /**
   * Check if the app is in dark mode.
   * @returns - Whether the app is in dark mode
   */
  isDarkMode(windowId: string): boolean {
    return nativeTheme.shouldUseDarkColors;
  }
}
