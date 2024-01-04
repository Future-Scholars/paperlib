import { errorcatching } from "@/base/error";
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
  @errorcatching("Failed to get system path.", true, "FileSystemService")
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
  @errorcatching("Failed to show file picker.", true, "FileSystemService")
  showFilePicker(): Promise<OpenDialogReturnValue> {
    return dialog.showOpenDialog({
      properties: ["openFile"],
    });
  }

  /**
   * Show a folder picker.
   * @returns {Promise<OpenDialogReturnValue>} The result of the folder picker.
   */
  @errorcatching("Failed to show folder picker.", true, "FileSystemService")
  showFolderPicker(): Promise<OpenDialogReturnValue> {
    return dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
  }

  /**
   * Preview a file.
   * @param {string} fileURL The URL of the file to preview.
   */
  @errorcatching("Failed to preview file.", true, "FileSystemService")
  preview(fileURL: string) {
    if (process.platform === "darwin") {
      BrowserWindow.getFocusedWindow()?.previewFile(eraseProtocol(fileURL));
    }
  }

  /**
   * Write some text to a file.
   * @param {string} filePath The path of the file to write to.
   * @param {string} text The text to write to the file.
   * @returns {void} Nothing.
   */
  @errorcatching("Failed to write to file.", true, "FileSystemService")
  writeToFile(filePath: string, text: string): void {
    require("fs").writeFileSync(filePath, text);
  }

}
