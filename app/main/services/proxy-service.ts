import { createDecorator } from "@/base/injection/injection";
import { session, net } from "electron";

export const IProxyService = createDecorator("proxyService");


// TODO: Rename this to NetService
export class ProxyService {
  constructor() {}

  async getSystemProxy() {
    const proxyUrl = await session.defaultSession.resolveProxy(
      "https://www.google.com"
    );
    return proxyUrl;
  }

  isOnline() {
    return net.isOnline()
  }
}
