import { ipcRenderer, shell } from "electron";
import keytar from "keytar";
import { ToadScheduler, SimpleIntervalJob, Task } from "toad-scheduler";
import { spawn, SpawnOptions } from "child_process";
import { pathExists, readdir, readFile } from "fs-extra";
import path from "path";
import os from "os";
import { XMLParser } from "fast-xml-parser";

import { DBRepository } from "../repositories/db-repository/db-repository";
import { DownloaderRepository } from "../repositories/downloader-repository/downloader-repository";
import { FileRepository } from "../repositories/file-repository/file-repository";
import { ScraperRepository } from "../repositories/scraper-repository/scraper-repository";

import { SharedState } from "../utils/appstate";
import { Preference } from "../utils/preference";
import { string } from "yargs";

export class AppInteractor {
  sharedState: SharedState;
  preference: Preference;

  dbRepository: DBRepository;
  fileRepository: FileRepository;
  scraperRepository: ScraperRepository;
  downloaderRepository: DownloaderRepository;

  scheduler: ToadScheduler;

  constructor(
    sharedState: SharedState,
    preference: Preference,
    dbRepository: DBRepository,
    fileRepository: FileRepository,
    scraperRepository: ScraperRepository,
    downloaderRepository: DownloaderRepository
  ) {
    this.sharedState = sharedState;
    this.preference = preference;

    this.dbRepository = dbRepository;
    this.fileRepository = fileRepository;
    this.scraperRepository = scraperRepository;
    this.downloaderRepository = downloaderRepository;

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

  setState(dest: string, value: number | string | boolean, publish = true) {
    this.sharedState.set(dest, value, publish);
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
  filename(url: string) {
    return path.basename(url);
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

        const exists = await pathExists(viewerPath);
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

  async showInFinder(url: string) {
    const accessedURL = (await this.access(url, true)).replace("file://", "");
    shell.showItemInFolder(accessedURL);
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

  sendMainSignal(signal: string, args: any) {
    ipcRenderer.send(signal, args);
  }

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

  async shouldShowDBUpdateRequire() {
    const lastDBVersion = this.getPreference("lastDBVersion");
    const currentVersion = this.dbRepository._schemaVersion;
    return (
      lastDBVersion !== currentVersion &&
      (this.getPreference("useSync") as boolean)
    );
  }

  async hideDBUpdateRequire() {
    this.preference.set("lastDBVersion", this.dbRepository._schemaVersion);
  }

  recreateScrapers() {
    this.scraperRepository.createScrapers();
  }

  recreateDownloaders() {
    this.downloaderRepository.createDownloaders();
  }

  async requestXHub(url: string) {
    return await ipcRenderer.invoke("sidework-window-xhub-request", url);
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
      const files = await readdir(importedCSLStylesPath);
      const xmlParser = new XMLParser();

      const parsePromise = async (filePath: string) => {
        const fileContent = await readFile(filePath);
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
}
