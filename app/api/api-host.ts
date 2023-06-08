import { ipcRenderer } from "electron";

import { RPCProtocol } from "../rpc/rpc-protocol";

// API host in the main renderer process
export class APIHost {
  protocols: { [id: string]: RPCProtocol } = {};

  constructor() {
    if (process.type !== "renderer") {
      throw new Error(
        "APIHost should only be instantiated in renderer process"
      );
    }

    ipcRenderer.on("create-rpc-protocol", (event, data) => {
      const port = event.ports[0];
      const protocolId = data;
      const protocol = new RPCProtocol(port);
      this.setActionor(protocol);
      this.protocols[protocolId] = protocol;
      window.logger.info("create-rpc-protocol", data, false, "APIHost");
    });
  }

  setActionor(protocol: RPCProtocol) {
    protocol.set("app", window.appInteractor);
  }
}
