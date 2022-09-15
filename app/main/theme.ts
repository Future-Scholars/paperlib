import { ipcMain, nativeTheme } from "electron";

ipcMain.on("theme-change", (event, arg) => {
  nativeTheme.themeSource = arg;
});

ipcMain.handle("getTheme", () => {
  return nativeTheme.shouldUseDarkColors;
});
