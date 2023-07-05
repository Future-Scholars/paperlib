import { MessagePortRPCProtocol } from "@/base/rpc/messageport-rpc-protocol";
import { RPCProtocol, RPCService } from "@/base/rpc/rpc-service";

interface IExtensionRPCServiceState {
  initialized: number;
}

export class ExtensionRPCService extends RPCService<IExtensionRPCServiceState> {
  constructor() {
    super("extensionRPCService", { initialized: 0 });

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
        const [port] = e.ports;
        const protocolId = e.data.split(":")[1];
        const protocol = new MessagePortRPCProtocol(port, "extensionProcess");
        this._initActionor(protocol);
        this._initProxy(protocol, protocolId);
        this._protocols[protocolId] = protocol;

        this.fire("initialized");
      }
    });
  }

  _initActionor(protocol: RPCProtocol): void {}

  _initProxy(protocol: RPCProtocol, protocolId: string): void {
    if (protocolId === "rendererPreocess") {
      globalThis.PLAPI = {
        appService: protocol.getProxy("appService"),
      };
    }
  }
}
