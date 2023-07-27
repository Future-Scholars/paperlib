import { createDecorator } from "@/base/injection/injection";
import { RPCProtocol, RPCService } from "@/base/rpc/rpc-service";

interface IExtensionRPCServiceState {
  initialized: string;
}

export const IExtensionRPCService = createDecorator("extensionRPCService");

export class ExtensionRPCService extends RPCService<IExtensionRPCServiceState> {
  protected _apiNamespace = "PLExtAPI";

  constructor() {
    super("extensionRPCService", { initialized: "" });
  }

  listenProtocolCreation(): void {
    // if (process.type !== "utility") {
    //   throw new Error(
    //     "ExtensionRPCService should only be instantiated in the utility process"
    //   );
    // }
    // process.parentPort.on("message", (e) => {
    //   if (e.data.startsWith("create-messageport-rpc-protocol")) {
    //     console.log("create-protocol in extension");
    //     const [port] = e.ports;
    //     const protocolId = e.data.split(":")[1];
    //     const protocol = new MessagePortRPCProtocol(port, "extensionProcess");
    //     this.initActionor(protocol);
    //     this.initProxy(protocol, protocolId);
    //     this._protocols[protocolId] = protocol;
    //     this.fire({ initialized: protocolId });
    //   }
    // });
  }

  initProxy(
    protocol: RPCProtocol,
    exposedAPIs: { [namespace: string]: string[] }
  ): void {
    for (const [namespace, APIs] of Object.entries(exposedAPIs)) {
      globalThis[namespace] = {};
      for (const API of APIs) {
        globalThis[namespace][API] = protocol.getProxy(API);
      }
    }
  }
}
