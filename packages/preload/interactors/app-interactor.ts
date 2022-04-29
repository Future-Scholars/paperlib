import { ipcRenderer, shell } from "electron";

import { FileRepository } from "../repositories/file-repository/file-repository";

import { SharedState } from "../utils/appstate";
import { Preference } from "../utils/preference";

export class AppInteractor {
  sharedState: SharedState;
  preference: Preference;

  fileRepository: FileRepository;

  constructor(
    sharedState: SharedState,
    preference: Preference,
    fileRepository: FileRepository
  ) {
    this.sharedState = sharedState;
    this.preference = preference;
    this.fileRepository = fileRepository;
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
  // State Operation
  getState(dest: string) {
    return this.sharedState.get(dest);
  }

  setState(dest: string, value: number | string | boolean) {
    this.sharedState.set(dest, value);
  }

  registerState(
    dest: string,
    callback: (value: number | string | boolean) => void
  ) {
    this.sharedState.register(dest, callback);
  }

  // ============================================================
  open(url: string) {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    } else {
      shell.openPath(url.replace("file://", ""));
    }
  }

  async access(url: string, download: boolean) {
    return await this.fileRepository.access({
      url: url,
      download: download,
    });
  }
}
