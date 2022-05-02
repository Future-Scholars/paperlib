import { app, ipcMain, BrowserWindow, dialog } from "electron";

ipcMain.on("userData", (event, arg) => {
  event.returnValue = app.getPath("userData");
});

ipcMain.handle("show-folder-picker", () => {
  return dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
});

ipcMain.on("preview", (event, fileURL) => {
  BrowserWindow.getFocusedWindow()?.previewFile(fileURL.replace("file://", ""));
});
