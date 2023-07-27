import { MessageEvent } from "electron";
import { IInjectable } from "@/extension/services/injectable";
import { InjectionContainer } from "@/base/injection/injection";
import { ExtensionRPCService } from "@/extension/services/extension-rpc-service";
import { ExtensionManagementService } from "@/extension/services/extension-management-service";
import { MessagePortRPCProtocol } from "@/base/rpc/messageport-rpc-protocol";

const extensionRPCService = new ExtensionRPCService();

process.parentPort.on("message", (message: MessageEvent) => {
  if (message.data.startsWith("register-rpc-message-port")) {
    const port = message.ports[0];
    const callerId = message.data.split(":")[1];

    const protocol = new MessagePortRPCProtocol(port, callerId);
    extensionRPCService.initActionor(protocol);

    if (callerId === "mainProcess") {
      process.parentPort.postMessage("initialized");
    }
  }
});

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
