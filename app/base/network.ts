import { ipcRenderer } from "electron";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import got from "got";
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

const gotWithCache = got.extend({
  handlers: [
    (options, next) => {
      if (options.isStream) {
        return next(options);
      }

      const pending = cache.get(options.url.href);
      if (pending) {
        if (pending.ttl < Date.now()) {
          cache.delete(options.url.href);
        } else {
          return pending.response;
        }
      }

      const promise = next(options);
      cache.set(options.url.href, {
        response: promise,
        ttl: Date.now() + 1000 * 60 * 60 * 24,
      });
      return promise;
    },
  ],
});

export const INetworkTool = createDecorator("networkTool");

export class NetworkTool {
  private _agent: {
    http?: HttpProxyAgent;
    https?: HttpsProxyAgent;
  };

  constructor(
    @IPreferenceService private readonly _preferenceService: PreferenceService,
    @ILogService private readonly _logService: LogService
  ) {
    this._agent = {};

    if (this._preferenceService.get("allowproxy")) {
      try {
        this.checkSystemProxy();
      } catch (e) {
        console.error(e);
      }
    }
  }

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

  async get(
    url: string,
    headers?: Record<string, string>,
    retry = 1,
    timeout = 5000,
    cache = false
  ) {
    const options = {
      headers: headers,
      retry: retry,
      timeout: {
        request: timeout,
      },
      agent: this._agent,
    };

    if (cache) {
      return gotWithCache(url, options);
    } else {
      return await got(url, options);
    }
  }

  async post(
    url: string,
    data: Record<string, any> | string,
    headers?: Record<string, string>,
    retry = 1,
    timeout = 5000,
    compress = false
  ) {
    let options;
    if (compress) {
      const dataString = typeof data === "string" ? data : JSON.stringify(data);
      const buffer = compressString(dataString);

      options = {
        body: buffer,
        headers: headers,
        retry: retry,
        timeout: {
          request: timeout,
        },
        agent: this._agent,
      };
      console.log(options);
    } else if (typeof data === "string") {
      options = {
        stringifyJson: data,
        headers: headers,
        retry: retry,
        timeout: {
          request: timeout,
        },
        agent: this._agent,
      };
    } else {
      options = {
        json: data,
        headers: headers,
        retry: retry,
        timeout: {
          request: timeout,
        },
        agent: this._agent,
      };
    }
    return await got.post(url, options);
  }

  async postForm(
    url: string,
    data: FormData,
    headers?: Record<string, string>,
    retry = 1,
    timeout = 5000
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
      retry: retry,
      timeout: {
        request: timeout,
      },
      agent: this._agent,
    };
    return await got.post(url, options);
  }

  async download(url: string, targetPath: string, cookies?: CookieJar) {
    try {
      const pipeline = promisify(stream.pipeline);
      const headers = {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
      };

      let percent = 0;
      await pipeline(
        got
          .stream(url, {
            headers: headers,
            rejectUnauthorized: false,
            agent: this._agent,
            cookieJar: cookies,
          })
          .on("downloadProgress", (progress) => {
            if (progress.percent - percent > 0.05) {
              this._logService.progress(
                "Downloading...",
                percent * 100,
                true,
                "Network"
              );
              percent = progress.percent;
            }
          }),
        createWriteStream(constructFileURL(targetPath, false, false))
      );
      return targetPath;
    } catch (e) {
      console.log(e);
      return "";
    }
  }

  async downloadPDFs(
    urlList: string[],
    cookies?: CookieJar
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

  async connected() {
    const response = await got("https://httpbin.org/ip", { timeout: 5000 });
    return response.statusCode === 200;
  }
}
