import { ipcRenderer, shell } from "electron";

import { PaperEntity } from "../models/PaperEntity";

export class PluginSideInteractor {
  port: MessagePort | null;

  constructor() {
    this.port = null;
    ipcRenderer.on("plugin-comm-port", (event) => {
      const [port] = event.ports;
      this.port = port;
    });
  }

  search(search: string): Promise<PaperEntity[]> {
    return new Promise((resolve, reject) => {
      if (this.port) {
        this.port.onmessage = (event) => {
          ipcRenderer.send(
            "plugin-window-resize",
            Math.min(28 * (event.data.length + 1) + 76, 394)
          );
          resolve(event.data);
        };
        this.port.postMessage(JSON.stringify({ op: "search", value: search }));
      } else {
        resolve([]);
      }
    });
  }

  export(entitiesStr: string, format: string) {
    if (this.port) {
      this.port.postMessage(
        JSON.stringify({ op: "export", value: entitiesStr, args: format })
      );
    }
  }

  hide() {
    ipcRenderer.send("plugin-window-hide");
  }

  resize() {
    ipcRenderer.send("plugin-window-resize", 76);
  }

  open(url: string) {
    shell.openExternal(url);
  }
}
