import { OpenDialogReturnValue, app, dialog } from "electron";

export class FileSystemService {
  constructor() {}

  /**
   * Get the path of the given key.
   * @param {string} key The key to get the path of.
   * @returns {string} The path of the given key.
   */
  getSystemPath(
    key:
      | "home"
      | "appData"
      | "userData"
      | "sessionData"
      | "temp"
      | "exe"
      | "module"
      | "desktop"
      | "documents"
      | "downloads"
      | "music"
      | "pictures"
      | "videos"
      | "recent"
      | "logs"
      | "crashDumps",
    windowId: string
  ): string {
    return app.getPath(key);
  }

  getSystemPathSync(
    key:
      | "home"
      | "appData"
      | "userData"
      | "sessionData"
      | "temp"
      | "exe"
      | "module"
      | "desktop"
      | "documents"
      | "downloads"
      | "music"
      | "pictures"
      | "videos"
      | "recent"
      | "logs"
      | "crashDumps",
    windowId: string
  ): string {
    return app.getPath(key);
  }

  /**
   * Show a file picker.
   * @returns {Promise<OpenDialogReturnValue>} The result of the file picker.
   */
  showFilePicker(windowId: string): Promise<OpenDialogReturnValue> {
    return dialog.showOpenDialog({
      properties: ["openFile"],
    });
  }

  /**
   * Show a folder picker.
   * @returns {Promise<OpenDialogReturnValue>} The result of the folder picker.
   */
  showFolderPicker(windowId: string): Promise<OpenDialogReturnValue> {
    return dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
  }
}
