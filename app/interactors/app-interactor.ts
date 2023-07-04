import { ipcRenderer } from "electron";

export class AppInteractor {
  constructor() {}

  // =============================
  // Register Events
  // =============================
  showContextMenu(key: string, args: any) {
    ipcRenderer.send(key, args);
  }

  registerMainSignal(signal: string, callback: (args: any) => void) {
    ipcRenderer.removeListener(signal, callback);
    ipcRenderer.on(signal, (_, args) => callback(args));
  }
}
