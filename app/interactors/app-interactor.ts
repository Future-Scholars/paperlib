import { ipcRenderer } from "electron";
import keytar from "keytar";

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
}
