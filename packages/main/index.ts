import { app, BrowserWindow, ipcMain, globalShortcut } from "electron";
import { release, platform } from "os";
import Store from "electron-store";

import "./files.ts";
import "./theme.ts";
import "./update.ts";

import { createMainWindow } from "./win_main/index";
import {
  createPluginWindow,
  setMainPluginCommunicationChannel,
} from "./win_plugin/index";

import { registerSideworkWindowEvents } from "./win_sidework/event";

import { registerMainContextMenu } from "./win_main/contextmenu";

Store.initRenderer();
const preference = new Store({});

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

let win: BrowserWindow | null = null;
let winPlugin: BrowserWindow | null = null;
let winSidework: BrowserWindow | null = null;

async function createWindow() {
  win = await createMainWindow(win, preference, winPlugin, winSidework);

  globalShortcut.register(
    (preference.get("shortcutPlugin") as string) || "CommandOrControl+Shift+I",
    async () => {
      // win?.blur();
      if (winPlugin === null || winPlugin?.isDestroyed()) {
        winPlugin = await createPluginWindow(winPlugin);
        winPlugin.on("show", () => {
          setMainPluginCommunicationChannel(win, winPlugin);
        });

        winPlugin.on("hide", () => {
          winPlugin?.setSize(600, 76);

          if (platform() === "darwin") {
            win?.hide();
            app.hide();
          }
        });
      }
      winPlugin?.show();
    }
  );
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (win && !win.isDestroyed()) {
    win.close();
  }
  if (winPlugin && !winPlugin.isDestroyed()) {
    winPlugin.close();
  }
  if (winSidework && !winSidework.isDestroyed()) {
    winSidework.close();
  }
  win = null;
  winPlugin = null;
  winSidework = null;

  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  if (win && !win?.isDestroyed()) {
    win.show();
    win.focus();
  } else {
    createWindow();
  }
});

ipcMain.on("minimize", () => {
  win?.minimize();
  winPlugin?.hide();
  winSidework?.close();
});

ipcMain.on("maximize", () => {
  if (win?.isMaximized()) {
    win?.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.on("close", (e) => {
  if (platform() === "darwin") {
    e.preventDefault();
    win?.hide();
    winPlugin?.hide();
    winSidework?.close();
  } else {
    win?.close();
    winPlugin?.close();
    winSidework?.close();
    app.quit();
  }
});

ipcMain.handle("version", () => {
  return app.getVersion();
});

registerSideworkWindowEvents(winSidework);

registerMainContextMenu(preference);
