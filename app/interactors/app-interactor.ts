import { SpawnOptions, spawn } from "child_process";
import { ipcRenderer, shell } from "electron";
import { XMLParser } from "fast-xml-parser";
import { existsSync, readFileSync, readdirSync } from "fs";
import keytar from "keytar";
import os from "os";
import path from "path";
import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";

import { Preference } from "@/preference/preference";
import { FileRepository } from "@/repositories/file-repository/file-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

export class AppInteractor {
  stateStore: MainRendererStateStore;
  preference: Preference;

  scheduler: ToadScheduler;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;

    this.scheduler = new ToadScheduler();
  }

  async version() {
    return await ipcRenderer.invoke("version");
  }

  isMac() {
    return os.platform() === "darwin";
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

  forceclose() {
    ipcRenderer.send("force-close");
  }

  // ===============================
  // Theme
  // ===============================
  changeTheme(theme: string) {
    ipcRenderer.send("theme-change", theme);
  }

  // ===============================
  // Preference
  // ===============================
  setPreference(name: string, value: any, parse = false) {
    if (parse) {
      value = JSON.parse(value as string);
    }
    this.preference.set(name, value);
    let patch: Record<string, any> = {};
    patch[name] = value;
    this.stateStore.preferenceState.$patch(patch);
  }

  setPreferenceAsync(name: string, value: any, parse = false) {
    return new Promise<void>((resolve) => {
      this.setPreference(name, value, parse);
      resolve();
    });
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
  // Reference
  // =============================
  // TODO: move to reference interactor?
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

      const promises: Promise<{
        key: string;
        name: any;
      } | null>[] = [];

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
}
