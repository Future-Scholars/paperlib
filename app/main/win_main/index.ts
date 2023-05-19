import { BrowserWindow, app, nativeTheme, shell } from "electron";
import { join, posix } from "node:path";
import os from "os";

import { Preference } from "../../preference/preference";
import { setMainMenu } from "./menu";

export async function createMainWindow(
  win: BrowserWindow | null,
  preference: Preference,
  winPlugin: BrowserWindow | null,
  winSidework: BrowserWindow | null
): Promise<BrowserWindow> {
  if (win) {
    win.destroy();
    win = null;
  }

  const windowSize = preference.get("windowSize") as {
    height: number;
    width: number;
  };

  win = new BrowserWindow({
    title: "Main window",
    width: windowSize.width,
    height: windowSize.height,
    minWidth: 600,
    minHeight: 400,
    useContentSize: true,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
    },
    frame: false,
    vibrancy: "sidebar",
    visualEffectState: "active",
  });

  if (app.isPackaged) {
    win.loadFile(join(__dirname, "app/index.html"));
  } else if (process.env.NODE_ENV === "vitest") {
    win.loadFile(join(__dirname, "app/index.html"));
  } else {
    win.loadURL(
      posix.join(process.env.VITE_DEV_SERVER_URL as string, "app/index.html")
    );
    win.webContents.openDevTools();
  }

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes(process.env.VITE_DEV_SERVER_URL || "")) {
      return { action: "allow" };
    }
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", function (e, url) {
    if (url.includes(process.env.VITE_DEV_SERVER_URL || "")) {
      return;
    }
    e.preventDefault();
    shell.openExternal(url);
  });

  setMainMenu(win, preference);
  nativeTheme.themeSource = preference.get("preferedTheme") as
    | "dark"
    | "light"
    | "system";

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
    const winSize = win?.getNormalBounds();
    if (winSize) {
      preference.set("windowSize", {
        width: winSize.width,
        height: winSize.height,
      });
    }

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
  height: 4px;
}

::-webkit-scrollbar-corner {
  background: transparent;
  width: 0 !important;
  height: 0 !important;
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
