import { ipcRenderer } from "electron";
import { createWriteStream } from "fs";
import got, { HTTPError } from "got";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";
import os from "os";
import path from "path";
import stream from "stream";
import { promisify } from "util";

import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import { constructFileURL } from "./path";

export class NetworkTool {
  stateStore: MainRendererStateStore;
  preference: Preference;

  agent: {
    http?: HttpProxyAgent;
    https?: HttpsProxyAgent;
  };

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;

    this.agent = {};

    if (this.preference.get("allowproxy")) {
      try {
        this.checkSystemProxy();
      } catch (e) {
        console.error(e);
      }
    }
  }

  setProxyAgent(proxy: string = "") {
    const httpproxyUrl = (this.preference.get("httpproxy") as string) || proxy;
    const httpsproxyUrl =
      (this.preference.get("httpsproxy") as string) || proxy;

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

    this.agent = agnets;
  }

  checkSystemProxy() {
    const proxy = ipcRenderer.sendSync("get-system-proxy");

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
    safe = false,
    timeout = 5000
  ) {
    const options = {
      headers: headers,
      retry: retry,
      timeout: {
        request: timeout,
      },
      agent: this.agent,
    };

    if (safe) {
      let response;
      try {
        response = await got(url, options);
      } catch (error) {
        if (error instanceof HTTPError) {
          if (
            error.response.statusCode === 429 ||
            error.response.statusCode === 403
          ) {
            const robot_checked_body = await ipcRenderer.invoke(
              "sidework-window-robot-check",
              url
            );
            response = {
              body: robot_checked_body,
              statusCode: error.response.statusCode,
            };
          }
        }
      }
      if (
        response?.body.includes("Please show you're not a robot") ||
        response?.body.includes("Please show you&#39;re not a robot") ||
        response?.body.includes("does not have permission")
      ) {
        const robot_checked_body = await ipcRenderer.invoke(
          "sidework-window-robot-check",
          url
        );
        response.body = robot_checked_body;
      }

      return response;
    } else {
      return await got(url, options);
    }
  }

  async downloadPDFs(urlList: string[]): Promise<string[]> {
    this.stateStore.logState.processLog = "";
    const _download = async (url: string): Promise<string> => {
      try {
        let filename = url.split("/").pop() as string;
        filename = filename.slice(0, 100);
        if (!filename.endsWith(".pdf")) {
          filename += ".pdf";
        }
        const targetUrl = path.join(os.homedir(), "Downloads", filename);
        const pipeline = promisify(stream.pipeline);
        const headers = {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
        };
        await pipeline(
          got
            .stream(url, {
              headers: headers,
              rejectUnauthorized: false,
              agent: this.agent,
            })
            .on("downloadProgress", (progress) => {
              const percent = progress.percent;
              this.stateStore.logState.progressLog = {
                id: filename,
                value: percent * 100,
                msg: `Downloading...`,
              };
            }),
          createWriteStream(constructFileURL(targetUrl, false, false))
        );
        return targetUrl;
      } catch (e) {
        console.log(e);
        return "";
      }
    };
    const downloadedUrls = (await Promise.all(urlList.map(_download))).filter(
      (url) => url !== ""
    );

    return downloadedUrls;
  }

  async connected() {
    const response = await got("https://httpbin.org/ip", { timeout: 5000 });
    return response.statusCode === 200;
  }
}
