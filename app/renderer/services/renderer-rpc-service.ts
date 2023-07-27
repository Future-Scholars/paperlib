import { ipcRenderer } from "electron";

import { EIRendererRPCProtocol } from "@/base/rpc/ei-renderer-rpc-protocol";

import { MessagePortRPCProtocol } from "@/base/rpc/messageport-rpc-protocol";
import { RPCProtocol, RPCService } from "@/base/rpc/rpc-service";
import { APPService, IAPPService } from "@/renderer/services/app-service";
import { ILogService, LogService } from "@/renderer/services/log-service";
import {
  CommandService,
  ICommandService,
} from "@/renderer/services/command-service";
import { createDecorator } from "@/base/injection/injection";

interface IRendererRPCServiceState {
  initialized: string;
}

export const IRendererRPCService = createDecorator("rendererRPCService");

export class RendererRPCService extends RPCService<IRendererRPCServiceState> {
  protected _apiNamespace = "PLAPI";

  constructor() {
    super("rendererRPCService", { initialized: "" });

    if (process.type !== "renderer") {
      throw new Error(
        "RendererRPCService should only be instantiated in the renderer process"
      );
    }

    // const eiRendererRPCProtocol = new EIRendererRPCProtocol();
    // this.initProxy(eiRendererRPCProtocol, {
    //   PLMainAPI: [
    //     "windowProcessManagementService",
    //     "fileSystemService",
    //     "contextMenuService",
    //     "upgradeService",
    //     "menuService",
    //     "proxyService",
    //   ],
    // });
  }

  listenProtocolCreation(): void {
    // TODO: change this name
    ipcRenderer.on("create-messageport-rpc-protocol", (event, data) => {
      const port = event.ports[0];
      const protocol = new MessagePortRPCProtocol(port, "rendererProcess");
      this._protocols[data.protocolId] = protocol;
      this.initActionor(protocol);

      this.initProxy(protocol, data.exposedAPIs);
    });
  }

  requestExposedAPI(
    port: MessagePort
  ): Promise<{ [namespace: string]: string[] }> {
    return new Promise((resolve) => {
      port.onmessage = (event) => {
        if (event.data.startsWith("exposed-api")) {
          const exposedAPIs = JSON.parse(
            event.data.replace("exposed-api:", "")
          );
          resolve(exposedAPIs);
        }
      };
    });
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
