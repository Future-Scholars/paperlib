import { ipcRenderer, shell } from "electron";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { PluginRendererStateStore } from "@/state/renderer/appstate";

export class PluginSideInteractor {
  port?: MessagePort;

  stateStore: PluginRendererStateStore;
  preference: Preference;

  constructor(stateStore: PluginRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;

    ipcRenderer.on("plugin-comm-port", (event) => {
      const [port] = event.ports;
      this.port = port;
      this.pluginLinkFolder(this.preference.get("pluginLinkedFolder") as string);
    });
  }

  search(search: string): Promise<PaperEntity[]> {
    return new Promise((resolve, reject) => {
      if (this.port) {
        this.port.onmessage = (event) => {
          if (event.data.type === "search-result") {
            const results = JSON.parse(event.data.value) as PaperEntity[];

            ipcRenderer.send(
              "plugin-window-resize",
              Math.min(28 * (results.length + 1) + 78, 394)
            );
            resolve(results);
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
      if (folder === "paperlib-link-new-folder") {
        folder = "Folder_" + new Date().getTime();
      }

      this.stateStore.selectionState.pluginLinkedFolder = folder;
      this.port.postMessage(
        JSON.stringify({ op: "plugin-link-folder", value: folder })
      );
    }
  }

  pluginUnlinkFolder() {
    if (this.port) {
      this.stateStore.selectionState.pluginLinkedFolder = "";
      this.port.postMessage(JSON.stringify({ op: "plugin-unlink-folder" }));
    }
  }

  linkedFolder(): string {
    return this.preference.get("pluginLinkedFolder") as string;
  }

  registerMainSignal(signal: string, callback: (args: any) => void) {
    ipcRenderer.on(signal, (_, args) => callback(args));
  }
}
