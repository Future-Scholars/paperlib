import path from "path";
import os from "os";
import Store from "electron-store";

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

export interface PreferenceStore {
  appLibFolder: string;
  deleteSourceFile: boolean;
  showSidebarCount: boolean;
  isSidebarCompact: boolean;
  preferedTheme: "light" | "dark" | "system";
  invertColor: boolean;
  sidebarSortBy: "name" | "count" | "color";
  sidebarSortOrder: "asce" | "desc";
  renamingFormat: "full" | "short" | "authortitle" | "custom";
  customRenamingFormat: string;

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

  pdfBuiltinScraper: boolean;
  arXivScraper: boolean;
  doiScraper: boolean;
  dblpScraper: boolean;
  openreviewScraper: boolean;
  cvfScraper: boolean;
  ieeeScraper: boolean;
  ieeeAPIKey: string;
  pwcScraper: boolean;
  googlescholarScraper: boolean;

  scrapers: Array<ScraperPreference>;

  httpproxy: string;
  httpsproxy: string;

  lastVersion: string;

  shortcutPlugin: string;
  shortcutPreview: string;
  shortcutOpen: string;
  shortcutCopy: string;
  shortcutScrape: string;
  shortcutEdit: string;
  shortcutFlag: string;

  sidebarWidth: number;

  [Key: string]: unknown;
}

const defaultPreferences: PreferenceStore = {
  appLibFolder: path.join(os.homedir(), "Documents", "paperlib"),
  deleteSourceFile: false,
  showSidebarCount: true,
  isSidebarCompact: false,
  preferedTheme: "light",
  invertColor: true,
  sidebarSortBy: "name",
  sidebarSortOrder: "asce",
  renamingFormat: "full",
  customRenamingFormat: "",

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

  pdfBuiltinScraper: true,
  arXivScraper: true,
  doiScraper: true,
  dblpScraper: true,
  openreviewScraper: true,
  cvfScraper: true,
  ieeeScraper: true,
  ieeeAPIKey: "",
  pwcScraper: true,
  googlescholarScraper: true,

  httpproxy: "",
  httpsproxy: "",

  lastVersion: "",

  shortcutPlugin: "CommandOrControl+Shift+I",
  shortcutPreview: "Space",
  shortcutOpen: "Enter",
  shortcutCopy: "CommandOrControl+Shift+C",
  shortcutScrape: "CommandOrControl+R",
  shortcutEdit: "CommandOrControl+E",
  shortcutFlag: "CommandOrControl+F",

  sidebarWidth: 20,

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
      name: "cvf",
      description: "The Computer Vision Foundation",
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
      description:
        "IEEE xplore, args: IEEE API Key. https://developer.ieee.org/",
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
};

export class Preference {
  store: Store<PreferenceStore>;

  constructor() {
    this.store = new Store<PreferenceStore>({});
    for (const key in defaultPreferences) {
      if (!this.store.has(key)) {
        this.store.set(key, defaultPreferences[key]);
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
