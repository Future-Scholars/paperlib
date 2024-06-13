import { createWriteStream, existsSync, mkdirSync, readFileSync } from "fs";
import ky, { Input as KyInput, Options as KyOptions, KyResponse } from "ky";
import os from "os";
import path from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { CookieJar } from "tough-cookie";
import { Agent, ProxyAgent } from "undici";

import { createDecorator } from "@/base/injection/injection";

import { compressString } from "./string";
import { constructFileURL } from "./url";

const cache = new Map();

export interface ICookieObject {
  cookieStr: string;
  currentUrl: string;
}

export const INetworkTool = createDecorator("networkTool");

export class NetworkTool {
  private _agent: {
    http?: ProxyAgent;
    https?: ProxyAgent;
  };

  private _donwloadProgress: {
    [key: string]: number;
  };

  private _caCert: string | undefined;
  private _caClientKey: string | undefined;
  private _caClinetCert: string | undefined;

  constructor() {
    if (globalThis["caCertPath"]) {
      this._caCert = readFileSync(globalThis["caCertPath"], "utf-8");
    }
    if (globalThis["caClientKeyPath"]) {
      this._caClientKey = readFileSync(globalThis["caClientKeyPath"], "utf-8");
    }
    if (globalThis["caClientCertPath"]) {
      this._caClinetCert = readFileSync(
        globalThis["caClientCertPath"],
        "utf-8"
      );
    }

    this._donwloadProgress = {};

    this._agent = {};
    this.checkProxy();
  }

  /**
   * Set proxy agent
   * @param httpproxy - HTTP proxy
   * @param httpsproxy - HTTPS proxy
   */
  setProxyAgent(httpproxy: string = "", httpsproxy: string = "") {
    if (httpproxy) {
      this._agent["http"] = new ProxyAgent(httpproxy);
    }

    if (httpsproxy) {
      this._agent["https"] = new ProxyAgent(httpsproxy);
    }
  }

  /**
   * Check proxy settings, if exists, set it as proxy agent, otherwise, check system proxy settings.
   */
  async checkProxy() {
    if (this._caCert || this._caClientKey || this._caClinetCert) {
      PLAPI.logService.info(
        "CA certificates",
        `CA: ${this._caCert} | Client key: ${this._caClientKey} | Client cert: ${this._caClinetCert}`,
        false,
        "Network"
      );

      this._agent["https"] = new Agent({
        connect: {
          ca: this._caCert,
          key: this._caClientKey,
          cert: this._caClinetCert,
        },
      });
    } else {
      if (!(await PLAPI.preferenceService.get("allowproxy"))) {
        return;
      }

      let httpProxy = "";
      let httpsProxy = "";

      httpProxy = (await PLAPI.preferenceService.get("httpproxy")) as string;
      httpsProxy = (await PLAPI.preferenceService.get("httpsproxy")) as string;

      const proxy = await PLMainAPI.proxyService.getSystemProxy();

      if (httpProxy === "" && httpsProxy === "" && proxy !== "DIRECT") {
        const proxyUrlComponents = proxy.split(":");
        let proxyHost = proxyUrlComponents[0].split(" ")[1].trim();
        const proxyPort = parseInt(proxyUrlComponents[1].trim(), 10);
        if (
          !proxyHost.startsWith("http://") &&
          !proxyHost.startsWith("https://")
        ) {
          proxyHost = "http://" + proxyHost;
        }
        httpProxy = httpProxy || proxyHost + ":" + proxyPort;
        httpsProxy = httpsProxy || proxyHost + ":" + proxyPort;
      }

      this.setProxyAgent(httpProxy, httpsProxy);

      PLAPI.logService.info(
        "Proxy settings",
        `HTTP: ${httpProxy} | HTTPS: ${httpsProxy}`,
        false,
        "Network"
      );

      const result = await this.get(
        "https://httpbin.org/ip",
        {},
        1,
        5000,
        false,
        true
      );
      PLAPI.logService.info(
        "Proxy check",
        `Connected: ${JSON.stringify(result)}`,
        false,
        "Network"
      );
    }
  }

  private async _cachePreHook(_request: Request) {
    const cacheKey = `${_request.method}-${_request.url}-${_request.headers}`;
    if (cache.has(cacheKey)) {
      const storedCache = cache.get(cacheKey);

      if (storedCache.ttl < Date.now()) {
        cache.delete(cacheKey);
        return undefined;
      } else {
        return storedCache.response;
      }
    }
  }

  private async _cacheAfterHook(
    _request: Request,
    _options: KyOptions,
    response: KyResponse
  ) {
    const cacheKey = `${_request.method}-${_request.url}-${_request.headers}`;
    const ttl = Date.now() + 1000 * 60 * 60 * 24;
    const storedCache = {
      ttl: ttl,
      response: response.clone(),
    };
    cache.set(cacheKey, storedCache);
    return response;
  }

  private async _parseResponse(response: KyResponse, parse = false) {
    const contentType = response.headers.get("content-type");
    let body: any;
    if (contentType?.includes("application/json") && parse) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    return {
      body: body,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };
  }

  private async _fetch(input: KyInput, init?: RequestInit) {
    if (this._agent.http || this._agent.https) {
      if (!init) {
        init = {};
      }
      let protocol = "http";
      if (input instanceof Request) {
        if (input.url.startsWith("https")) {
          protocol = "https";
        }
      } else if (typeof input === "string") {
        if (input.startsWith("https")) {
          protocol = "https";
        }
      }

      if (protocol === "https") {
        init["dispatcher"] = this._agent["https"];
      } else {
        init["dispatcher"] = this._agent["http"];
      }
    }
    return fetch(input, init);
  }

  /**
   * HTTP GET
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
    const options: KyOptions = {
      headers: headers,
      retry: retry,
      timeout: timeout,
      hooks: {
        beforeRequest: cache ? [this._cachePreHook] : [],
        afterResponse: cache ? [this._cacheAfterHook] : [],
      },
      fetch: this._fetch.bind(this),
    };

    const response = await ky.get(url, options);
    return await this._parseResponse(response, parse);
  }

  /**
   * HTTP POST
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
    let options: KyOptions;
    if (compress) {
      const dataString = typeof data === "string" ? data : JSON.stringify(data);
      const buffer = await compressString(dataString);

      options = {
        body: buffer,
        headers: headers,
        retry: retry,
        timeout: timeout,
      };
    } else if (typeof data === "string") {
      options = {
        body: data,
        headers: headers,
        retry: retry,
        timeout: timeout,
      };
    } else if (typeof data === "object") {
      options = {
        json: data,
        headers: headers,
        retry: retry,
        timeout: timeout,
      };
    } else {
      options = {
        body: data,
        headers: headers,
        retry: retry,
        timeout: timeout,
      };
    }

    options["fetch"] = this._fetch.bind(this);
    const response = await ky.post(url, options);
    return await this._parseResponse(response, parse);
  }

  /**
   * HTTP POST with form data
   * @param url - URL
   * @param data - Data
   * @param headers - Headers
   * @param retry - Retry times
   * @param timeout - Timeout
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
    if (!(data instanceof FormData)) {
      if (typeof data === "object") {
        const formData = new FormData();
        for (const key in data as Record<string, any>) {
          formData.append(key, data[key]);
        }
        data = formData;
      }
    }
    const options = {
      body: data,
      headers: headers,
      retry: retry,
      timeout: timeout,
      fetch: this._fetch.bind(this),
    };

    const response = await ky.post(url, options);
    return await this._parseResponse(response, parse);
  }

  /**
   * Download
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
    const headers = {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
    };

    let cookieJarObj: CookieJar | undefined;
    if (Array.isArray(cookies)) {
      cookieJarObj = new CookieJar();
      cookies.forEach((cookie) => {
        cookieJarObj!.setCookieSync(cookie.cookieStr, cookie.currentUrl);
      });
    } else {
      cookieJarObj = cookies;
    }

    if (cookieJarObj) {
      headers["cookie"] = await cookieJarObj.getCookieString(url);
    }

    try {
      const response = await ky.get(url, {
        headers: headers,
        onDownloadProgress: (progress) => {
          if (
            this._donwloadProgress[url] &&
            progress.percent &&
            (progress.percent - this._donwloadProgress[url] > 0.05 ||
              progress.percent === 1)
          ) {
            PLAPI.logService.progress(
              "Downloading...",
              progress.percent * 100,
              true,
              "Network",
              url
            );

            this._donwloadProgress[url] = progress.percent;
          } else if (!this._donwloadProgress[url] && progress.percent) {
            this._donwloadProgress[url] = progress.percent;
          }

          if (progress.percent === 1) {
            delete this._donwloadProgress[url];
          }
        },
        fetch: this._fetch.bind(this),
      });

      const fileStream = createWriteStream(
        constructFileURL(targetPath, false, false)
      );
      if (response.status !== 200 || !response.body) {
        PLAPI.logService.error(
          "Failed to download file.",
          `Status: ${response.status} | URL: ${url} | Target path: ${targetPath} | Body: ${response.body}`,
          true,
          "Network"
        );

        return "";
      } else {
        await finished(Readable.fromWeb(response.body as any).pipe(fileStream));
        return targetPath;
      }
    } catch (e) {
      if ((e as Error).message.includes("403")) {
        // Try native download
        console.log("Try native download")
        const nativeDownloadedPath = await PLMainAPI.windowProcessManagementService.download("rendererProcess", url, { targetPath: targetPath }, headers)
        if (nativeDownloadedPath) {
          return nativeDownloadedPath;
        }
      }
      PLAPI.logService.error(
        "Failed to download file.",
        `Status: ${(e as Error).message} | URL: ${url} | Target path: ${targetPath}`,
        true,
        "Network"
      );

      return "";
    }
  }

  /**
   * Download PDFs
   * @param urlList - URL list
   * @param cookies - Cookies
   * @returns Target paths
   */
  async downloadPDFs(
    urlList: string[],
    cookies?: CookieJar | ICookieObject[]
  ): Promise<string[]> {
    const downloadedUrls = (
      await Promise.all(
        urlList.map((url) => {
          let filename = url.split("/").pop() as string;
          filename = filename.slice(0, 100);
          if (!filename.endsWith(".pdf")) {
            filename += ".pdf";
          }

          const targetFolder = path.join(os.homedir(), "Downloads");
          if (!existsSync(targetFolder)) {
            mkdirSync(targetFolder);
          }

          const targetPath = path.join(os.homedir(), "Downloads", filename);
          return this.download(url, targetPath, cookies);
        })
      )
    ).filter((url) => url !== "");

    return downloadedUrls;
  }

  /**
   * Check if the network is connected
   * @returns Whether the network is connected
   */
  async connected() {
    try {
      const response = await ky.get("https://httpbin.org/ip", {
        timeout: 5000,
        fetch: this._fetch.bind(this),
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }
}
