import { session } from "electron";

import { createDecorator } from "@/base/injection/injection";

export const IProxyService = createDecorator("proxyService");

export class ProxyService {
  constructor() {}

  async getSystemProxy() {
    const proxyUrl = await session.defaultSession.resolveProxy(
      "https://www.google.com"
    );
    return proxyUrl;
  }
}
