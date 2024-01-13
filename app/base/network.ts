import { ipcRenderer } from "electron";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import got, { OptionsOfTextResponseBody, Response } from "got";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";
import os from "os";
import path from "path";
import stream from "stream";
import { CookieJar } from "tough-cookie";
import { promisify } from "util";

import { createDecorator } from "@/base/injection/injection";
import { constructFileURL } from "@/base/url";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import { ILogService, LogService } from "@/renderer/services/log-service";
import { compressString } from "./string";

const cache = new Map();

const cachedGot = got.extend({
  handlers: [
    (options, next) => {
      if (options.isStream) {
        return next(options);
      }

      const cacheKey = `${options.method}-${options.url}-${options.headers}`;

      const pending = cache.get(cacheKey);
      if (pending) {
        if (pending.ttl < Date.now()) {
          cache.delete(cacheKey);
        } else {
          return pending.response;
        }
      }

      const promise = next(options);
      cache.set(cacheKey, {
        response: promise,
        ttl: Date.now() + 1000 * 60 * 60 * 24,
      });
      return promise;
    },
  ],
});

export interface ICookieObject {
  cookieStr: string;
  currentUrl: string;
}

export const INetworkTool = createDecorator("networkTool");

export class NetworkTool {
  private _agent: {
    http?: HttpProxyAgent;
    https?: HttpsProxyAgent;
  };

  private _donwloadProgress: {
    [key: string]: number;
  };

  constructor(
    @IPreferenceService private readonly _preferenceService: PreferenceService,
    @ILogService private readonly _logService: LogService
  ) {
    this._agent = {};
    this._donwloadProgress = {};

    if (this._preferenceService.get("allowproxy")) {
      try {
        this.checkSystemProxy();
      } catch (e) {
        console.error(e);
      }
    }
  }

  private async _parseResponse(response: Response, parse = true) {
    const contentType = response.headers["content-type"];
    let body: any;
    if (
      contentType?.includes("application/json") &&
      parse &&
      (response.body instanceof String || typeof response.body === "string")
    ) {
      body = JSON.parse(response.body as string);
    } else {
      body = response.body;
    }

    return {
      body: body,
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      headers: response.headers,
    };
  }

  /**
   * Set proxy agent
   * @param proxy - Proxy url
   */
  setProxyAgent(proxy: string = "") {
    const httpproxyUrl =
      (this._preferenceService.get("httpproxy") as string) || proxy;
    const httpsproxyUrl =
      (this._preferenceService.get("httpsproxy") as string) || proxy;

    let agnets = {};
    if (httpproxyUrl || httpsproxyUrl) {
      let validHttpproxyUrl, validHttpsproxyUrl;
      if (httpproxyUrl) {
        validHttpproxyUrl = httpproxyUrl;
      } else {
        validHttpproxyUrl = httpsproxyUrl;
      }
      if (httpsproxyUrl) {
        validHttpsproxyUrl = httpsproxyUrl;
      } else {
        validHttpsproxyUrl = httpproxyUrl;
      }
      // @ts-ignore
      agnets["http"] = new HttpProxyAgent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 256,
        maxFreeSockets: 256,
        scheduling: "lifo",
        proxy: validHttpproxyUrl,
      });

      // @ts-ignore
      agnets["https"] = new HttpsProxyAgent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 256,
        maxFreeSockets: 256,
        scheduling: "lifo",
        proxy: validHttpsproxyUrl,
      });
    }

    this._agent = agnets;
  }

  /**
   * Check system proxy, if exists, set it as proxy agent
   */
  checkSystemProxy() {
    const proxy = ipcRenderer.sendSync("checkSystemProxy");

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

      this.setProxyAgent(proxyHost + ":" + proxyPort);
    }
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
      retry: {
        limit: retry,
      },
      timeout: {
        request: timeout,
      },
      agent: this._agent,
    };

    if (cache) {
      return this._parseResponse(await cachedGot.get(url, options), parse);
    } else {
      return this._parseResponse(await got.get(url, options), parse);
    }
  }

  /**
   * HTTP POST
   * @param url - URL
   * @param data - Data
   * @param headers - Headers
   * @param retry - Retry times
   * @param timeout - Timeout
   * @param compress - Compress data
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
    let options: OptionsOfTextResponseBody = {
      headers: headers,
      retry: {
        limit: retry,
      },
      timeout: {
        request: timeout,
      },
      agent: this._agent,
    };
    if (compress) {
      const dataString = typeof data === "string" ? data : JSON.stringify(data);
      const buffer = compressString(dataString);
      options.body = Buffer.from(await buffer);
    } else if (typeof data === "object") {
      options.json = data;
    } else {
      options.body = data;
    }
    return this._parseResponse(await got.post(url, options), parse);
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
      form: data,
      headers: headers,
      retry: {
        limit: retry,
      },
      timeout: {
        request: timeout,
      },
      agent: this._agent,
    };
    return this._parseResponse(await got.post(url, options), parse);
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
    try {
      const pipeline = promisify(stream.pipeline);
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

      await pipeline(
        got
          .stream(url, {
            headers: headers,
            agent: this._agent,
            cookieJar: cookieJarObj,
          })
          .on("downloadProgress", (progress) => {
            if (
              this._donwloadProgress[url] &&
              (progress.percent - this._donwloadProgress[url] > 0.05 ||
                progress.percent === 1)
            ) {
              this._logService.progress(
                "Downloading...",
                progress.percent * 100,
                true,
                "Network",
                url
              );

              this._donwloadProgress[url] = progress.percent;
            } else if (!this._donwloadProgress[url]) {
              this._donwloadProgress[url] = progress.percent;
            }

            if (progress.percent === 1) {
              delete this._donwloadProgress[url];
            }
          }),
        createWriteStream(constructFileURL(targetPath, false, false))
      );
      return targetPath;
    } catch (e) {
      this._logService.error(
        "Failed to download file.",
        e as Error,
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
    const response = await got.get("https://httpbin.org/ip", {
      timeout: { request: 5000 },
    });

    return response.statusCode === 200;
  }
}
