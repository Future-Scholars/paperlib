import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";

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

export const IPreferenceService = createDecorator("preferenceService");

export const PREFERENCE_VERSION: number = 2;

/**
 * Preference service.
 * It is a wrapper of ElectronStore with responsive states.
 * @deprecated Use `PLMainAPI.preferenceService` instead.
 */
export class PreferenceService extends Eventable<IPreferenceStore> {
  /**
   * Get the value of the preference
   * @param key - Key of the preference
   * @returns Value of the preference
   * @deprecated Use `PLMainAPI.preferenceService` instead.
   */
  @errorcatching("Failed to get preference.", true, "PrefService", null)
  async get(key: keyof IPreferenceStore) {
    return await PLMainAPI.preferenceService.get(key);
  }

  /**
   * Set the value of the preference
   * @param patch - Patch object
   * @deprecated Use `PLMainAPI.preferenceService` instead.
   */
  @errorcatching("Failed to set preference.", true, "PrefService")
  set(patch: Partial<IPreferenceStore>) {
    PLMainAPI.preferenceService.set(patch);
    this.fire(patch);
  }

  /**
   * Get the password
   * @param key - Key of the password
   * @returns Password
   * @deprecated Use `PLMainAPI.preferenceService` instead.
   */
  @errorcatching("Failed to get password.", true, "PrefService", null)
  async getPassword(key: string) {
    return await PLMainAPI.preferenceService.getPassword(key);
  }

  /**
   * Set the password
   * @param key - Key of the password
   * @param pwd - Password
   * @deprecated Use `PLMainAPI.preferenceService` instead.
   */
  @errorcatching("Failed to set password.", true, "PrefService")
  async setPassword(key: string, pwd: string) {
    return await PLMainAPI.preferenceService.setPassword(key, pwd);
  }

  /**
   * @deprecated Use `PLMainAPI.preferenceService` instead.
   */
  useState() {
    return PLMainAPI.preferenceService.useState();
  }
  /**
   * @deprecated Use `PLMainAPI.preferenceService` instead.
   */
  onChanged(
    key: keyof IPreferenceStore | (keyof IPreferenceStore)[],
    callback: (newValues: { key: keyof IPreferenceStore; value: any }) => void
  ): () => void {
    return PLMainAPI.preferenceService.onChanged(key, callback);
  }
  /**
   * @deprecated Use `PLMainAPI.preferenceService` instead.
   */
  fire(event: any, onlyIfChanged?: boolean): void {
    PLMainAPI.preferenceService.fire(event, onlyIfChanged);
  }
  /**
   * @deprecated Use `PLMainAPI.preferenceService` instead.
   */
  already(
    key: keyof IPreferenceStore | (keyof IPreferenceStore)[],
    callback: (newValues: { key: keyof IPreferenceStore; value: any }) => void
  ): () => void {
    return PLMainAPI.preferenceService.already(key, callback);
  }
}
