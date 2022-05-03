import { ipcMain, nativeTheme } from "electron";

ipcMain.on("themeChanged", (event, arg) => {
  nativeTheme.themeSource = arg;
});

ipcMain.handle("getTheme", () => {
  return nativeTheme.shouldUseDarkColors;
});
