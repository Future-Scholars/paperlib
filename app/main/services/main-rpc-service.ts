import { MessagePortMain } from "electron";

import { EIMainRPCProtocol } from "@/base/rpc/ei-main-rpc-protocol";
import { MessagePortRPCProtocol } from "@/base/rpc/messageport-rpc-protocol";
import { RPCProtocol, RPCService } from "@/base/rpc/rpc-service";

interface IMainRPCServiceState {
  initialized: number;
}

export class MainRPCService extends RPCService<IMainRPCServiceState> {
  constructor() {
    super("mainRPCService", { initialized: 0 });
  }

  _listenProtocolCreation(): void {
    if (process.type !== "browser") {
      throw new Error(
        "MainRPCService should only be instantiated in the main process"
      );
    }

    const eiMainRPCProtocol = new EIMainRPCProtocol();
    this._initActionor(eiMainRPCProtocol);
  }

  _initActionor(protocol: RPCProtocol): void {
    protocol.set(
      "windowProcessManagementService",
      windowProcessManagementService
    );
    protocol.set("windowControlService", windowControlService);
    protocol.set("fileSystemService", fileSystemService);
    protocol.set("contextMenuService", contextMenuService);
  }

  _initProxy(protocol: RPCProtocol, protocolId: string): void {
    if (protocolId === "extensionProcess") {
    }
  }
}
