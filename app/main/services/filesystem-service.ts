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
    } else {
      // TODO: Implement preview for Windows and Linux.
      // const { x, y } = screen.getCursorScreenPoint();
      // const currentDisplay = screen.getDisplayNearestPoint({ x, y });
      // const { width, height } = currentDisplay.workAreaSize;
      // if (!previewWin) {
      //   previewWin = new BrowserWindow({
      //     title: "Preview window",
      //     width: Math.floor(height * 0.8 * 0.75),
      //     height: Math.floor(height * 0.8),
      //     minWidth: Math.floor(height * 0.8 * 0.75),
      //     minHeight: Math.floor(height * 0.8),
      //     webPreferences: {
      //       webSecurity: false,
      //       nodeIntegration: true,
      //       contextIsolation: false,
      //     },
      //     frame: false,
      //     show: false,
      //   });
      //   if (app.isPackaged) {
      //     previewWin.loadFile(join(__dirname, "app/index_preview.html"));
      //   } else if (process.env.NODE_ENV === "test") {
      //     previewWin.loadFile(join(__dirname, "app/index_preview.html"));
      //   } else {
      //     previewWin.loadURL(
      //       posix.join(
      //         process.env.VITE_DEV_SERVER_URL as string,
      //         "app/index_preview.html"
      //       )
      //     );
      //   }
      // }
      // const bounds = currentDisplay.bounds;
      // const windowSize = previewWin?.getSize();
      // const windowWidth = windowSize?.[0] || 0;
      // const windowHeight = windowSize?.[1] || 0;
      // const centerx = bounds.x + (bounds.width - windowWidth) / 2;
      // const centery = bounds.y + (bounds.height - windowHeight) / 2;
      // previewWin?.setPosition(parseInt(`${centerx}`), parseInt(`${centery}`));
      // previewWin?.show();
      // previewWin.on("blur", () => {
      //   previewWin?.close();
      //   previewWin = null;
      // });
      // previewWin.webContents.on("dom-ready", () => {
      //   previewWin?.webContents.send("preview-file", fileURL);
      // });
    }
  }
}
