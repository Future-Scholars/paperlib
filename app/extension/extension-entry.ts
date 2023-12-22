import fs from "fs";
import path from "path";

import { InjectionContainer } from "@/base/injection/injection";
import { Process } from "@/base/process-id";
import { ExtensionManagementService } from "@/extension/services/extension-management-service";
import { ExtensionRPCService } from "@/extension/services/extension-rpc-service";
import { IInjectable } from "@/extension/services/injectable";

import { ExtensionPreferenceService } from "./services/extension-preference-service";

async function initialize() {
  // ============================================================
  // 1. Initilize the RPC service for current process
  const extensionRPCService = new ExtensionRPCService();
  // ============================================================
  // 2. Start the port exchange process.
  extensionRPCService.initCommunication();
  // ============================================================
  // 3. Wait for the main/renderer process to expose its APIs (PLMainAPI/PLAPI)
  const mainAPIExposed = await extensionRPCService.waitForAPI(
    Process.main,
    "PLMainAPI",
    5000
  );

  if (!mainAPIExposed) {
    console.error("Main process API is not exposed");
    throw new Error("Main process API is not exposed");
  }
  const rendererAPIExposed = await extensionRPCService.waitForAPI(
    Process.renderer,
    "PLAPI",
    5000
  );
  if (!rendererAPIExposed) {
    throw new Error("Renderer process API is not exposed");
  }
  // 3.1 Get extension working path
  const extensionWorkingDir = await PLMainAPI.fileSystemService.getSystemPath(
    "userData",
    Process.extension
  );
  globalThis["extensionWorkingDir"] = path.join(
    extensionWorkingDir,
    "extensions"
  );
  if (!fs.existsSync(globalThis["extensionWorkingDir"])) {
    fs.mkdirSync(globalThis["extensionWorkingDir"]);
  }

  // ============================================================
  // 4. Create the instances for all services, tools, etc. of the current process.
  const injectionContainer = new InjectionContainer();

  const instances = injectionContainer.createInstance<IInjectable>({
    extensionManagementService: ExtensionManagementService,
    extensionPreferenceService: ExtensionPreferenceService,
  });
  // 4.1 Expose the instances to the global scope for convenience.
  for (const [key, instance] of Object.entries(instances)) {
    if (!globalThis["PLExtAPI"]) {
      globalThis["PLExtAPI"] = {} as any;
    }
    globalThis[key] = instance;
    globalThis["PLExtAPI"][key] = instance;
  }

  // ============================================================
  // 5. Set actionors for RPC service with all initialized services.
  //    Expose the APIs of the current process to other processes
  extensionRPCService.setActionor(instances);

  extensionManagementService.loadInstalledExtensions();
}

initialize();
