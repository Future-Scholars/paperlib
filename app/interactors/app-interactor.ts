import { ipcRenderer } from "electron";

export class AppInteractor {
  constructor() {}

  registerMainSignal(signal: string, callback: (args: any) => void) {
    ipcRenderer.removeListener(signal, callback);
    ipcRenderer.on(signal, (_, args) => callback(args));
  }
}
