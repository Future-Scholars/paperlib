import { ipcMain, BrowserWindow } from "electron";

export function registerPluginWindowEvents(winPlugin: BrowserWindow | null) {
  ipcMain.on("plugin-window-resize", (event, height) => {
    winPlugin?.setSize(600, height);
  });

  ipcMain.on("plugin-window-hide", (event) => {
    winPlugin?.blur();
  });
}
