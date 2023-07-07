import { MessagePortRPCProtocol } from "@/base/rpc/messageport-rpc-protocol";
import { RPCProtocol, RPCService } from "@/base/rpc/rpc-service";

interface IExtensionRPCServiceState {
  initialized: string;
}

export class ExtensionRPCService extends RPCService<IExtensionRPCServiceState> {
  constructor() {
    super("extensionRPCService", { initialized: "" });

    this._listenProtocolCreation();
  }

  _listenProtocolCreation(): void {
    if (process.type !== "utility") {
      throw new Error(
        "ExtensionRPCService should only be instantiated in the utility process"
      );
    }

    process.parentPort.on("message", (e) => {
      if (e.data.startsWith("create-messageport-rpc-protocol")) {
        console.log("create-protocol in extension");

        const [port] = e.ports;
        const protocolId = e.data.split(":")[1];
        const protocol = new MessagePortRPCProtocol(port, "extensionProcess");
        this.initActionor(protocol);
        this.initProxy(protocol, protocolId);
        this._protocols[protocolId] = protocol;

        this.fire({ initialized: protocolId });
      }
    });
  }

  initActionor(protocol: RPCProtocol): void {}

  initProxy(protocol: RPCProtocol, protocolId: string): void {
    if (protocolId === "rendererPreocess") {
      globalThis.PLAPI = {
        appService: protocol.getProxy("appService"),
      };
    } else if (protocolId === "mainProcess") {
      globalThis.PLMainAPI = {
        windowProcessManagementService: protocol.getProxy(
          "windowProcessManagementService"
        ),
        fileSystemService: protocol.getProxy("fileSystemService"),
        contextMenuService: protocol.getProxy("contextMenuService"),
        menuService: protocol.getProxy("menuService"),
        upgradeService: protocol.getProxy("upgradeService"),
        proxyService: protocol.getProxy("proxyService"),
      };
    }
  }
}
