import { ipcRenderer, shell } from "electron";
import keytar from "keytar";

import { FileRepository } from "../repositories/file-repository/file-repository";

import { SharedState } from "../utils/appstate";
import { Preference } from "../utils/preference";

export class AppInteractor {
  sharedState: SharedState;
  preference: Preference;

  fileRepository: FileRepository;

  constructor(
    sharedState: SharedState,
    preference: Preference,
    fileRepository: FileRepository
  ) {
    this.sharedState = sharedState;
    this.preference = preference;
    this.fileRepository = fileRepository;
  }

  async version() {
    return await ipcRenderer.invoke("version");
  }

  // ============================================================
  // Window Operation
  minimize() {
    ipcRenderer.send("minimize");
  }

  maximize() {
    ipcRenderer.send("maximize");
  }

  close() {
    ipcRenderer.send("close");
  }

  // ============================================================
  // State Operation
  getState(dest: string) {
    return this.sharedState.get(dest).get();
  }

  setState(dest: string, value: number | string | boolean) {
    this.sharedState.set(dest, value);
  }

  registerState(
    dest: string,
    callback: (value: number | string | boolean) => void
  ) {
    this.sharedState.register(dest, callback);
  }

  // ============================================================
  // Preference
  loadPreferences() {
    return this.preference.store.store;
  }

  updatePreference(name: string, value: unknown, parse = false) {
    if (parse) {
      value = JSON.parse(value as string);
    }
    this.preference.set(name, value);
    this.sharedState.set("viewState.preferenceUpdated", new Date().getTime());
  }

  getPreference(name: string) {
    return this.preference.get(name);
  }

  // ============================================================
  async open(url: string) {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    } else {
      const accessedURL = (await this.access(url, true)).replace("file://", "");
      shell.openPath(accessedURL);
    }
  }

  async access(url: string, download: boolean) {
    return await this.fileRepository.access({
      url: url,
      download: download,
    });
  }

  async preview(url: string) {
    const fileURL = await this.access(url, true);
    ipcRenderer.send("preview", fileURL);
  }

  async showFolderPicker() {
    return await ipcRenderer.invoke("show-folder-picker");
  }

  // ============================================================
  async getPassword(key: string) {
    return await keytar.getPassword("paperlib", key);
  }

  async setPassword(key: string, pwd: string) {
    await keytar.setPassword("paperlib", key, pwd);
  }

  // ============================================================
  showContextMenu(key: string, args: string) {
    ipcRenderer.send(key, JSON.parse(args));
  }

  // ============================================================
  registerMainSignal(signal: string, callback: (args: any) => void) {
    ipcRenderer.on(signal, (_, args) => callback(args));
  }
}
