import { ipcRenderer } from "electron";
import Store from "electron-store";
import os from "os";
import path from "path";

export interface ScraperPreference {
  name: string;
  description: string;
  enable: boolean;
  custom: boolean;
  args: string;
  priority: number;
  preProcessCode: string;
  parsingProcessCode: string;
  scrapeImplCode: string;
}

export interface DownloaderPreference {
  name: string;
  description: string;
  enable: boolean;
  custom: boolean;
  args: string;
  priority: number;
  preProcessCode: string;
  queryProcessCode: string;
  downloadImplCode: string;
}

export interface PreferenceStore {
  appLibFolder: string;
  deleteSourceFile: boolean;

  showSidebarCount: boolean;
  isSidebarCompact: boolean;

  showMainYear: boolean;
  showMainPublication: boolean;
  showMainPubType: boolean;
  showMainRating: boolean;
  showMainFlag: boolean;
  showMainTags: boolean;
  showMainFolders: boolean;
  showMainNote: boolean;

  preferedTheme: "light" | "dark" | "system";
  invertColor: boolean;
  sidebarSortBy: "name" | "count" | "color";
  sidebarSortOrder: "asce" | "desc";
  renamingFormat: "full" | "short" | "authortitle" | "custom";
  customRenamingFormat: string;

  language: string;

  enableExportReplacement: boolean;
  exportReplacement: Array<{ from: string; to: string }>;

  useSync: boolean;
  syncCloudBackend: string;
  syncAPPID: "";
  syncAPIKey: string;
  syncEmail: string;

  syncFileStorage: string;
  webdavURL: string;
  webdavUsername: string;
  webdavPassword: string;

  allowRoutineMatch: boolean;
  lastRematchTime: number;

  lastFeedRefreshTime: number;

  scrapers: Array<ScraperPreference>;
  downloaders: Array<DownloaderPreference>;

  allowproxy: boolean;
  httpproxy: string;
  httpsproxy: string;

  lastVersion: string;
  lastDBVersion: number;

  shortcutPlugin: string;
  shortcutPreview: string;
  shortcutOpen: string;
  shortcutCopy: string;
  shortcutScrape: string;
  shortcutEdit: string;
  shortcutFlag: string;
  shortcutCopyKey: string;

  sidebarWidth: number;
  mainviewSortBy: string;
  mainviewSortOrder: string;
  mainviewType: string;

  pluginLinkedFolder: string;

  selectedPDFViewer: string;
  selectedPDFViewerPath: string;

  [Key: string]: unknown;
}

export const defaultPreferences: PreferenceStore = {
  appLibFolder: path.join(os.homedir(), "Documents", "paperlib"),
  deleteSourceFile: false,

  showSidebarCount: true,
  isSidebarCompact: false,

  showMainYear: true,
  showMainPublication: true,
  showMainPubType: false,
  showMainRating: false,
  showMainFlag: true,
  showMainTags: false,
  showMainFolders: false,
  showMainNote: false,

  preferedTheme: "light",
  invertColor: true,
  sidebarSortBy: "name",
  sidebarSortOrder: "asce",
  renamingFormat: "full",
  customRenamingFormat: "",

  language: "en-GB",

  enableExportReplacement: true,
  exportReplacement: [],

  useSync: false,
  syncCloudBackend: "official",
  syncAPPID: "",
  syncAPIKey: "",
  syncEmail: "",

  syncFileStorage: "local",
  webdavURL: "",
  webdavUsername: "",
  webdavPassword: "",

  allowRoutineMatch: true,
  lastRematchTime: Math.round(Date.now() / 1000),

  lastFeedRefreshTime: Math.round(Date.now() / 1000),

  allowproxy: true,
  httpproxy: "",
  httpsproxy: "",

  lastVersion: "",
  lastDBVersion: -1,

  shortcutPlugin: "CommandOrControl+Shift+I",
  shortcutPreview: "Space",
  shortcutOpen: "Enter",
  shortcutCopy: "CommandOrControl+Shift+C",
  shortcutScrape: "CommandOrControl+R",
  shortcutEdit: "CommandOrControl+E",
  shortcutFlag: "CommandOrControl+F",
  shortcutCopyKey: "CommandOrControl+Shift+K",

  sidebarWidth: 20,
  mainviewSortBy: "addTime",
  mainviewSortOrder: "desc",
  mainviewType: "list",

  scrapers: [
    {
      name: "pdf",
      description: "PDF builtin scraper",
      enable: true,
      custom: false,
      args: "",
      priority: 10,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    {
      name: "arxiv",
      description: "arXiv.org",
      enable: true,
      custom: false,
      args: "",
      priority: 9,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    {
      name: "crossref",
      description: "crossref.org",
      enable: false,
      custom: false,
      args: "",
      priority: 8.5,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    {
      name: "doi",
      description: "DOI.org",
      enable: true,
      custom: false,
      args: "",
      priority: 8,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    {
      name: "dblp",
      description: "DBLP.org",
      enable: true,
      custom: false,
      args: "",
      priority: 7,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    {
      name: "openreview",
      description: "OpenReview.net",
      enable: true,
      custom: false,
      args: "",
      priority: 6,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    {
      name: "paperlib",
      description: "The Paperlib query service.",
      enable: true,
      custom: false,
      args: "",
      priority: 5,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    {
      name: "ieee",
      description: "args: IEEE API Key. https://developer.ieee.org/",
      enable: false,
      custom: false,
      args: "",
      priority: 4,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    {
      name: "pwc",
      description: "paperwithcode.com",
      enable: true,
      custom: false,
      args: "",
      priority: 3,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    {
      name: "googlescholar",
      description: "Google Scholar",
      enable: true,
      custom: false,
      args: "",
      priority: 2,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
  ],

  downloaders: [
    {
      name: "arxiv",
      description: "ArXiv.org",
      enable: true,
      custom: false,
      args: "",
      priority: 10,
      preProcessCode: "",
      queryProcessCode: "",
      downloadImplCode: "",
    },
    {
      name: "x-hub",
      description: "XXX-hub, fill the url in args.",
      enable: false,
      custom: false,
      args: "",
      priority: 9,
      preProcessCode: "",
      queryProcessCode: "",
      downloadImplCode: "",
    },
    {
      name: "unpaywall",
      description:
        "Unpaywall, fill your email in args to remove the rate limits.",
      enable: true,
      custom: false,
      args: "",
      priority: 8,
      preProcessCode: "",
      queryProcessCode: "",
      downloadImplCode: "",
    },
  ],

  pluginLinkedFolder: "",

  selectedPDFViewer: "default",
  selectedPDFViewerPath: "",

  selectedCSLStyle: "apa",
  importedCSLStylesPath: "",
};

export class Preference {
  store: Store<PreferenceStore>;

  constructor(rendererProcess: boolean = false) {
    if (rendererProcess) {
      const appPath = ipcRenderer.sendSync("userData");
      this.store = new Store({
        cwd: appPath,
      });
    } else {
      this.store = new Store<PreferenceStore>({});
    }

    for (const key in defaultPreferences) {
      if (!this.store.has(key)) {
        this.store.set(key, defaultPreferences[key]);
      }
    }

    const existingScrapers = this.store
      .get("scrapers")
      .map((scraper) => scraper.name);

    for (const defaultPref of defaultPreferences.scrapers) {
      if (!existingScrapers.includes(defaultPref.name)) {
        const existingPreference = this.store.get("scrapers");
        existingPreference.push(defaultPref);
        this.store.set("scrapers", existingPreference);
      }
    }
  }

  get(key: string) {
    if (this.store.has(key)) {
      return this.store.get(key);
    } else {
      this.set(key, defaultPreferences[key]);
      return defaultPreferences[key];
    }
  }

  set(key: string, value: unknown) {
    this.store.set(key, value);
  }
}
