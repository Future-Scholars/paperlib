import { BrowserWindow, app, globalShortcut, ipcMain, screen } from "electron";
// @ts-ignore
import Store from "electron-store";
import path from "node:path";
import { release } from "os";

import { IInjectable } from "@/base/injection/injectable.ts";
import { InjectionContainer } from "@/base/injection/injection.ts";
import { PreferenceService } from "@/common/services/preference-service.ts";
import { WindowStorage } from "@/main/window-storage.ts";

import "./files.ts";
import "./proxy.ts";
import { MainRPCService } from "./services/main-rpc-service.ts";
import { WindowProcessManagementService } from "./services/window-management-service.ts";
import "./theme.ts";
import "./update.ts";
import {
  createPluginWindow,
  setMainPluginCommunicationChannel,
  setWindowsSpecificStyles,
} from "./win_plugin/index";
import { registerSideworkWindowEvents } from "./win_sidework/event";
import { FileSystemService } from "./services/filesystem-service.ts";
import { ContextMenuService } from "./services/contextmenu-service.ts";
import { MenuService } from "./services/menu-service.ts";
import { UpgradeService } from "./services/upgrade-service.ts";
import { ProxyService } from "./services/proxy-service.ts";

Store.initRenderer();

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

// let win: BrowserWindow | null = null;
// let winPlugin: BrowserWindow | null = null;
// let winSidework: BrowserWindow | null = null;

// async function createWindow() {
//   win = await createMainWindow(win, preference, winPlugin, winSidework);

//   globalShortcut.register(
//     (preference.get("shortcutPlugin") as string) || "CommandOrControl+Shift+I",
//     async () => {
//       // win?.blur();
//       if (winPlugin === null || winPlugin?.isDestroyed()) {
//         winPlugin = await createPluginWindow(winPlugin);
//         winPlugin.on("ready-to-show", () => {
//           setMainPluginCommunicationChannel(win, winPlugin);

//           setWindowsSpecificStyles(winPlugin);
//         });

//         winPlugin.on("hide", () => {
//           winPlugin?.setSize(600, 76);

//           if (platform() === "darwin") {
//             win?.hide();
//             app.hide();
//           }
//         });
//       }

//       const { x, y } = screen.getCursorScreenPoint();
//       const currentDisplay = screen.getDisplayNearestPoint({ x, y });
//       const bounds = currentDisplay.bounds;
//       const centerx = bounds.x + (bounds.width - 600) / 2;
//       const centery = bounds.y + (bounds.height - 76) / 2;
//       winPlugin?.setPosition(parseInt(`${centerx}`), parseInt(`${centery}`));
//       winPlugin?.show();
//     }
//   );
// }

globalThis.browserWindows = new WindowStorage();

async function initialize() {
  const injectionContainer = new InjectionContainer();

  const instances = injectionContainer.createInstance<IInjectable>({
    preferenceService: PreferenceService,
    windowProcessManagementService: WindowProcessManagementService,
    fileSystemService: FileSystemService,
    contextMenuService: ContextMenuService,
    menuService: MenuService,
    upgradeService: UpgradeService,
    mainRPCService: MainRPCService,
    proxyService: ProxyService,
  });
  for (const [key, instance] of Object.entries(instances)) {
    globalThis[key] = instance;
  }

  windowProcessManagementService.createMainRenderer();
}

app.whenReady().then(initialize);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (windowProcessManagementService.browserWindows.has("rendererProcess")) {
    if (
      windowProcessManagementService.browserWindows
        .get("browserWindows")
        .isMinimized()
    )
      windowProcessManagementService.browserWindows
        .get("browserWindows")
        .restore();
    windowProcessManagementService.browserWindows.get("browserWindows").focus();
  }
});

app.on("activate", () => {
  if (windowProcessManagementService.browserWindows.has("rendererProcess")) {
    windowProcessManagementService.browserWindows.get("rendererProcess").show();
    windowProcessManagementService.browserWindows
      .get("rendererProcess")
      .focus();
  } else {
    windowProcessManagementService.createMainRenderer();
  }
});

ipcMain.handle("version", () => {
  return app.getVersion();
});

// registerSideworkWindowEvents(winSidework);
