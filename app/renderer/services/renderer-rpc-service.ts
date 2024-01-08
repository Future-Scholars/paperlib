import { ipcRenderer } from "electron";

import { createDecorator } from "@/base/injection/injection";
import { MessagePortRPCProtocol } from "@/base/rpc/messageport-rpc-protocol";
import { RPCService } from "@/base/rpc/rpc-service";

interface IRendererRPCServiceState {
  initialized: string;
}

export const IRendererRPCService = createDecorator("rendererRPCService");

export class RendererRPCService extends RPCService<IRendererRPCServiceState> {
  constructor(
    private readonly _processID: string,
    private readonly _exposeAPIGroup?: string
  ) {
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
          this._processID,
          false
        );

        this._protocols[senderID] = protocol;
        this.initActionor(protocol);

        if (this._exposeAPIGroup) {
          protocol.sendExposedAPI(this._exposeAPIGroup);
        }
      }
    });

    ipcRenderer.on("destroy-port", (event, senderID) => {
      if (this._protocols[senderID]) {
        delete this._protocols[senderID];
      }
    });

    ipcRenderer.postMessage("request-port", this._processID);
  }

  setActionor(actionors: { [key: string]: any }): void {
    this._actionors = actionors;

    for (const [processID, protocol] of Object.entries(this._protocols)) {
      this.initActionor(protocol);
      if (this._exposeAPIGroup) {
        protocol.sendExposedAPI(this._exposeAPIGroup);
      }
    }
  }
}
