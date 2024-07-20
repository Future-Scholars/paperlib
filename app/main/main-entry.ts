import { app } from "electron";
import path from "path";

import { InjectionContainer } from "@/base/injection/injection";
import { Process } from "@/base/process-id";
import { MainProcessRPCService } from "@/base/rpc/rpc-service-main";
import { IInjectable } from "@/main/services/injectable";
import { PreferenceService } from "@/main/services/preference-service";

import { ContextMenuService } from "./services/contextmenu-service";
import { FileSystemService } from "./services/filesystem-service";
import { MenuService } from "./services/menu-service";
import { ProxyService } from "./services/proxy-service";
import { SystemService } from "./services/system-service";
import { UpgradeService } from "./services/upgrade-service";
import { UtilityProcessManagementService } from "./services/utility-process-management-service";
import { WindowProcessManagementService } from "./services/window-process-management-service";

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
  const mainRPCService = new MainProcessRPCService(Process.main, "PLMainAPI");

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
    utilityProcessManagementService: UtilityProcessManagementService,
    systemService: SystemService,
  });
  // 3.1 Expose the instances to the global scope for convenience.
  for (const [key, instance] of Object.entries(instances)) {
    if (!globalThis["PLMainAPI"]) {
      globalThis["PLMainAPI"] = {} as any;
    }
    globalThis[key] = instance;
    globalThis["PLMainAPI"][key] = instance;
  }

  // ============================================================
  // 4. Set actionors for RPC service with all initialized services.
  //    Expose the APIs of the current process to other processes
  mainRPCService.setActionor(instances);

  // ============================================================
  // 5. Setup other things for the main process.
  app.on("window-all-closed", () => {
    PLMainAPI.utilityProcessManagementService.close();

    if (process.platform !== "darwin") app.quit();
  });

  app.on("second-instance", () => {
    if (
      PLMainAPI.windowProcessManagementService.browserWindows.has(
        Process.renderer
      )
    ) {
      if (
        PLMainAPI.windowProcessManagementService.browserWindows
          .get(Process.renderer)
          .isMinimized()
      ) {
        PLMainAPI.windowProcessManagementService.browserWindows
          .get(Process.renderer)
          .restore();
        PLMainAPI.windowProcessManagementService.browserWindows
          .get(Process.renderer)
          .focus();
      }
    }
  });

  app.on("activate", () => {
    if (
      PLMainAPI.windowProcessManagementService.browserWindows.has(
        Process.renderer
      )
    ) {
      PLMainAPI.windowProcessManagementService.browserWindows
        .get(Process.renderer)
        .show();
      PLMainAPI.windowProcessManagementService.browserWindows
        .get(Process.renderer)
        .focus();
    } else {
      PLMainAPI.windowProcessManagementService.createMainRenderer();
    }
  });

  // ============================================================
  // 6. Start the port exchange process.
  PLMainAPI.windowProcessManagementService.on("requestPort", (v) => {
    mainRPCService.initCommunication(
      v.value,
      PLMainAPI.windowProcessManagementService.browserWindows,
      PLMainAPI.utilityProcessManagementService.utlityProcesses
    );
  });

  PLMainAPI.utilityProcessManagementService.on("requestPort", (v) => {
    mainRPCService.initCommunication(
      v.value,
      PLMainAPI.windowProcessManagementService.browserWindows,
      PLMainAPI.utilityProcessManagementService.utlityProcesses
    );
  });

  // ============================================================
  // 7. Once the main renderer process is ready, create the extension process.
  PLMainAPI.utilityProcessManagementService.on("serviceReady", (v) => {
    if (v.value === Process.service) {
      PLMainAPI.utilityProcessManagementService.createExtensionProcess();
      // ============================================================
      // 8. Create the main renderer process.
      PLMainAPI.windowProcessManagementService.createMainRenderer();
    }
  });
  PLMainAPI.windowProcessManagementService.on("serviceReady", (v) => {
    if (v.value === Process.renderer) {
      PLMainAPI.menuService.enableGlobalShortcuts();
    }
  });

  PLMainAPI.utilityProcessManagementService.createServiceProcess();
}

app.whenReady().then(() => {
  // Set application name for Windows 10+ notifications
  if (process.platform === "win32") app.setAppUserModelId(app.getName());

  app.on("browser-window-created", (_, window) => {
    if (!window) return;
    const { webContents } = window;
    webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown") {
        // Toggle devtool(F12)
        if (input.code === "F12") {
          if (webContents.isDevToolsOpened()) {
            webContents.closeDevTools();
          } else {
            webContents.openDevTools({ mode: "undocked" });
          }
        }
      }
    });
  });

  initialize();
});

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
