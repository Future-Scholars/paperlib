import { SpawnOptions, spawn } from "child_process";
import { ipcRenderer, shell } from "electron";
import { existsSync, readFile, readdir } from "fs";
import keytar from "keytar";
import os from "os";
import path from "path";

import { FileRepository } from "@/repositories/file-repository/file-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import { Preference } from "../preference/preference";

export class AppInteractor {
  stateStore: MainRendererStateStore;
  preference: Preference;

  fileRepository: FileRepository;

  constructor(
    stateStore: MainRendererStateStore,
    preference: Preference,
    fileRepository: FileRepository
  ) {
    this.stateStore = stateStore;
    this.preference = preference;

    this.fileRepository = fileRepository;
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
    this.stateStore.viewState.preferenceUpdated = Date.now();
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
    return await this.fileRepository.access(url, download);
  }

  async open(url: string) {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    } else {
      const accessedURL = (await this.access(url, true)).replace("file://", "");
      if (this.preference.get("selectedPDFViewer") === "default") {
        shell.openPath(accessedURL);
      } else {
        const viewerPath = this.preference.get(
          "selectedPDFViewerPath"
        ) as string;
        // TODO: check this
        const exists = existsSync(viewerPath);
        if (!exists) {
          console.error("Viewer not found");
        }
        const opts: SpawnOptions = {
          detached: true,
        };
        if (os.platform() === "win32") {
          spawn(viewerPath, [accessedURL], opts);
        } else {
          spawn("open", ["-a", viewerPath, accessedURL], opts);
        }
      }
    }
  }

  async preview(url: string) {
    const fileURL = await this.access(url, true);
    ipcRenderer.send("preview", fileURL);
  }

  async showInFinder(url: string) {
    const accessedURL = (await this.access(url, true)).replace("file://", "");
    shell.showItemInFolder(accessedURL);
  }
}
