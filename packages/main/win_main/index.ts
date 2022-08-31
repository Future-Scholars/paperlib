import { app, BrowserWindow, shell } from "electron";
import os from "os";
import { join } from "path";
import Store from "electron-store";

import { setMainMenu } from "./menu";

export async function createMainWindow(
  win: BrowserWindow | null,
  preference: Store,
  winPlugin: BrowserWindow | null,
  winSidework: BrowserWindow | null
): Promise<BrowserWindow> {
  if (win) {
    win.destroy();
    win = null;
  }

  win = new BrowserWindow({
    title: "Main window",
    width: 1440,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    useContentSize: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: true,
    },
    frame: false,
    vibrancy: "sidebar",
    visualEffectState: "active",
  });

  if (app.isPackaged) {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  } else {
    // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
    const url = `http://${process.env["VITE_DEV_SERVER_HOST"]}:${process.env["VITE_DEV_SERVER_PORT"]}`;

    win.loadURL(url);
    win.webContents.openDevTools();
  }

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  setMainMenu(win, preference);

  win.on("ready-to-show", () => {
    setWindowsSpecificStyles(win);
  });

  win.on("blur", () => {
    win?.webContents.send("window-lost-focus");
  });

  win.on("focus", () => {
    win?.webContents.send("window-gained-focus");
    if (winPlugin && !winPlugin.isDestroyed()) {
      winPlugin?.hide();
    }
  });

  win.on("close", () => {
    winPlugin?.close();
    winSidework?.close();
    win = null;
    winPlugin = null;
    winSidework = null;
    if (process.platform !== "darwin") app.quit();
  });

  return win;
}

function setWindowsSpecificStyles(win: BrowserWindow | null) {
  if (os.platform() !== "darwin" && win) {
    win.webContents.insertCSS(`
/* Track */
::-webkit-scrollbar-track {
  background: var(--q-bg-secondary);
  border-radius: 2px;
}
/* Handle */
::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 2px;
}
/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
::-webkit-scrollbar {
  width: 4px;
}

.sidebar-windows-bg {
  background-color: #efefef;
}

.splitpanes__splitter {
  background-color: #efefef;
}

@media (prefers-color-scheme: dark) {
  .sidebar-windows-bg {
    background-color: rgb(50, 50, 50);
  }
  .splitpanes__splitter {
    background-color: rgb(50, 50, 50);
  }
  .plugin-windows-bg {
    background-color: rgb(50, 50, 50);
  }
}

`);
  }
}
