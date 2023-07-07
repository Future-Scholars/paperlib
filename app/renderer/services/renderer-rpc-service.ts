import { ipcRenderer } from "electron";

import { EIRendererRPCProtocol } from "@/base/rpc/ei-renderer-rpc-protocol";

import { MessagePortRPCProtocol } from "../../base/rpc/messageport-rpc-protocol";
import { RPCProtocol, RPCService } from "../../base/rpc/rpc-service";

interface IRendererRPCServiceState {
  initialized: string;
}

export class RendererRPCService extends RPCService<IRendererRPCServiceState> {
  constructor() {
    super("rendererRPCService", { initialized: "" });

    this._listenProtocolCreation();
  }

  _listenProtocolCreation(): void {
    if (process.type !== "renderer") {
      throw new Error(
        "RendererRPCService should only be instantiated in the renderer process"
      );
    }

    // TODO: change this name
    ipcRenderer.on("create-messageport-rpc-protocol", (event, data) => {
      const port = event.ports[0];
      const protocolId = data;
      const protocol = new MessagePortRPCProtocol(port, "rendererProcess");
      this.initActionor(protocol);
      this.initProxy(protocol, protocolId);
      this._protocols[protocolId] = protocol;
    });

    const eiRendererRPCProtocol = new EIRendererRPCProtocol();
    this.initProxy(eiRendererRPCProtocol, "mainProcess");
  }

  initActionor(protocol: RPCProtocol): void {
    protocol.set("appService", appService);
  }

  initProxy(protocol: RPCProtocol, protocolId: string): void {
    if (protocolId === "extensionProcess") {
    } else if (protocolId === "mainProcess") {
      globalThis.PLMainAPI = {
        windowProcessManagementService: (
          protocol as EIRendererRPCProtocol
        ).getProxy("windowProcessManagementService"),
        fileSystemService: (protocol as EIRendererRPCProtocol).getProxy(
          "fileSystemService"
        ),
        contextMenuService: (protocol as EIRendererRPCProtocol).getProxy(
          "contextMenuService"
        ),
        menuService: (protocol as EIRendererRPCProtocol).getProxy(
          "menuService"
        ),
        upgradeService: (protocol as EIRendererRPCProtocol).getProxy(
          "upgradeService"
        ),
        proxyService: (protocol as EIRendererRPCProtocol).getProxy(
          "proxyService"
        ),
      };
    }
  }
}
