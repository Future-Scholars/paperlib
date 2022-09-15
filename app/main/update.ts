import { BrowserWindow, dialog } from "electron";
import { autoUpdater } from "electron-updater";

autoUpdater.checkForUpdates();

autoUpdater.on("checking-for-update", () => {
  BrowserWindow.getFocusedWindow()?.webContents.send(
    "log",
    "Checking for update..."
  );
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
autoUpdater.on("update-available", async () => {
  BrowserWindow.getFocusedWindow()?.webContents.send(
    "log",
    "Avaliable update..."
  );
  const dialogOpts = {
    type: "info",
    buttons: ["Close"],
    title: "A new version of PaperLib is available",
    message: "A new version of PaperLib is available",
    detail: "It is downloading and will notify you when it is ready.",
  };
  await dialog.showMessageBox(dialogOpts);
});

autoUpdater.on("update-not-available", () => {
  BrowserWindow.getFocusedWindow()?.webContents.send("log", "No update...");
});

autoUpdater.on("error", (error) => {
  BrowserWindow.getFocusedWindow()?.webContents.send("log", error);
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
autoUpdater.on("update-downloaded", async (info) => {
  BrowserWindow.getFocusedWindow()?.webContents.send("log", info);

  if (!info.releaseNotes) {
    info.releaseNotes = "";
  }

  if (!info.version) {
    info.version = "";
  }

  const dialogOpts = {
    type: "info",
    buttons: ["Update Now", "Cancel"],
    title: `A new version ${info.version} of PaperLib is automatically downloaded.`,
    message: `A new version ${info.version} of PaperLib is automatically downloaded.`,
    detail: `${info.releaseNotes}`,
  };

  const response = await dialog.showMessageBox(dialogOpts);
  if (response.response === 0) {
    autoUpdater.quitAndInstall();
  }
});

autoUpdater.on("download-progress", (progressObj) => {
  BrowserWindow.getFocusedWindow()?.webContents.send(
    "update-download-progress",
    progressObj.percent
  );
});
