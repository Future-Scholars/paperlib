import { ipcRenderer, IpcRendererEvent, shell } from 'electron';
import { app, BrowserWindow, dialog, nativeTheme } from '@electron/remote';
import keytar from 'keytar';

import { SharedState } from './app-state';
import { Preference, PreferenceType } from '../utils/preference';
import { Theme } from '../utils/theme';
import { constructFileURL } from '../utils/path';

export class SystemInteractor {
  sharedState: SharedState;
  preference: Preference;
  theme: Theme;

  constructor(sharedState: SharedState, preference: Preference) {
    this.sharedState = sharedState;
    this.preference = preference;

    this.theme = new Theme(
      this.preference.get('preferedTheme') as 'light' | 'dark' | 'system'
    );
  }

  // ============================================================
  // Window
  minimize() {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
      window.minimize();
    }
  }

  toggleMaximize() {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  }

  close() {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
      window.close();
      app.quit();
    }
  }

  setTheme(theme: 'light' | 'dark' | 'system') {
    nativeTheme.themeSource = this.preference.get('preferedTheme') as
      | 'light'
      | 'dark'
      | 'system';

    const preferedTheme =
      (this.preference.get('preferedTheme') as 'light' | 'dark' | 'system') ===
      'system'
        ? theme
        : (this.preference.get('preferedTheme') as 'light' | 'dark');

    this.sharedState.set('viewState.theme', preferedTheme);
    this.theme.set(preferedTheme);
  }

  // ============================================================
  // State
  getState(path: string) {
    return this.sharedState.get(path);
  }

  setState(path: string, value: number | string | boolean) {
    this.sharedState.set(path, value);
  }

  registerState(
    path: string,
    callback: (
      event: IpcRendererEvent,
      message: number | string | boolean
    ) => void
  ) {
    ipcRenderer.on(this.sharedState.get(path).id, callback);
  }

  registerSignal(
    signal: string,
    callback: (
      event: IpcRendererEvent,
      message: number | string | boolean
    ) => void
  ) {
    ipcRenderer.on(signal, callback);
  }

  // ============================================================
  // Preference
  loadPreferences(): PreferenceType {
    return this.preference.store.store;
  }

  updatePreference(name: string, value: unknown, parse = false) {
    if (parse) {
      value = JSON.parse(value as string);
    }
    this.preference.set(name, value);
    this.sharedState.set('viewState.preferenceUpdated', new Date().getTime());
  }

  getPreference(name: string) {
    return this.preference.get(name);
  }

  showFolderPicker() {
    void dialog
      .showOpenDialog({ properties: ['openDirectory'] })
      .then((result) => {
        this.sharedState.set('dbState.selectedPath', result.filePaths[0]);
      });
  }

  version() {
    return app.getVersion();
  }

  // ============================================================
  openweb(url: string) {
    void shell.openExternal(url);
  }

  getJoinedURL(url: string, joined = true, withProtocol = false) {
    const fileURL = constructFileURL(
      url,
      joined,
      withProtocol,
      this.preference.get('appLibFolder') as string
    );
    return fileURL;
  }

  // ============================================================
  async getPassword(key: string) {
    return await keytar.getPassword('paperlib', key);
  }

  async setPassword(key: string, pwd: string) {
    await keytar.setPassword('paperlib', key, pwd);
  }
}
