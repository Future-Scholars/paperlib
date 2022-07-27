import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  globalShortcut,
  MessageChannelMain,
  screen,
} from "electron";
import { release, platform } from "os";
import { join } from "path";
import Store from "electron-store";
import { setMainMenu } from "./menu";
import "./contextmenu.ts";
import "./files.ts";
import "./theme.ts";
import "./update.ts";
import {
  setupWindowsSpecificStyle,
  setupWindowsSpecificStyleForPlugin,
} from "./style";

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
let winCheck: BrowserWindow | null = null;

async function createMainWindow() {
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

  win.on("blur", () => {
    win?.webContents.send("window-lost-focus");
  });

  win.on("focus", () => {
    win?.webContents.send("window-gained-focus");
    winPlugin?.hide();
  });

  win.on("close", () => {
    winPlugin?.close();
    winCheck?.close();
    app.quit();
  });
  setupWindowsSpecificStyle(win);
}

async function createPluginWindow() {
  if (winPlugin) {
    winPlugin.destroy();
    winPlugin = null;
  }
  winPlugin = new BrowserWindow({
    title: "Plugin window",
    width: 600,
    height: 48,
    minWidth: 600,
    minHeight: 48,
    maxWidth: 600,
    maxHeight: 394,
    useContentSize: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index_plugin.cjs"),
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: true,
    },
    frame: false,
    vibrancy: "sidebar",
    visualEffectState: "active",
    show: false,
  });
  if (platform() === "darwin") {
    winPlugin?.setVisibleOnAllWorkspaces(true);
  }

  if (app.isPackaged) {
    winPlugin.loadFile(join(__dirname, "../renderer/index_plugin.html"));
  } else {
    // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
    const url = `http://${process.env["VITE_DEV_SERVER_HOST"]}:${process.env["VITE_DEV_SERVER_PORT"]}/index_plugin.html`;

    winPlugin.loadURL(url);
    winPlugin.webContents.openDevTools();
  }

  // Make all links open with the browser, not with the application
  winPlugin.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  winPlugin.on("blur", () => {
    winPlugin?.hide();
    winPlugin?.setSize(600, 48);
  });

  winPlugin.on("focus", () => {
    winPlugin?.setSize(600, 48);
  });

  winPlugin.on("show", () => {
    winPlugin?.setSize(600, 48);
  });

  winPlugin.on("hide", () => {
    winPlugin?.setSize(600, 48);
  });

  setupWindowsSpecificStyleForPlugin(winPlugin);
}

async function createWindow() {
  await createMainWindow();
  await createPluginWindow();

  const shortcutRegister = globalShortcut.register(
    (preference.get("shortcutPlugin") as string) || "CommandOrControl+Shift+I",
    () => {
      win?.blur();

      const { x, y } = screen.getCursorScreenPoint();
      const currentDisplay = screen.getDisplayNearestPoint({ x, y });
      const bounds = currentDisplay.bounds;
      const centerx = bounds.x + (bounds.width - 600) / 2;
      const centery = bounds.y + (bounds.height - 48) / 2;
      winPlugin?.setPosition(parseInt(`${centerx}`), parseInt(`${centery}`));

      winPlugin?.show();
    }
  );
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  winPlugin = null;
  winCheck = null;

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
  winCheck?.close();
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
    winCheck?.hide();
  } else {
    win?.close();
    winPlugin?.close();
    winCheck?.close();
    app.quit();
  }
});

ipcMain.handle("version", () => {
  return app.getVersion();
});

ipcMain.on("request-plugin-channel", (event) => {
  // For security reasons, let's make sure only the frames we expect can
  // access the worker.
  if (event.senderFrame === win?.webContents.mainFrame) {
    // Create a new channel ...
    const { port1, port2 } = new MessageChannelMain();
    // ... send one end to the worker ...
    winPlugin?.webContents.postMessage("new-client", null, [port1]);
    // ... and the other end to the main window.
    event.senderFrame.postMessage("provide-plugin-channel", null, [port2]);
    // Now the main window and the worker can communicate with each other
    // without going through the main process!
  }
});

ipcMain.on("resize-plugin", (event, height) => {
  winPlugin?.setSize(600, height);
});

ipcMain.on("hide-plugin", (event) => {
  winPlugin?.blur();
});

let winCheckDom: string | null = null;
ipcMain.handle("robot-check", async (event, url) => {
  if (winCheck === null) {
    winCheck = new BrowserWindow({
      title: "Robot check window",
      width: 600,
      height: 600,
      useContentSize: true,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        contextIsolation: true,
      },
      frame: true,
      show: false,
    });
  }
  winCheck.loadURL(url);

  winCheck.on("closed", () => {
    winCheck = null;
  });

  const promise = new Promise((resolve, reject) => {
    winCheck?.on("close", async () => {
      resolve(winCheckDom);
    });
  });

  winCheck.webContents.on("dom-ready", async () => {
    winCheckDom = await winCheck?.webContents.executeJavaScript(
      "document.body.innerHTML"
    );
    if (winCheckDom?.includes("Please show you're not a robot")) {
      winCheck?.show();
    } else {
      winCheck?.close();
    }
  });

  return await promise;
});
