import { MessageEvent } from "electron";

import { InjectionContainer } from "@/base/injection/injection";
import { LazyPromise } from "@/base/rpc/lazy-promise";
import { MessagePortRPCProtocol } from "@/base/rpc/messageport-rpc-protocol";
import { ExtensionManagementService } from "@/extension/services/extension-management-service";
import { ExtensionRPCService } from "@/extension/services/extension-rpc-service";
import { IInjectable } from "@/extension/services/injectable";

async function initialize() {
  // const p: any[] = [];

  // setTimeout(() => {
  //   p[0].resolve();
  // }, 1000);

  // const func = (...myArgs: any[]) => {
  //   const result: Promise<void> = new LazyPromise();

  //   p.push(result);

  //   return result;
  // };

  // await func();

  // console.log("done");

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

  console.log(await PLMainAPI.upgradeService.currentVersion());

  const rendererAPIExposed = await extensionRPCService.waitForAPI(
    "rendererProcess",
    "PLAPI",
    5000
  );

  if (!rendererAPIExposed) {
    throw new Error("Renderer process API is not exposed");
  }

  console.log(await PLAPI.appService.version());

  // process.parentPort.postMessage({
  //   type: "request-port",
  //   value: "extensionProcess",
  // });

  // const extensionRPCService = new ExtensionRPCService();

  // process.parentPort.on("message", (message: MessageEvent) => {
  //   if (message.data.startsWith("register-rpc-message-port")) {
  //     const port = message.ports[0];
  //     const callerId = message.data.split(":")[1];

  //     const protocol = new MessagePortRPCProtocol(port, callerId);
  //     extensionRPCService.initActionor(protocol);

  //     if (callerId === "mainProcess") {
  //       process.parentPort.postMessage("initialized");
  //     }
  //   }
  // });

  // const injectionContainer = new InjectionContainer();

  // const instances = injectionContainer.createInstance<IInjectable>({
  //   extensionRPCService: ExtensionRPCService,
  //   extensionManagementService: ExtensionManagementService,
  // });
  // for (const [key, instance] of Object.entries(instances)) {
  //   globalThis[key] = instance;
  // }

  // extensionRPCService.on("initialized", async (protocolId) => {
  //   try {
  //     console.log(`extension process initialized: ${protocolId.value}`);

  //     if (protocolId.value === "rendererProcess") {
  //       extensionManagementService.installInnerPlugins();
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // });
}

initialize();
