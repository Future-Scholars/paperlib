import { createDecorator } from "@/base/injection/injection";
import { session } from "electron";

export const IProxyService = createDecorator("proxyService");

export class ProxyService {
  constructor() {}

  async getSystemProxySync() {
    const proxyUrl = await session.defaultSession.resolveProxy(
      "https://www.google.com"
    );
    return proxyUrl;
  }
}
