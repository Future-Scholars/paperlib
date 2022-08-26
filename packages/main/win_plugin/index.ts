import {
  app,
  BrowserWindow,
  shell,
  screen,
  MessageChannelMain,
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
  if (os.platform() === "darwin") {
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

  winPlugin.on("ready-to-show", () => {
    setWindowsSpecificStyles(winPlugin);

    const { x, y } = screen.getCursorScreenPoint();
    const currentDisplay = screen.getDisplayNearestPoint({ x, y });
    const bounds = currentDisplay.bounds;
    const centerx = bounds.x + (bounds.width - 600) / 2;
    const centery = bounds.y + (bounds.height - 76) / 2;
    winPlugin?.setPosition(parseInt(`${centerx}`), parseInt(`${centery}`));
  });

  winPlugin.on("blur", () => {
    if (os.platform() === "win32") {
      winPlugin?.minimize();
    }
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

function setWindowsSpecificStyles(win: BrowserWindow | null) {
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
