import { app } from "electron";
import Store from "electron-store";
import { release } from "os";
import path from "path";

import { InjectionContainer } from "@/base/injection/injection.ts";
import { PreferenceService } from "@/common/services/preference-service.ts";
import { IInjectable } from "@/main/services/injectable.ts";

import { Process } from "@/base/process-id.ts";
import { ContextMenuService } from "./services/contextmenu-service.ts";
import { ExtensionProcessManagementService } from "./services/extension-process-management-service.ts";
import { FileSystemService } from "./services/filesystem-service.ts";
import { MainRPCService } from "./services/main-rpc-service.ts";
import { MenuService } from "./services/menu-service.ts";
import { ProxyService } from "./services/proxy-service.ts";
import { UpgradeService } from "./services/upgrade-service.ts";
import { WindowProcessManagementService } from "./services/window-process-management-service.ts";

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

async function initialize() {
  // ============================================================
  // 1. Initilize the RPC service for current process
  const mainRPCService = new MainRPCService();

  // ============================================================
  // 2. Create the instances for all services, tools, etc. of the current process.
  const injectionContainer = new InjectionContainer();
  const instances = injectionContainer.createInstance<IInjectable>({
    preferenceService: PreferenceService,
    windowProcessManagementService: WindowProcessManagementService,
    fileSystemService: FileSystemService,
    contextMenuService: ContextMenuService,
    menuService: MenuService,
    upgradeService: UpgradeService,
    proxyService: ProxyService,
    extensionProcessManagementService: ExtensionProcessManagementService,
  });
  // 3.1 Expose the instances to the global scope for convenience.
  for (const [key, instance] of Object.entries(instances)) {
    globalThis[key] = instance;
  }

  // ============================================================
  // 4. Set actionors for RPC service with all initialized services.
  //    Expose the APIs of the current process to other processes
  mainRPCService.setActionor({
    windowProcessManagementService,
    fileSystemService,
    contextMenuService,
    menuService,
    upgradeService,
    proxyService,
  });

  // ============================================================
  // 5. Setup other things for the main process.
  app.on("window-all-closed", () => {
    extensionProcessManagementService.close();

    if (process.platform !== "darwin") app.quit();
  });

  app.on("second-instance", () => {
    if (windowProcessManagementService.browserWindows.has(Process.renderer)) {
      if (
        windowProcessManagementService.browserWindows
          .get(Process.renderer)
          .isMinimized()
      ) {
        windowProcessManagementService.browserWindows
          .get(Process.renderer)
          .restore();
        windowProcessManagementService.browserWindows
          .get(Process.renderer)
          .focus();
      }
    }
  });

  app.on("activate", () => {
    if (windowProcessManagementService.browserWindows.has(Process.renderer)) {
      windowProcessManagementService.browserWindows
        .get(Process.renderer)
        .show();
      windowProcessManagementService.browserWindows
        .get(Process.renderer)
        .focus();
    } else {
      windowProcessManagementService.createMainRenderer();
    }
  });

  // ============================================================
  // 6. Start the port exchange process.
  mainRPCService.initCommunication(
    windowProcessManagementService,
    extensionProcessManagementService
  );

  // ============================================================
  // 7. Once the main renderer process is ready, create the extension process and the quickpaste renderer process.
  windowProcessManagementService.on(
    "serviceReady",
    (newValue: { value: string }) => {
      if (newValue.value === Process.renderer) {
        // windowProcessManagementService.createQuickpasteRenderer();

        if (
          !extensionProcessManagementService.extensionProcesses[
            Process.extension
          ]
        ) {
          extensionProcessManagementService.createExtensionProcess();
        }
        menuService.enableGlobalShortcuts();
      }
    }
  );

  // ============================================================
  // 8. Create the main renderer process.
  windowProcessManagementService.createMainRenderer();
}

app.whenReady().then(initialize);

app.on("open-url", (event, urlStr) => {
  try {
    const { protocol, hostname, pathname, search } = new URL(urlStr);

    if (protocol === "paperlib:") {
      const [apiGroup, serviceName, methodName] = hostname.split(".");

      if (["PLAPI", "PLMainAPI", "PLExtAPI"].includes(apiGroup)) {
        const args = JSON.parse(
          decodeURIComponent(search.slice(1)).split("=")[1]
        );
        globalThis[apiGroup][serviceName][methodName](...args);
      } else {
        throw new Error("Invalid URL");
      }
    }
  } catch (e) {
    try {
      PLAPI.logService.error(
        "SchemeURL error",
        `${(e as Error).message}\n${(e as Error).stack}`,
        true,
        "SchemeURL"
      );
    } catch (err) {}
  }
});
