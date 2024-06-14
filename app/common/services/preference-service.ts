import { ipcRenderer } from "electron";
import ElectronStore from "electron-store";
import keytar from "keytar";
import os from "os";
import { join } from "path";

import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { isRendererProcess } from "@/base/process";
import { cmdOrCtrl } from "@/common/utils.ts";

export interface IDataViewField {
  key: string;
  enable: boolean;
  width: number;
}

export interface IPreferenceStore {
  preferenceVersion: number;
  windowSize: { height: number; width: number };

  appLibFolder: string;
  sourceFileOperation: "cut" | "copy" | "link";

  showSidebarCount: boolean;
  isSidebarCompact: boolean;

  mainTableFields: IDataViewField[];

  feedFields: IDataViewField[];

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
  isFlexibleSync: boolean;
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

  shortcutDelete: string;

  shortcutImportFrom: string;

  sidebarWidth: number;
  detailPanelWidth: number;
  mainviewSortBy: string;
  mainviewSortOrder: "desc" | "asce";
  mainviewType: string;
  mainviewShortAuthor: boolean;

  pluginLinkedFolder: string;

  selectedPDFViewer: string;
  selectedPDFViewerPath: string;

  selectedCSLStyle: string;
  importedCSLStylesPath: string;

  showPresetting: boolean;
  showGuide: boolean;
  showWelcome: boolean;
  fontsize: "normal" | "large" | "larger";
}

const _defaultPreferences: IPreferenceStore = {
  preferenceVersion: 1,
  windowSize: { height: 800, width: 1440 },

  appLibFolder: join(os.homedir(), "Documents", "paperlib"),
  sourceFileOperation: "copy",

  showSidebarCount: true,
  isSidebarCompact: false,

  mainTableFields: [
    { key: "title", enable: true, width: -1 },
    { key: "authors", enable: true, width: -1 },
    { key: "publication", enable: true, width: -1 },
    { key: "pubTime", enable: true, width: -1 },
    { key: "pubType", enable: false, width: -1 },
    { key: "doi", enable: false, width: -1 },
    { key: "arxiv", enable: false, width: -1 },
    { key: "mainURL", enable: false, width: -1 },
    { key: "supURLs", enable: false, width: -1 },
    { key: "rating", enable: false, width: -1 },
    { key: "tags", enable: false, width: -1 },
    { key: "folders", enable: false, width: -1 },
    { key: "flag", enable: true, width: -1 },
    { key: "note", enable: false, width: -1 },
    { key: "codes", enable: false, width: -1 },
    { key: "pages", enable: false, width: -1 },
    { key: "volume", enable: false, width: -1 },
    { key: "number", enable: false, width: -1 },
    { key: "publisher", enable: false, width: -1 },
    { key: "addTime", enable: true, width: -1 },
  ],

  feedFields: [
    { key: "feed", enable: false, width: -1 },
    { key: "feedTime", enable: false, width: -1 },
    { key: "title", enable: true, width: -1 },
    { key: "authors", enable: true, width: -1 },
    { key: "abstract", enable: false, width: -1 },
    { key: "publication", enable: true, width: -1 },
    { key: "pubTime", enable: true, width: -1 },
    { key: "pubType", enable: false, width: -1 },
    { key: "doi", enable: false, width: -1 },
    { key: "arxiv", enable: false, width: -1 },
    { key: "pages", enable: false, width: -1 },
    { key: "volume", enable: false, width: -1 },
    { key: "number", enable: false, width: -1 },
    { key: "publisher", enable: false, width: -1 },
    { key: "addTime", enable: true, width: -1 },
  ],

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
  isFlexibleSync: false,
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

  shortcutPlugin: `${cmdOrCtrl}+Shift+I`,
  shortcutPreview: "Space",
  shortcutOpen: "Enter",
  shortcutCopy: `${cmdOrCtrl}+Shift+C`,
  shortcutScrape: `${cmdOrCtrl}+R`,
  shortcutEdit: `${cmdOrCtrl}+E`,
  shortcutFlag: `${cmdOrCtrl}+F`,
  shortcutCopyKey: `${cmdOrCtrl}+Shift+K`,

  shortcutDelete: "Delete",

  shortcutImportFrom: `${cmdOrCtrl}+O`,

  sidebarWidth: 20,
  detailPanelWidth: 75,
  mainviewSortBy: "addTime",
  mainviewSortOrder: "desc",
  mainviewType: "list",
  mainviewShortAuthor: false,

  pluginLinkedFolder: "",

  selectedPDFViewer: "default",
  selectedPDFViewerPath: "",

  selectedCSLStyle: "apa",
  importedCSLStylesPath: "",

  showPresetting: true,
  showGuide: true,
  showWelcome: true,
  fontsize: "normal",
};

function _migrate(
  store: ElectronStore<IPreferenceStore>,
  preferenceVersion: number
) {
  // Versions:
  // 0: Paperlib < 3.0.0
  // 1: Paperlib >= 3.0.0-beta.1
  // 2: Paperlib >= 3.0.0-beta.4
  const prevVersion = store.has("preferenceVersion")
    ? store.get("preferenceVersion")
    : 0;

  if (prevVersion === 0) {
    // If there is no key in existing store, set the default value
    for (const key of Object.keys(_defaultPreferences)) {
      if (!store.has(key)) {
        store.set(key, _defaultPreferences[key]);
      }
    }

    // depracated scrapers, downloaders etc.
    for (const key of Object.keys(store.store)) {
      if (!_defaultPreferences.hasOwnProperty(key)) {
        try {
          store.delete(key as keyof IPreferenceStore);
        } catch (e) {}
      }
    }
  }

  if (prevVersion <= 1) {
    // depracated data field settings.
    const keyMap = {
      title: [null, "mainTitleWidth", "feedTitleWidth"],
      authors: [null, "mainAuthorsWidth", "feedAuthorsWidth"],
      pubTime: ["showMainYear", "mainYearWidth", "feedYearWidth"],
      publication: [
        "showMainPublication",
        "mainPublicationWidth",
        "feedPublicationWidth",
      ],
      pubType: ["showMainPubType", "mainPubTypeWidth", "feedPubTypeWidth"],
      rating: ["showMainRating", "mainRatingWidth", "feedRatingWidth"],
      flag: ["showMainFlag", "mainFlagWidth", null],
      tags: ["showMainTag", "mainTagWidth", null],
      folders: ["showMainFolder", "mainFolderWidth", null],
      note: ["showMainNote", "mainNoteWidth", null],
      addTime: ["showMainAddTime", "mainAddTimeWidth", "feedAddTimeWidth"],
    };

    const mainTableFields: IDataViewField[] = [];
    const feedFields: IDataViewField[] = [];

    for (const [key, defaultMainTableFields] of Object.entries(
      _defaultPreferences.mainTableFields
    )) {
      const [preShowKey, preMainWidthKey, preFeedWidthKey] = keyMap[key] || [
        null,
        null,
        null,
      ];

      const enable =
        preShowKey && key !== "title" && key! == "authors"
          ? (store.get(preShowKey) as boolean)
          : true;

      if (preMainWidthKey !== null) {
        defaultMainTableFields["width"] = store.get(preMainWidthKey) || -1;
        defaultMainTableFields["enable"] = enable;

        store.delete(preMainWidthKey as any);
      }
      mainTableFields.push(defaultMainTableFields);
    }

    for (const [key, defaultFeedFields] of Object.entries(
      _defaultPreferences.feedFields
    )) {
      const [preShowKey, preMainWidthKey, preFeedWidthKey] = keyMap[key] || [
        null,
        null,
        null,
      ];

      const enable =
        preShowKey && key !== "title" && key! == "authors"
          ? (store.get(preShowKey) as boolean)
          : true;

      if (preFeedWidthKey !== null) {
        defaultFeedFields["width"] = store.get(preFeedWidthKey) || -1;
        defaultFeedFields["enable"] = enable;

        store.delete(preFeedWidthKey as any);
      }

      feedFields.push(defaultFeedFields);

      if (preShowKey !== null) {
        store.delete(preShowKey as any);
      }
    }

    store.set("mainTableFields", mainTableFields);
    store.set("feedFields", feedFields);
  }

  store.set("preferenceVersion", preferenceVersion);

  return store;
}

export const IPreferenceService = createDecorator("preferenceService");

export const PREFERENCE_VERSION: number = 2;

/**
 * Preference service.
 * It is a wrapper of ElectronStore with responsive states.
 */
export class PreferenceService extends Eventable<IPreferenceStore> {
  private readonly _store: ElectronStore<IPreferenceStore>;

  constructor() {
    let _store: ElectronStore<IPreferenceStore>;
    if (isRendererProcess()) {
      const userDataPath = ipcRenderer.sendSync("getSystemPath", "userData");
      _store = new ElectronStore<IPreferenceStore>({
        cwd: userDataPath,
      });
    } else {
      _store = new ElectronStore<IPreferenceStore>({});
    }

    _store = _migrate(_store, PREFERENCE_VERSION);

    super("preferenceService", JSON.parse(JSON.stringify(_store.store)));

    this._store = _store;
  }

  /**
   * Get the value of the preference
   * @param key - Key of the preference
   * @returns Value of the preference
   */
  @errorcatching("Failed to get preference.", true, "PrefService", null)
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
   * @param patch - Patch object
   */
  @errorcatching("Failed to set preference.", true, "PrefService")
  set(patch: Partial<IPreferenceStore>) {
    this._store.set(patch);
    this.fire(patch);
  }

  /**
   * Get the password
   * @param key - Key of the password
   * @returns Password
   */
  @errorcatching("Failed to get password.", true, "PrefService", null)
  async getPassword(key: string) {
    return await keytar.getPassword("paperlib", key);
  }

  /**
   * Set the password
   * @param key - Key of the password
   * @param pwd - Password
   */
  @errorcatching("Failed to set password.", true, "PrefService")
  async setPassword(key: string, pwd: string) {
    await keytar.setPassword("paperlib", key, pwd);
  }
}
