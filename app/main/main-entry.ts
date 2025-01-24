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

function handleDeeplink(urlStr: string) {
  console.log("handleDeeplink", urlStr);
  try {
    const { protocol, hostname, pathname, search } = new URL(urlStr);
    console.log(protocol, hostname, pathname, search);
    if (protocol === "paperlib:") {
      const [apiGroup, serviceName, methodName] = hostname.split(".");

      if (["PLAPI", "PLMainAPI", "PLExtAPI"].includes(apiGroup)) {
        const args = JSON.parse(
          decodeURIComponent(search.slice(1)).split("=")[1]
        );
        console.log(apiGroup, serviceName, methodName, args);
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
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (
      PLMainAPILocal.windowProcessManagementService.browserWindows.has(
        Process.renderer
      )
    ) {
      PLMainAPILocal.windowProcessManagementService.browserWindows
        .get(Process.renderer)
        .show();
      PLMainAPILocal.windowProcessManagementService.browserWindows
        .get(Process.renderer)
        .focus();

      if (commandLine.length > 1) {
        const deepLink = commandLine.pop();
        if (deepLink) {
          handleDeeplink(deepLink);
        }
      }
    } else {
      PLMainAPILocal.windowProcessManagementService.createMainRenderer();
    }
  });
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
    if (!globalThis["PLMainAPILocal"]) {
      globalThis["PLMainAPILocal"] = {} as any;
    }
    globalThis[key] = instance;
    globalThis["PLMainAPILocal"][key] = instance;
  }

  // ============================================================
  // 4. Set actionors for RPC service with all initialized services.
  //    Expose the APIs of the current process to other processes
  mainRPCService.setActionor(instances);

  // ============================================================
  // 5. Setup other things for the main process.
  app.on("window-all-closed", () => {
    PLMainAPILocal.utilityProcessManagementService.close();

    if (process.platform !== "darwin") app.quit();
  });

  app.on("second-instance", () => {
    if (
      PLMainAPILocal.windowProcessManagementService.browserWindows.has(
        Process.renderer
      )
    ) {
      if (
        PLMainAPILocal.windowProcessManagementService.browserWindows
          .get(Process.renderer)
          .isMinimized()
      ) {
        PLMainAPILocal.windowProcessManagementService.browserWindows
          .get(Process.renderer)
          .restore();
        PLMainAPILocal.windowProcessManagementService.browserWindows
          .get(Process.renderer)
          .focus();
      }
    }
  });

  app.on("activate", () => {
    if (
      PLMainAPILocal.windowProcessManagementService.browserWindows.has(
        Process.renderer
      )
    ) {
      PLMainAPILocal.windowProcessManagementService.browserWindows
        .get(Process.renderer)
        .show();
      PLMainAPILocal.windowProcessManagementService.browserWindows
        .get(Process.renderer)
        .focus();
    } else {
      PLMainAPILocal.windowProcessManagementService.createMainRenderer();
    }
  });

  // ============================================================
  // 6. Start the port exchange process.
  PLMainAPILocal.windowProcessManagementService.on("requestPort", (v) => {
    mainRPCService.initCommunication(
      v.value,
      PLMainAPILocal.windowProcessManagementService.browserWindows,
      PLMainAPILocal.utilityProcessManagementService.utlityProcesses
    );
  });

  PLMainAPILocal.utilityProcessManagementService.on("requestPort", (v) => {
    mainRPCService.initCommunication(
      v.value,
      PLMainAPILocal.windowProcessManagementService.browserWindows,
      PLMainAPILocal.utilityProcessManagementService.utlityProcesses
    );
  });

  // ============================================================
  // 7. Once the main renderer process is ready, create the extension process.
  PLMainAPILocal.utilityProcessManagementService.on("serviceReady", (v) => {
    if (v.value === Process.service) {
      PLMainAPILocal.utilityProcessManagementService.createExtensionProcess();
      // ============================================================
      // 8. Create the main renderer process.
      PLMainAPILocal.windowProcessManagementService.createMainRenderer();
    }
  });
  PLMainAPILocal.windowProcessManagementService.on("serviceReady", (v) => {
    if (v.value === Process.renderer) {
      PLMainAPILocal.menuService.enableGlobalShortcuts();
    }
  });

  PLMainAPILocal.utilityProcessManagementService.createServiceProcess();
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
  handleDeeplink(urlStr);
});
