import { app, ipcMain, BrowserWindow, dialog, screen } from "electron";
import { join } from "path";

ipcMain.on("userData", (event, arg) => {
  event.returnValue = app.getPath("userData");
});

ipcMain.handle("show-file-picker", () => {
  return dialog.showOpenDialog({
    properties: ["openFile"],
  });
});

ipcMain.handle("show-folder-picker", () => {
  return dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
});

let previewWin: BrowserWindow | null = null;
ipcMain.on("preview", (event, fileURL) => {
  if (process.platform === "darwin") {
    BrowserWindow.getFocusedWindow()?.previewFile(
      fileURL.replace("file://", "")
    );
  } else {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    if (!previewWin) {
      previewWin = new BrowserWindow({
        title: "Preview window",
        width: height * 0.707,
        height: height,
        minWidth: height * 0.707,
        minHeight: height,
        useContentSize: true,
        webPreferences: {
          preload: join(__dirname, "../preload/index_preview.cjs"),
          webSecurity: false,
          nodeIntegration: true,
          contextIsolation: true,
        },
        frame: false,
      });

      if (app.isPackaged) {
        previewWin.loadFile(join(__dirname, "../renderer/index_preview.html"));
      } else {
        // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
        const url = `http://${process.env["VITE_DEV_SERVER_HOST"]}:${process.env["VITE_DEV_SERVER_PORT"]}/index_preview.html`;

        previewWin.loadURL(url);
        previewWin.webContents.openDevTools();
      }
    }
    previewWin.once("ready-to-show", () => {
      previewWin?.webContents.send("preview-file", fileURL);
    });
  }
});

ipcMain.on("close-preview", () => {
  previewWin?.close();
});
