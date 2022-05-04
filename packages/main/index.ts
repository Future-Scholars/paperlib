import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  globalShortcut,
  MessageChannelMain,
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

async function createWindow() {
  win = new BrowserWindow({
    title: "Main window",
    width: 1440,
    height: 860,
    minWidth: 1440,
    minHeight: 860,
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

  setMainMenu(win);

  win.on("blur", () => {
    win?.webContents.send("window-lost-focus");
  });

  win.on("focus", () => {
    win?.webContents.send("window-gained-focus");
  });

  // =====================================
  // Plugin Window
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
    visualEffectState: "active",
    show: false,
  });

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

  const ret = globalShortcut.register("CommandOrControl+Shift+I", () => {
    win?.blur();
    winPlugin?.show();
  });

  if (!ret) {
    console.log("registration failed");
  }

  setupWindowsSpecificStyle(win);
  setupWindowsSpecificStyleForPlugin(winPlugin);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

ipcMain.on("minimize", () => {
  win?.minimize();
});

ipcMain.on("maximize", () => {
  if (win?.isMaximized()) {
    win?.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.on("close", () => {
  win?.close();
  winPlugin?.close();
  // app.quit();
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
  win?.blur();
  if (platform() === "darwin") {
    app.hide();
  }
  winPlugin?.hide();
});
