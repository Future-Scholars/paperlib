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

export class WindowControlService {
  constructor() {}

  /**
   * Minimize the window with the given id.
   * @param windowId - The id of the window to be minimized
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
   * @param windowId - The id of the window to be maximized
   */
  maximize(windowId: string) {
    if (windowId === "rendererProcess") {
      const win = browserWindows.get(windowId);
      win.maximize();
    }
  }

  /**
   * Close the window with the given id.
   * @param windowId - The id of the window to be closed
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
   * @param windowId - The id of the window to be force closed
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
}
