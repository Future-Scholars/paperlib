import { ipcRenderer } from "electron";
import Store from "electron-store";
import os from "os";
import { join } from "path";

export interface ScraperPreference {
  name: string;
  category: string;
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
  windowSize: { height: number; width: number };

  appLibFolder: string;
  deleteSourceFile: boolean; // deprecated, use sourceFileOperation = 'cut'
  sourceFileOperation: "cut" | "copy" | "link";

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
  showMainAddTime: boolean;

  mainTitleWidth: number;
  mainAuthorsWidth: number;
  mainYearWidth: number;
  mainPublicationWidth: number;
  mainPubTypeWidth: number;
  mainRatingWidth: number;
  mainFlagWidth: number;
  mainTagsWidth: number;
  mainFoldersWidth: number;
  mainNoteWidth: number;
  mainAddTimeWidth: number;

  feedTitleWidth: number;
  feedAuthorsWidth: number;
  feedYearWidth: number;
  feedPublicationWidth: number;
  feedPubTypeWidth: number;
  feedAddTimeWidth: number;

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

  scrapers: Record<string, ScraperPreference>;
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
  detailPanelWidth: number;
  mainviewSortBy: string;
  mainviewSortOrder: string;
  mainviewType: string;

  pluginLinkedFolder: string;

  selectedPDFViewer: string;
  selectedPDFViewerPath: string;

  showPresettingLang: boolean;
  showPresettingDB: boolean;
  showPresettingScraper: boolean;

  [Key: string]: unknown;
}

export const defaultPreferences: PreferenceStore = {
  windowSize: { height: 800, width: 1440 },

  appLibFolder: join(os.homedir(), "Documents", "paperlib"),
  deleteSourceFile: false,
  sourceFileOperation: "copy",

  showSidebarCount: true,
  isSidebarCompact: false,

  showMainYear: true,
  showMainPublication: true,
  showMainPubType: false,
  showMainRating: true,
  showMainFlag: true,
  showMainTags: false,
  showMainFolders: false,
  showMainNote: false,
  showMainAddTime: false,

  mainTitleWidth: -1,
  mainAuthorsWidth: -1,
  mainYearWidth: -1,
  mainPublicationWidth: -1,
  mainPubTypeWidth: -1,
  mainRatingWidth: -1,
  mainFlagWidth: -1,
  mainTagsWidth: -1,
  mainFoldersWidth: -1,
  mainNoteWidth: -1,
  mainAddTimeWidth: -1,

  feedTitleWidth: -1,
  feedAuthorsWidth: -1,
  feedYearWidth: -1,
  feedPublicationWidth: -1,
  feedPubTypeWidth: -1,
  feedAddTimeWidth: -1,

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
  detailPanelWidth: 75,
  mainviewSortBy: "addTime",
  mainviewSortOrder: "desc",
  mainviewType: "list",

  scrapers: {
    arxiv: {
      name: "arxiv",
      category: "general",
      description: "arXiv.org",
      enable: true,
      custom: false,
      args: "",
      priority: 9,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },

    doi: {
      name: "doi",
      category: "general",
      description: "DOI.org",
      enable: true,
      custom: false,
      args: "",
      priority: 8,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    dblp: {
      name: "dblp",
      category: "cs",
      description: "DBLP.org",
      enable: true,
      custom: false,
      args: "",
      priority: 7,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    openreview: {
      name: "openreview",
      category: "general",
      description: "OpenReview.net",
      enable: true,
      custom: false,
      args: "",
      priority: 6,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    ieee: {
      name: "ieee",
      category: "ee",
      description: "args: IEEE API Key. https://developer.ieee.org/",
      enable: false,
      custom: false,
      args: "",
      priority: 4,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    semanticscholar: {
      name: "semanticscholar",
      category: "general",
      description: "semanticscholar.org",
      enable: true,
      custom: false,
      args: "",
      priority: 3.5,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    crossref: {
      name: "crossref",
      category: "general",
      description: "crossref.org",
      enable: false,
      custom: false,
      args: "",
      priority: 3,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    googlescholar: {
      name: "googlescholar",
      category: "general",
      description: "Google Scholar",
      enable: true,
      custom: false,
      args: "",
      priority: 2,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    pwc: {
      name: "pwc",
      category: "cs",
      description: "paperwithcode.com",
      enable: true,
      custom: false,
      args: "",
      priority: 1,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    scopus: {
      name: "scopus",
      category: "general",
      description: "Elsevier Scopus",
      enable: false,
      custom: false,
      args: "",
      priority: 1,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    adsabs: {
      name: "adsabs",
      category: "phys",
      description: "NASA Astrophysics Data System",
      enable: false,
      custom: false,
      args: "",
      priority: 1,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    springer: {
      name: "springer",
      category: "general",
      description: "Springer Nature",
      enable: false,
      custom: false,
      args: "",
      priority: 1,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    spie: {
      name: "spie",
      category: "phys",
      description: "Inte. Society for Optics and Photonics",
      enable: false,
      custom: false,
      args: "",
      priority: 1,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    chemrxivprecise: {
      name: "chemrxivprecise",
      category: "chem",
      description: "ChemRxiv.org by DOI",
      enable: false,
      custom: false,
      args: "",
      priority: 1,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    chemrxivfuzzy: {
      name: "chemrxivfuzzy",
      category: "chem",
      description: "ChemRxiv.org by title",
      enable: false,
      custom: false,
      args: "",
      priority: 1,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
    pubmed: {
      name: "pubmed",
      category: "bio / med",
      description: "PubMed",
      enable: false,
      custom: false,
      args: "",
      priority: 1,
      preProcessCode: "",
      parsingProcessCode: "",
      scrapeImplCode: "",
    },
  },

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
      name: "semanticscholar",
      description: "semanticscholar.org",
      enable: true,
      custom: false,
      args: "",
      priority: 9,
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

  showPresettingLang: true,
  showPresettingDB: true,
  showPresettingScraper: true,
};

export class Preference {
  store: Store<PreferenceStore>;

  constructor(rendererProcess: boolean = false) {
    if (rendererProcess) {
      const appPath = ipcRenderer.sendSync("getSystemPath", "userData");
      this.store = new Store({
        cwd: appPath,
      });
    } else {
      this.store = new Store<PreferenceStore>({});
    }

    // depracated scrapers
    const existingScraperArray = this.store.get(
      "scrapers"
    ) as unknown as ScraperPreference[];

    if (existingScraperArray && !!existingScraperArray[Symbol.iterator]) {
      this.store.set("scrapers", defaultPreferences.scrapers);
      const newScraperRecord = this.store.get("scrapers");

      for (const existingScraper of existingScraperArray) {
        if (existingScraper.name === "cvf") {
          continue;
        }
        newScraperRecord[existingScraper.name] = existingScraper;
        newScraperRecord[existingScraper.name].category =
          defaultPreferences.scrapers[existingScraper.name]?.category ||
          "custom";
      }
      this.store.set("scrapers", newScraperRecord);
    }

    if (this.store.get("scrapers")) {
      const newScraperRecord = this.store.get("scrapers");
      try {
        for (const key of ["pdf", "paperlib", "chemrxiv", "biomedrxiv"]) {
          if (newScraperRecord[key]) {
            // @ts-ignore
            newScraperRecord[key] = undefined;
          }
        }
        this.store.set("scrapers", newScraperRecord);
      } catch (e) {
        console.log(e);
      }
    }

    const existingDownloaderArray = this.store.get(
      "downloaders"
    ) as unknown as DownloaderPreference[];

    if (existingDownloaderArray) {
      for (const defaultDownloader of defaultPreferences.downloaders) {
        if (
          !existingDownloaderArray.find(
            (downloader) => downloader.name === defaultDownloader.name
          )
        ) {
          existingDownloaderArray.push(defaultDownloader);
        }
      }
      this.store.set("downloaders", existingDownloaderArray);
    }

    for (const key in defaultPreferences) {
      if (!this.store.has(key)) {
        this.store.set(key, defaultPreferences[key]);
      }
    }

    // migrate old preference
    if (
      this.store.has("deleteSourceFile") &&
      this.store.get("deleteSourceFile")
    ) {
      this.store.set("sourceFileOperation", "cut");
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
