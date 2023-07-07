import { ipcRenderer } from "electron";
import ElectronStore from "electron-store";
import keytar from "keytar";
import os from "os";
import { join } from "path";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { isRendererProcess } from "@/base/process";

export interface IScraperPreference {
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

export interface IDownloaderPreference {
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

export interface IPreferenceStore {
  preferenceVersion: number;
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

  scrapers: Record<string, IScraperPreference>;
  downloaders: Array<IDownloaderPreference>;

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
  mainviewSortOrder: "desc" | "asce";
  mainviewType: string;

  pluginLinkedFolder: string;

  selectedPDFViewer: string;
  selectedPDFViewerPath: string;

  selectedCSLStyle: string;
  importedCSLStylesPath: string;

  showPresettingLang: boolean;
  showPresettingDB: boolean;
  showPresettingScraper: boolean;
}

const _defaultPreferences: IPreferenceStore = {
  preferenceVersion: 1,
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

function _migrate(
  store: ElectronStore<IPreferenceStore>,
  preferenceVersion: number
) {
  const prevVersion = store.has("preferenceVersion")
    ? store.get("preferenceVersion")
    : 0;

  if (prevVersion === 0) {
    // depracated scrapers
    const existingScraperArray = store.get(
      "scrapers"
    ) as unknown as IScraperPreference[];

    if (existingScraperArray && !!existingScraperArray[Symbol.iterator]) {
      store.set("scrapers", _defaultPreferences.scrapers);
      const newScraperRecord = store.get("scrapers");

      for (const existingScraper of existingScraperArray) {
        if (existingScraper.name === "cvf") {
          continue;
        }
        newScraperRecord[existingScraper.name] = existingScraper;
        newScraperRecord[existingScraper.name].category =
          _defaultPreferences.scrapers[existingScraper.name]?.category ||
          "custom";
      }
      store.set("scrapers", newScraperRecord);
    }

    if (store.get("scrapers")) {
      const newScraperRecord = store.get("scrapers");
      try {
        for (const key of ["pdf", "paperlib", "chemrxiv", "biomedrxiv"]) {
          if (newScraperRecord[key]) {
            // @ts-ignore
            newScraperRecord[key] = undefined;
          }
        }
        store.set("scrapers", newScraperRecord);
      } catch (e) {
        console.log(e);
      }
    }

    const existingDownloaderArray = store.get(
      "downloaders"
    ) as unknown as IDownloaderPreference[];

    if (existingDownloaderArray) {
      for (const defaultDownloader of _defaultPreferences.downloaders) {
        if (
          !existingDownloaderArray.find(
            (downloader) => downloader.name === defaultDownloader.name
          )
        ) {
          existingDownloaderArray.push(defaultDownloader);
        }
      }
      store.set("downloaders", existingDownloaderArray);
    }
  }

  store.set("preferenceVersion", preferenceVersion);

  return store;
}

export const IPreferenceService = createDecorator("preferenceService");

export const PREFEREMCE_VERSION: number = 1;

/**
 * Preference service.
 * It is a wrapper of ElectronStore with responsive states.
 */
export class PreferenceService extends Eventable<IPreferenceStore> {
  private readonly _store: ElectronStore<IPreferenceStore>;

  constructor() {
    let _store: ElectronStore<IPreferenceStore>;
    if (isRendererProcess()) {
      const userDataPath = PLMainAPI.fileSystemService.getSystemPathSync(
        "userData"
      ) as unknown as string;
      _store = new ElectronStore<IPreferenceStore>({
        cwd: userDataPath,
      });
    } else {
      _store = new ElectronStore<IPreferenceStore>({});
    }

    _store = _migrate(_store, PREFEREMCE_VERSION);

    super("preferenceService", JSON.parse(JSON.stringify(_store.store)));

    this._store = _store;
  }

  /**
   * Get the value of the preference
   * @param key - key of the preference
   * @returns value of the preference
   */
  get(key: keyof IPreferenceStore) {
    if (this._store.has(key)) {
      return this._store.get(key);
    } else {
      const patch = {};
      patch[key] = _defaultPreferences[key];
      this.set(patch);
      return _defaultPreferences[key];
    }
  }

  /**
   * Set the value of the preference
   * @param patch - patch object
   * @returns
   */
  set(patch: Partial<IPreferenceStore>) {
    this._store.set(patch);
    this.fire(patch);
  }

  async getPassword(key: string) {
    return await keytar.getPassword("paperlib", key);
  }

  async setPassword(key: string, pwd: string) {
    await keytar.setPassword("paperlib", key, pwd);
  }
}
