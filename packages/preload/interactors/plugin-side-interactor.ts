import { ipcMain, ipcRenderer, shell } from "electron";

import { PluginSharedState } from "../utils/appstate";
import { Preference } from "../utils/preference";

import { PaperEntity } from "../models/PaperEntity";

export class PluginSideInteractor {
  port: MessagePort | null;

  sharedState: PluginSharedState;
  preference: Preference;

  constructor(sharedState: PluginSharedState, preference: Preference) {
    this.port = null;

    this.sharedState = sharedState;
    this.preference = preference;

    ipcRenderer.on("plugin-comm-port", (event) => {
      const [port] = event.ports;
      this.port = port;
    });
  }

  search(search: string): Promise<PaperEntity[]> {
    return new Promise((resolve, reject) => {
      if (this.port) {
        this.port.onmessage = (event) => {
          if (event.data.type === "search-result") {
            ipcRenderer.send(
              "plugin-window-resize",
              Math.min(28 * (event.data.value.length + 1) + 76, 394)
            );
            resolve(event.data.value);
          } else {
            resolve([]);
          }
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

  async showFolderList() {
    return await new Promise((resolve, reject) => {
      if (this.port) {
        this.port.onmessage = (event) => {
          if (event.data.type === "folder-list-result") {
            ipcRenderer.send(
              "plugin-window-show-folder-list",
              event.data.value
            );
            resolve(null);
          } else {
            resolve(null);
          }
        };

        ipcRenderer.on("plugin-context-menu-link", (event, args) => {
          this.pluginLinkFolder(args[0]);
        });

        this.port.postMessage(JSON.stringify({ op: "folder-list", value: "" }));
      } else {
        resolve(null);
      }
    });
  }

  pluginLinkFolder(folder: string) {
    if (this.port) {
      this.sharedState.set("selectionState.pluginLinkedFolder", folder);
      this.port.postMessage(
        JSON.stringify({ op: "plugin-link-folder", value: folder })
      );
    }
  }

  pluginUnlinkFolder() {
    if (this.port) {
      this.sharedState.set("selectionState.pluginLinkedFolder", "");
      this.port.postMessage(JSON.stringify({ op: "plugin-unlink-folder" }));
    }
  }

  linkedFolder(): string {
    return this.preference.get("pluginLinkedFolder") as string;
  }

  registerState(
    dest: string,
    callback: (value: number | string | boolean) => void
  ) {
    this.sharedState.register(dest, callback);
  }

  registerMainSignal(signal: string, callback: (args: any) => void) {
    ipcRenderer.on(signal, (_, args) => callback(args));
  }
}
