import { ipcRenderer } from "electron";
import ElectronStore from "electron-store";
import keytar from "keytar";
import os from "os";
import { join } from "path";

import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { isRendererProcess } from "@/base/process";

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

  showPresetting: boolean;
  fontsize: "normal" | "large" | "larger";
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

  pluginLinkedFolder: "",

  selectedPDFViewer: "default",
  selectedPDFViewerPath: "",

  selectedCSLStyle: "apa",
  importedCSLStylesPath: "",

  showPresetting: true,
  fontsize: "normal",
};

function _migrate(
  store: ElectronStore<IPreferenceStore>,
  preferenceVersion: number
) {
  // Versions:
  // 0: Paperlib < 3.0.0
  // 1: Paperlib >= 3.0.0
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

  store.set("preferenceVersion", preferenceVersion);

  return store;
}

export const IPreferenceService = createDecorator("preferenceService");

export const PREFERENCE_VERSION: number = 1;

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
