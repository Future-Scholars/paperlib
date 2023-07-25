import { createDecorator } from "@/base/injection/injection";
import { ipcMain, session } from "electron";

export const IProxyService = createDecorator("proxyService");

export class ProxyService {
  constructor() {
    ipcMain.on(
      "checkSystemProxy",
      async (event: Electron.IpcMainEvent, arg: any) => {
        const proxyUrl = await this.getSystemProxy();
        event.returnValue = proxyUrl;
      }
    );
  }

  async getSystemProxy() {
    const proxyUrl = await session.defaultSession.resolveProxy(
      "https://www.google.com"
    );
    return proxyUrl;
  }
}
