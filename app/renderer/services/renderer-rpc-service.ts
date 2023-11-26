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

  async initCommunication(): Promise<void> {
    // 1. Notify all processes that the current process is happy to communicate now.
    // 2. All other processes will try to send a messageport to here via the main process as a bridge.
    // 3. Once receiving a messageport, the current process will create a MessagePortProtocol for communication.
    // 4. All actionors in the current process will be binded with this protocol immediately.
    //    TODO: When we update actionors, we should re-binded them with the protocol again.

    // 5. After the protocol is created, we will send a message through the protocol to request the exposed APIs.
    //    All this code should be in the protocol class.

    ipcRenderer.on("response-port", (event, senderID) => {
      const port = event.ports[0];

      if (!this._protocols[senderID]) {
        const protocol = new MessagePortRPCProtocol(
          port,
          "rendererProcess",
          true
        );

        this._protocols[senderID] = protocol;
        this.initActionor(protocol);
      }
    });

    ipcRenderer.postMessage("request-port", "rendererProcess");
  }

  async waitForAPI(
    processID: string,
    namespace: string,
    timeout: number
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      for (let i = 0; i < timeout / 100; i++) {
        if (
          this._protocols[processID] &&
          this._protocols[processID].exposedAPIs[namespace]
        ) {
          resolve(true);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (
        this._protocols[processID] &&
        this._protocols[processID].exposedAPIs[namespace]
      ) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  async registerAPI() {
    // 1. Expose the APIs of the current process to other processes by registering the API to the main process.
    return new Promise((resolve) => {
      // ipcRenderer.on("new-messageport", (event, data) => {
      //   const port = event.ports[0];
      //   console.log("port", data, port);
      //   resolve();
      // });

      ipcRenderer.postMessage("register-api", "PLAPI");
    });
  }

  listenProtocolCreation(): void {
    // TODO: change this name
    // ipcRenderer.on("create-messageport-rpc-protocol", (event, data) => {
    //   const port = event.ports[0];
    //   const protocol = new MessagePortRPCProtocol(port, "rendererProcess");
    //   this._protocols[data.protocolId] = protocol;
    //   this.initActionor(protocol);
    //   this.initProxy(protocol, data.exposedAPIs);
    // });
  }

  requestExposedAPI(port: MessagePort) {
    port.postMessage(`request-exposed-api`);
  }

  receiveExposedAPI(
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
      if (!this._remoteAPIs[namespace]) {
        this._remoteAPIs[namespace] = {};
        globalThis[namespace] = {};
      }

      for (const API of APIs) {
        globalThis[namespace][API] = protocol.getProxy(API);
      }
    }
  }
}
