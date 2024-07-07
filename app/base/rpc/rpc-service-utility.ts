import { MessagePortRPCProtocol } from "./messageport-rpc-protocol";
import { RPCService } from "./rpc-service";

export class UtilityProcessRPCService extends RPCService {
  constructor(
    protected readonly _processID: string,
    protected readonly _exposeAPIGroup?: string
  ) {
    super(_processID, _exposeAPIGroup);

    if (process.type !== "utility") {
      throw new Error(
        "UtilityProcessRPCService should only be instantiated in the utility process"
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

    process.parentPort.on("message", (event) => {
      if (event.data.type === "response-port") {
        const senderID = event.data.value;
        const port = event.ports[0];

        if (!this._protocols[senderID]) {
          const protocol = new MessagePortRPCProtocol(
            port,
            this._processID,
            false
          );

          this._protocols[senderID] = protocol;
          this.initActionor(protocol);

          this._exposeAPIGroup && protocol.sendExposedAPI(this._exposeAPIGroup);
        }
      } else if (event.data.type === "destroy-port") {
        const senderID = event.data.value;

        if (this._protocols[senderID]) {
          delete this._protocols[senderID];
        }
      }
    });

    process.parentPort.postMessage({
      type: "request-port",
      value: this._processID,
    });
  }
}
