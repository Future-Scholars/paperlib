import {
  BrowserWindow,
  MessageChannelMain,
  app,
  screen,
  shell,
} from "electron";
import os from "os";
import { join } from "path";

import { registerPluginWindowEvents } from "./event";

export async function createPluginWindow(
  winPlugin: BrowserWindow | null
): Promise<BrowserWindow> {
  if (winPlugin) {
    winPlugin.destroy();
    winPlugin = null;
  }
  winPlugin = new BrowserWindow({
    title: "Plugin window",
    width: 600,
    height: 76,
    minWidth: 600,
    minHeight: 76,
    maxWidth: 600,
    maxHeight: 394,
    useContentSize: true,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
    },
    frame: false,
    vibrancy: "sidebar",
    visualEffectState: "active",
    show: false,
  });
  if (os.platform() === "darwin") {
    winPlugin?.setVisibleOnAllWorkspaces(true);
  }

  if (app.isPackaged) {
    winPlugin.loadFile(join(__dirname, "../../index_plugin.html"));
  } else {
    const url = `${process.env.VITE_DEV_SERVER_URL}/index_plugin.html`;

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

    winPlugin?.setSize(600, 76);
  });

  winPlugin.on("focus", () => {
    winPlugin?.setSize(600, 76);
    winPlugin?.webContents.send("plugin-gain-focus");
  });

  winPlugin.on("show", () => {
    winPlugin?.setSize(600, 76);
  });

  registerPluginWindowEvents(winPlugin);

  return winPlugin;
}

export function setWindowsSpecificStyles(win: BrowserWindow | null) {
  if (os.platform() !== "darwin" && win) {
    win.webContents.insertCSS(`
/* Track */
::-webkit-scrollbar {
  width: 0px;
}

.plugin-windows-bg {
  background-color: #efefef;
}

@media (prefers-color-scheme: dark) {
  .plugin-windows-bg {
    background-color: rgb(50, 50, 50);
  }
}

`);
  }
}

export function setMainPluginCommunicationChannel(
  win: BrowserWindow | null,
  winPlugin: BrowserWindow | null
) {
  if (win && winPlugin) {
    const { port1, port2 } = new MessageChannelMain();
    winPlugin.webContents.postMessage("plugin-comm-port", null, [port1]);
    win.webContents.postMessage("plugin-comm-port", null, [port2]);
  }
}
