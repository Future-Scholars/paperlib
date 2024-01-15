import { createDecorator } from "@/base/injection/injection";
import { CookieJar } from "tough-cookie";
import { Process } from "./process-id";
export interface ICookieObject {
  cookieStr: string;
  currentUrl: string;
}

export const INetworkTool = createDecorator("networkTool");

/**
 * Network tool
 * @deprecated Use `PLExtAPI.networkTool` instead.
 */
export class NetworkTool {
  constructor() {}

  private async _checkExtAPIExposed() {
    const apiExposed = await rendererRPCService.waitForAPI(
      Process.extension,
      "PLExtAPI",
      10000
    );
    if (!apiExposed) {
      throw new Error("PLExtAPI is not exposed");
    }
    return apiExposed;
  }

  /**
   * HTTP GET
   * @deprecated Use `PLExtAPI.networkTool.get()` instead.
   * @param url - URL
   * @param headers - Headers
   * @param retry - Retry times
   * @param timeout - Timeout
   * @param cache - Use cache
   * @param parse - Try to parse response body
   * @returns Response
   */
  async get(
    url: string,
    headers?: Record<string, string>,
    retry = 1,
    timeout = 5000,
    cache = false,
    parse = false
  ) {
    await this._checkExtAPIExposed();
    return await PLExtAPI.networkTool.get(
      url,
      headers,
      retry,
      timeout,
      cache,
      parse
    );
  }

  /**
   * HTTP POST
   * @deprecated Use `PLExtAPI.networkTool.post()` instead.
   * @param url - URL
   * @param data - Data
   * @param headers - Headers
   * @param retry - Retry times
   * @param timeout - Timeout
   * @param compress - Compress data
   * @param parse - Try to parse response body
   * @returns Response
   */
  async post(
    url: string,
    data: Record<string, any> | string,
    headers?: Record<string, string>,
    retry = 1,
    timeout = 5000,
    compress = false,
    parse = false
  ) {
    await this._checkExtAPIExposed();
    return await PLExtAPI.networkTool.post(
      url,
      data,
      headers,
      retry,
      timeout,
      compress,
      parse
    );
  }

  /**
   * HTTP POST with form data
   * @deprecated Use `PLExtAPI.networkTool.postForm()` instead.
   * @param url - URL
   * @param data - Data
   * @param headers - Headers
   * @param retry - Retry times
   * @param timeout - Timeout
   * @param parse - Try to parse response body
   * @returns Response
   */
  async postForm(
    url: string,
    data: FormData,
    headers?: Record<string, string>,
    retry = 1,
    timeout = 5000,
    parse = false
  ) {
    await this._checkExtAPIExposed();
    return await PLExtAPI.networkTool.postForm(
      url,
      data,
      headers,
      retry,
      timeout,
      parse
    );
  }

  /**
   * Download
   * @deprecated Use `PLExtAPI.networkTool.download()` instead.
   * @param url - URL
   * @param targetPath - Target path
   * @param cookies - Cookies
   * @returns Target path
   */
  async download(
    url: string,
    targetPath: string,
    cookies?: CookieJar | ICookieObject[]
  ) {
    await this._checkExtAPIExposed();
    return await PLExtAPI.networkTool.download(url, targetPath, cookies);
  }

  /**
   * Download PDFs
   * @deprecated Use `PLExtAPI.networkTool.downloadPDFs()` instead.
   * @param urlList - URL list
   * @param cookies - Cookies
   * @returns Target paths
   */
  async downloadPDFs(
    urlList: string[],
    cookies?: CookieJar | ICookieObject[]
  ): Promise<string[]> {
    await this._checkExtAPIExposed();

    console.log("downloadPDFs", urlList, cookies);

    return await PLExtAPI.networkTool.downloadPDFs(urlList, cookies);
  }

  /**
   * Check if the network is connected
   * @deprecated Use `PLExtAPI.networkTool.connected()` instead.
   * @returns Whether the network is connected
   */
  async connected() {
    await this._checkExtAPIExposed();
    return await PLExtAPI.networkTool.connected();
  }
}
