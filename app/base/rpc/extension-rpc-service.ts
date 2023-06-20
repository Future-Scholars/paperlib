import { RPCProtocol } from "./rpc-protocol";
import { RPCService } from "./rpc-service";

interface IExtensionRPCServiceState {
  initialized: number;
}

export class ExtensionRPCService extends RPCService<IExtensionRPCServiceState> {
  constructor() {
    super("extensionRPCService", { initialized: 0 });
  }

  _listenProtocolCreation(): void {
    if (process.type !== "utility") {
      throw new Error(
        "ExtensionRPCService should only be instantiated in the utility process"
      );
    }

    process.parentPort.once("message", (e) => {
      const [port] = e.ports;
      const protocolId = e.data;
      const protocol = new RPCProtocol(port);

      this._initActionor(protocol);
      this._initProxy(protocol);
      this._protocols[protocolId] = protocol;

      this.fire("initialized");
    });
  }

  _initActionor(protocol: RPCProtocol): void {}

  _initProxy(protocol: RPCProtocol): void {
    globalThis.paperlibAPI = {
      appService: protocol.getProxy("appService"),
    };
  }
}
