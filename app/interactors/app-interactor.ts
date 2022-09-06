import { ipcRenderer, shell } from "electron";
import keytar from "keytar";
import { spawn, SpawnOptions } from "child_process";
import { pathExists, readdir, readFile } from "fs-extra";
import path from "path";
import os from "os";

import { Preference } from "../preference/preference";

export class AppInteractor {
  preference: Preference;

  constructor(preference: Preference) {
    this.preference = preference;
  }

  async version() {
    return await ipcRenderer.invoke("version");
  }

  // ===============================
  // Window Control
  // ===============================
  minimize() {
    ipcRenderer.send("minimize");
  }

  maximize() {
    ipcRenderer.send("maximize");
  }

  close() {
    ipcRenderer.send("close");
  }

  // ===============================
  // Theme
  // ===============================
  changeTheme(theme: string) {
    ipcRenderer.send("themeChanged", theme);
  }

  // ===============================
  // Preference
  // ===============================
  loadPreferences() {
    return this.preference.store.store;
  }

  setPreference(name: string, value: any, parse = false) {
    if (parse) {
      value = JSON.parse(value as string);
    }
    this.preference.set(name, value);
    // TODO: Uncomment this
    // this.stateStore.viewState.preferenceUpdated.value = Date.now();
  }

  getPreference(name: string) {
    return this.preference.get(name);
  }

  // =============================
  // Password
  // =============================
  async getPassword(key: string) {
    return await keytar.getPassword("paperlib", key);
  }

  async setPassword(key: string, pwd: string) {
    await keytar.setPassword("paperlib", key, pwd);
  }

  // =============================
  // Register Events
  // =============================
  showContextMenu(key: string, args: any) {
    ipcRenderer.send(key, args);
  }

  registerMainSignal(signal: string, callback: (args: any) => void) {
    ipcRenderer.on(signal, (_, args) => callback(args));
  }

  // =============================
  // URL Handler
  // =============================

  async access(url: string, download: boolean) {
    // TODO: Implement this
    // return await this.fileRepository.access(url, download);
    return "";
  }

  async open(url: string) {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    } else {
      // TODO: Implement this
      console.log("Open File: ", url);
      // const accessedURL = (await this.access(url, true)).replace("file://", "");
      // if (this.preference.get("selectedPDFViewer") === "default") {
      //   shell.openPath(accessedURL);
      // } else {
      //   const viewerPath = this.preference.get(
      //     "selectedPDFViewerPath"
      //   ) as string;
      //   const exists = await pathExists(viewerPath);
      //   if (!exists) {
      //     console.error("Viewer not found");
      //   }
      //   const opts: SpawnOptions = {
      //     detached: true,
      //   };
      //   if (os.platform() === "win32") {
      //     spawn(viewerPath, [accessedURL], opts);
      //   } else {
      //     spawn("open", ["-a", viewerPath, accessedURL], opts);
      //   }
      // }
    }
  }
}
