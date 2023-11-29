import { MessageEvent } from "electron";

import { InjectionContainer } from "@/base/injection/injection";
import { LazyPromise } from "@/base/rpc/lazy-promise";
import { MessagePortRPCProtocol } from "@/base/rpc/messageport-rpc-protocol";
import { ExtensionManagementService } from "@/extension/services/extension-management-service";
import { ExtensionRPCService } from "@/extension/services/extension-rpc-service";
import { IInjectable } from "@/extension/services/injectable";

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
    "mainProcess",
    "PLMainAPI",
    5000
  );
  if (!mainAPIExposed) {
    throw new Error("Main process API is not exposed");
    // TODO: show error message and exit
  }
  const rendererAPIExposed = await extensionRPCService.waitForAPI(
    "rendererProcess",
    "PLAPI",
    5000
  );
  if (!rendererAPIExposed) {
    throw new Error("Renderer process API is not exposed");
  }

  // ============================================================
  // 4. Create the instances for all services, tools, etc. of the current process.
  const injectionContainer = new InjectionContainer();

  const instances = injectionContainer.createInstance<IInjectable>({
    extensionManagementService: ExtensionManagementService,
  });
  // 4.1 Expose the instances to the global scope for convenience.
  for (const [key, instance] of Object.entries(instances)) {
    globalThis[key] = instance;
  }

  // ============================================================
  // 5. Set actionors for RPC service with all initialized services.
  //    Expose the APIs of the current process to other processes
  extensionRPCService.setActionor(instances);

  extensionManagementService.installDemoPlugins();
}

initialize();
