import { createDecorator } from "@/base/injection/injection";
import { eraseProtocol } from "@/base/url";
import {
  BrowserWindow,
  IpcMainEvent,
  OpenDialogReturnValue,
  app,
  dialog,
  ipcMain,
} from "electron";

export const IFileSystemService = createDecorator("fileSystemService");

export class FileSystemService {
  constructor() {
    ipcMain.on(
      "getSystemPath",
      (
        event: IpcMainEvent,
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
          | "crashDumps"
      ) => {
        event.returnValue = app.getPath(key);
      }
    );
  }

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

  /**
   * Show a file picker.
   * @returns {Promise<OpenDialogReturnValue>} The result of the file picker.
   */
  showFilePicker(): Promise<OpenDialogReturnValue> {
    return dialog.showOpenDialog({
      properties: ["openFile"],
    });
  }

  /**
   * Show a folder picker.
   * @returns {Promise<OpenDialogReturnValue>} The result of the folder picker.
   */
  showFolderPicker(): Promise<OpenDialogReturnValue> {
    return dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
  }

  preview(fileURL: string) {
    if (process.platform === "darwin") {
      BrowserWindow.getFocusedWindow()?.previewFile(eraseProtocol(fileURL));
    }
  }
}
