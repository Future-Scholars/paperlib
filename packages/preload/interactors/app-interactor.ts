import { ipcRenderer, shell } from "electron";
import keytar from "keytar";
import { ToadScheduler, SimpleIntervalJob, Task } from "toad-scheduler";

import { DBRepository } from "../repositories/db-repository/db-repository";
import { FileRepository } from "../repositories/file-repository/file-repository";

import { SharedState } from "../utils/appstate";
import { Preference } from "../utils/preference";

export class AppInteractor {
  sharedState: SharedState;
  preference: Preference;

  dbRepository: DBRepository;
  fileRepository: FileRepository;

  scheduler: ToadScheduler;

  constructor(
    sharedState: SharedState,
    preference: Preference,
    dbRepository: DBRepository,
    fileRepository: FileRepository
  ) {
    this.sharedState = sharedState;
    this.preference = preference;

    this.dbRepository = dbRepository;
    this.fileRepository = fileRepository;

    this.scheduler = new ToadScheduler();
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
  changeTheme(theme: string) {
    ipcRenderer.send("themeChanged", theme);
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
    this.sharedState.set("viewState.preferenceUpdated", Date.now());
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
    return await this.fileRepository.access(url, download);
  }

  async preview(url: string) {
    const fileURL = await this.access(url, true);
    ipcRenderer.send("preview", fileURL);
  }

  async showFilePicker() {
    return await ipcRenderer.invoke("show-file-picker");
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
    ipcRenderer.send(key, args);
  }

  // ============================================================
  registerMainSignal(signal: string, callback: (args: any) => void) {
    ipcRenderer.on(signal, (_, args) => callback(args));
  }

  // ============================================================
  pauseSync() {
    this.scheduler.removeById("pauseSync");
    const task = new Task("pauseSync", () => {
      void this.dbRepository.pauseSync();
      this.scheduler.removeById("pauseSync");
    });

    const job = new SimpleIntervalJob(
      { seconds: 3600, runImmediately: false },
      task,
      "pauseSync"
    );

    this.scheduler.addSimpleIntervalJob(job);
  }

  resumeSync() {
    this.scheduler.removeById("pauseSync");
    void this.dbRepository.resumeSync();
  }

  migrateLocaltoCloud() {
    void this.dbRepository.migrateLocaltoCloud();
  }

  // ============================================================
  async shouldShowWhatsNew() {
    const lastVersion = this.getPreference("lastVersion");
    return lastVersion !== (await this.version());
  }

  async hideWhatsNew() {
    this.preference.set("lastVersion", await this.version());
  }
}
