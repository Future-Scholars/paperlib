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
  downloaders: Array<DownloaderPreference>;

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

const defaultPreferences: PreferenceStore = {
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

  constructor() {
    this.store = new Store<PreferenceStore>({});

    let migrationRequired = false;
    if (!this.store.has("scrapers")) {
      console.log("Migrate scrapers preference to new format");
      migrationRequired = true;
    }

    for (const key in defaultPreferences) {
      if (!this.store.has(key)) {
        this.store.set(key, defaultPreferences[key]);
      }
    }

    if (migrationRequired) {
      let defaultScraperPrefs = defaultPreferences.scrapers;
      if (!this.store.get("pdfBuiltinScraper")) {
        defaultScraperPrefs[0].enable = false;
      }
      if (!this.store.get("arXivScraper")) {
        defaultScraperPrefs[1].enable = false;
      }
      if (!this.store.get("doiScraper")) {
        defaultScraperPrefs[2].enable = false;
      }
      if (!this.store.get("dblpScraper")) {
        defaultScraperPrefs[3].enable = false;
      }
      if (!this.store.get("openreviewScraper")) {
        defaultScraperPrefs[4].enable = false;
      }
      if (!this.store.get("cvfScraper")) {
        defaultScraperPrefs[5].enable = false;
      }
      if (!this.store.get("ieeeScraper")) {
        defaultScraperPrefs[6].enable = false;
      }
      defaultScraperPrefs[6].args = this.store.get("ieeeAPIKey");
      if (!this.store.get("pwcScraper")) {
        defaultScraperPrefs[7].enable = false;
      }
      if (!this.store.get("googlescholarScraper")) {
        defaultScraperPrefs[8].enable = false;
      }
      this.store.set("scrapers", defaultScraperPrefs);
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
