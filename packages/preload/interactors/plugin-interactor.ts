import { ipcRenderer, shell } from "electron";

import { PaperEntity } from "../models/PaperEntity";

export class PluginInteractor {
  // @ts-ignore
  port: MessagePort;

  constructor() {
    ipcRenderer.on("new-client", (event) => {
      const [port] = event.ports;
      this.port = port;
    });
  }

  search(search: string): Promise<PaperEntity[]> {
    return new Promise((resolve, reject) => {
      this.port.postMessage(JSON.stringify({ op: "search", value: search }));

      this.port.onmessage = (event) => {
        ipcRenderer.send(
          "resize-plugin",
          Math.min(28 * (event.data.length + 1) + 64, 394)
        );
        resolve(event.data);
      };
    });
  }

  export(entitiesStr: string, format: string) {
    this.port.postMessage(
      JSON.stringify({ op: "export", value: entitiesStr, args: format })
    );
  }

  hide() {
    ipcRenderer.send("hide-plugin");
  }

  async open(url: string) {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    }
  }
}
