import { SpawnOptions, spawn } from "child_process";
import { ipcRenderer, shell } from "electron";
import { XMLParser } from "fast-xml-parser";
import { existsSync, readFileSync, readdirSync } from "fs";
import keytar from "keytar";
import os from "os";
import path from "path";

import { DBRepository } from "@/repositories/db-repository/db-repository";
import { FileRepository } from "@/repositories/file-repository/file-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import { Preference } from "../preference/preference";

export class AppInteractor {
  stateStore: MainRendererStateStore;
  preference: Preference;

  fileRepository: FileRepository;
  dbRepository: DBRepository;

  constructor(
    stateStore: MainRendererStateStore,
    preference: Preference,
    fileRepository: FileRepository,
    dbRepository: DBRepository
  ) {
    this.stateStore = stateStore;
    this.preference = preference;

    this.fileRepository = fileRepository;
    this.dbRepository = dbRepository;
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
    let patch: Record<string, any> = {};
    patch[name] = value;
    this.stateStore.preferenceState.$patch(patch);
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
    ipcRenderer.removeListener(signal, callback);
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

  async showFilePicker() {
    return await ipcRenderer.invoke("show-file-picker");
  }

  async showFolderPicker() {
    return await ipcRenderer.invoke("show-folder-picker");
  }

  getUserDataPath() {
    return ipcRenderer.sendSync("userData");
  }

  // ============================================================
  async loadCSLStyles(): Promise<{ key: string; name: string }[]> {
    const CSLStyles = [
      {
        key: "apa",
        name: "American Psychological Association",
      },
      {
        key: "vancouver",
        name: "Vancouver",
      },
      {
        key: "harvard1",
        name: "Harvard1",
      },
    ];

    const importedCSLStylesPath = this.preference.get(
      "importedCSLStylesPath"
    ) as string;

    if (importedCSLStylesPath) {
      // List all files in the importedCSLStylesPath
      const files = readdirSync(importedCSLStylesPath);
      const xmlParser = new XMLParser();

      const parsePromise = async (filePath: string) => {
        const fileContent = readFileSync(filePath);
        const xml = xmlParser.parse(fileContent);
        try {
          const name = xml.style.info.title;
          const key = path.basename(filePath, ".csl");
          return { key, name };
        } catch (e) {
          return null;
        }
      };

      const promises = [];

      for (const file of files) {
        if (file.endsWith(".csl")) {
          promises.push(parsePromise(path.join(importedCSLStylesPath, file)));
        }
      }

      const importedCSLStyles = (await Promise.all(promises)).filter(
        (item) => item !== null
      ) as { key: string; name: string }[];

      return [...CSLStyles, ...importedCSLStyles];
    }

    return CSLStyles;
  }

  // =============================
  // Database Event
  // =============================
  async initDB() {
    await this.dbRepository.initRealm(true);
    this.stateStore.viewState.realmReinited = Date.now();
  }

  migrateLocaltoCloud() {
    void this.dbRepository.migrateLocaltoCloud();
  }
}
