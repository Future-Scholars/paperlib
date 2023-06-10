import { BrowserWindow, app, globalShortcut, ipcMain, screen } from "electron";
// @ts-ignore
import Store from "electron-store";
import path from "node:path";
import { platform, release } from "os";

import { Preference } from "@/preference/preference";

import "./files.ts";
import "./proxy.ts";
import "./theme.ts";
import "./update.ts";
import { registerMainContextMenu } from "./win_main/contextmenu";
import { createMainWindow } from "./win_main/index";
import {
  createPluginWindow,
  setMainPluginCommunicationChannel,
  setWindowsSpecificStyles,
} from "./win_plugin/index";
import { registerSideworkWindowEvents } from "./win_sidework/event";

Store.initRenderer();
const preference = new Preference();

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("paperlib", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("paperlib");
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

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
        winPlugin.on("ready-to-show", () => {
          setMainPluginCommunicationChannel(win, winPlugin);

          setWindowsSpecificStyles(winPlugin);
        });

        winPlugin.on("hide", () => {
          winPlugin?.setSize(600, 76);

          if (platform() === "darwin") {
            win?.hide();
            app.hide();
          }
        });
      }

      const { x, y } = screen.getCursorScreenPoint();
      const currentDisplay = screen.getDisplayNearestPoint({ x, y });
      const bounds = currentDisplay.bounds;
      const centerx = bounds.x + (bounds.width - 600) / 2;
      const centery = bounds.y + (bounds.height - 76) / 2;
      winPlugin?.setPosition(parseInt(`${centerx}`), parseInt(`${centery}`));
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

app.on("open-url", (event, url) => {
  console.log(url);
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

ipcMain.on("force-close", (e) => {
  win?.close();
  winPlugin?.close();
  winSidework?.close();
  app.quit();
});

ipcMain.handle("version", () => {
  return app.getVersion();
});

registerSideworkWindowEvents(winSidework);

registerMainContextMenu(preference);
