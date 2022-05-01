import { ipcMain, BrowserWindow, dialog } from "electron";

ipcMain.handle("show-folder-picker", () => {
  return dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
});

ipcMain.on("preview", (event, fileURL) => {
  BrowserWindow.getFocusedWindow()?.previewFile(fileURL.replace("file://", ""));
});
