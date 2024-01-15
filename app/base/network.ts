import { createWriteStream, existsSync, mkdirSync } from "fs";
import ky, { Options as KyOptions, KyResponse } from "ky";
import os from "os";
import path from "path";
import { Readable } from "stream";
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
  private _donwloadProgress: {
    [key: string]: number;
  };

  constructor() {
    this._donwloadProgress = {};
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
    } else if (data instanceof Object) {
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

    const response = await ky.get(url, {
      headers: headers,
      onDownloadProgress: (progress) => {
        console.log(progress);
        if (
          this._donwloadProgress[url] &&
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
        } else if (!this._donwloadProgress[url]) {
          this._donwloadProgress[url] = progress.percent;
        }

        if (progress.percent === 1) {
          delete this._donwloadProgress[url];
        }
      },
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
    }

    await finished(Readable.fromWeb(response.body as any).pipe(fileStream));

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
      const response = await ky.get("https://httpbin.org/ip", {
        timeout: 5000,
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }
}
