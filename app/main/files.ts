import { BrowserWindow, app, dialog, ipcMain, screen } from "electron";
import { join, posix } from "node:path";

ipcMain.on("user-data-path", (event, arg) => {
  event.returnValue = app.getPath("userData");
});

ipcMain.handle("user-data-path", () => {
  return app.getPath("userData");
});

let previewWin: BrowserWindow | null = null;
ipcMain.on("preview", (event, fileURL) => {
  if (process.platform === "darwin") {
    BrowserWindow.getFocusedWindow()?.previewFile(
      fileURL.replace("file://", "")
    );
  } else {
    const { x, y } = screen.getCursorScreenPoint();
    const currentDisplay = screen.getDisplayNearestPoint({ x, y });
    const { width, height } = currentDisplay.workAreaSize;

    if (!previewWin) {
      previewWin = new BrowserWindow({
        title: "Preview window",
        width: Math.floor(height * 0.8 * 0.75),
        height: Math.floor(height * 0.8),
        minWidth: Math.floor(height * 0.8 * 0.75),
        minHeight: Math.floor(height * 0.8),
        webPreferences: {
          webSecurity: false,
          nodeIntegration: true,
          contextIsolation: false,
        },
        frame: false,
        show: false,
      });

      if (app.isPackaged) {
        previewWin.loadFile(join(__dirname, "app/index_preview.html"));
      } else if (process.env.NODE_ENV === "test") {
        previewWin.loadFile(join(__dirname, "app/index_preview.html"));
      } else {
        previewWin.loadURL(
          posix.join(
            process.env.VITE_DEV_SERVER_URL as string,
            "app/index_preview.html"
          )
        );
      }
    }

    const bounds = currentDisplay.bounds;

    const windowSize = previewWin?.getSize();
    const windowWidth = windowSize?.[0] || 0;
    const windowHeight = windowSize?.[1] || 0;

    const centerx = bounds.x + (bounds.width - windowWidth) / 2;
    const centery = bounds.y + (bounds.height - windowHeight) / 2;
    previewWin?.setPosition(parseInt(`${centerx}`), parseInt(`${centery}`));

    previewWin?.show();

    previewWin.on("blur", () => {
      previewWin?.close();
      previewWin = null;
    });

    previewWin.webContents.on("dom-ready", () => {
      previewWin?.webContents.send("preview-file", fileURL);
    });
  }
});

ipcMain.on("close-preview", () => {
  previewWin?.close();
  previewWin = null;
});
