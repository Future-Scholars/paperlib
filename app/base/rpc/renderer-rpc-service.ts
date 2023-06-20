import { ipcRenderer } from "electron";

import { RPCProtocol } from "./rpc-protocol";
import { RPCService } from "./rpc-service";

interface IRendererRPCServiceState {
  initialized: number;
}

export class RendererRPCService extends RPCService<IRendererRPCServiceState> {
  constructor() {
    super("rendererRPCService", { initialized: 0 });
  }

  _listenProtocolCreation(): void {
    if (process.type !== "renderer") {
      throw new Error(
        "RendererRPCService should only be instantiated in the renderer process"
      );
    }

    ipcRenderer.on("create-rpc-protocol", (event, data) => {
      const port = event.ports[0];
      const protocolId = data;
      const protocol = new RPCProtocol(port);
      this._initActionor(protocol);
      this._protocols[protocolId] = protocol;
    });
  }

  _initActionor(protocol: RPCProtocol): void {
    protocol.set("appService", appService);
  }
}
