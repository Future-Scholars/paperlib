import { ipcRenderer } from "electron";

import { createDecorator } from "@/base/injection/injection";
import { Process } from "@/base/process-id";
import { MessagePortRPCProtocol } from "@/base/rpc/messageport-rpc-protocol";
import { RPCService } from "@/base/rpc/rpc-service";

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
  }

  async initCommunication(): Promise<void> {
    // 1. Notify all processes that the current process is happy to communicate now.
    // 2. All other processes will try to send a messageport to here via the main process as a bridge.
    // 3. Once receiving a messageport, the current process will create a MessagePortProtocol for communication.
    // 4. All actionors in the current process will be binded with this protocol immediately.

    // 5. After the protocol is created, we will send a message through the protocol to request the exposed APIs.
    //    All this code should be in the protocol class.

    ipcRenderer.on("response-port", (event, senderID) => {
      const port = event.ports[0];

      if (!this._protocols[senderID]) {
        const protocol = new MessagePortRPCProtocol(
          port,
          Process.renderer,
          false
        );

        this._protocols[senderID] = protocol;
        this.initActionor(protocol);

        protocol.sendExposedAPI("PLAPI");
      }
    });

    ipcRenderer.on("destroy-port", (event, senderID) => {
      if (this._protocols[senderID]) {
        delete this._protocols[senderID];
      }
    });

    ipcRenderer.postMessage("request-port", Process.renderer);
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

  setActionor(actionors: { [key: string]: any }): void {
    this._actionors = actionors;

    for (const [processID, protocol] of Object.entries(this._protocols)) {
      this.initActionor(protocol);
      protocol.sendExposedAPI("PLAPI");
    }
  }
}
