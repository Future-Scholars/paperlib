import Axios, { AxiosInstance, AxiosResponse } from "axios";
import { setupCache } from "axios-cache-interceptor";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";
import os from "os";
import path from "path";
import { finished } from "stream/promises";
import { CookieJar } from "tough-cookie";

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
  private readonly _axios: AxiosInstance;
  private readonly _axiosCache: AxiosInstance;
  private _agent: {
    http?: HttpProxyAgent;
    https?: HttpsProxyAgent;
  };

  private _donwloadProgress: {
    [key: string]: number;
  };

  constructor() {
    this._donwloadProgress = {};

    this._axios = Axios.create();
    this._axiosCache = setupCache(Axios.create(), {
      ttl: 60 * 60 * 1000 * 24,
    });

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
      this._agent["http"] = new HttpProxyAgent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 256,
        maxFreeSockets: 256,
        scheduling: "lifo",
        proxy: httpproxy,
      });
    }

    if (httpsproxy) {
      this._agent["https"] = new HttpsProxyAgent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 256,
        maxFreeSockets: 256,
        scheduling: "lifo",
        proxy: httpsproxy,
      });
    }
  }

  /**
   * Check proxy settings, if exists, set it as proxy agent, otherwise, check system proxy settings.
   */
  async checkProxy() {
    if (!(await PLAPI.preferenceService.get("allowproxy"))) {
      return;
    }

    let httpProxy = "";
    let httpsProxy = "";

    httpProxy = (await PLAPI.preferenceService.get("httpproxy")) as string;
    httpsProxy = (await PLAPI.preferenceService.get("httpsproxy")) as string;

    const proxy = await PLMainAPI.proxyService.getSystemProxy();

    if (proxy !== "DIRECT") {
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
  }

  private async _parseResponse(response: AxiosResponse, parse = false) {
    const contentType = `${response.headers["Content-Type"]}`;
    let body: any;
    if (
      contentType?.includes("application/json") &&
      parse &&
      response.data &&
      typeof response.data === "string"
    ) {
      body = JSON.parse(response.data);
    } else {
      body = response.data;
    }
    return {
      body: body,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
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
    const options = {
      headers: headers,
      "axios-retry": {
        retries: retry,
      },
      signal: AbortSignal.timeout(timeout),
      httpAgent: this._agent["http"],
      httpsAgent: this._agent["https"],
    };

    const response = cache
      ? await this._axiosCache.get(url, options)
      : await this._axios.get(url, options);
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
    let options;
    let postData = data;
    if (compress) {
      const dataString = typeof data === "string" ? data : JSON.stringify(data);
      postData = await compressString(dataString);

      options = {
        headers: headers,
        retry: retry,
        "axios-retry": {
          retries: retry,
        },
        signal: AbortSignal.timeout(timeout),
        httpAgent: this._agent["http"],
        httpsAgent: this._agent["https"],
      };
    } else {
      options = {
        headers: headers,
        retry: retry,
        "axios-retry": {
          retries: retry,
        },
        signal: AbortSignal.timeout(timeout),
      };
    }

    const response = await this._axios.post(url, postData, options);
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

    return await this.post(url, data, headers, retry, timeout, false, parse);
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

    const response = await this._axios.get(url, {
      headers: headers,
      onDownloadProgress: (progress) => {
        if (
          this._donwloadProgress[url] &&
          progress.progress &&
          (progress.progress - this._donwloadProgress[url] > 0.05 ||
            progress.progress === 1)
        ) {
          PLAPI.logService.progress(
            "Downloading...",
            progress.progress * 100,
            true,
            "Network",
            url
          );

          this._donwloadProgress[url] = progress.progress;
        } else if (!this._donwloadProgress[url] && progress.progress) {
          this._donwloadProgress[url] = progress.progress;
        }

        if (progress.progress === 1) {
          delete this._donwloadProgress[url];
        }
      },
      responseType: "stream",
      httpAgent: this._agent["http"],
      httpsAgent: this._agent["https"],
    });

    const fileStream = createWriteStream(
      constructFileURL(targetPath, false, false)
    );

    if (response.status !== 200 || !response.data) {
      PLAPI.logService.error(
        "Failed to download file.",
        `Status: ${response.status} | URL: ${url} | Target path: ${targetPath} | Body: ${response.data}`,
        true,
        "Network"
      );

      return "";
    }

    await finished(response.data.pipe(fileStream));

    return targetPath;
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
      const response = await this._axios.get("https://httpbin.org/ip", {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (e) {
      return false;
    }
  }
}
