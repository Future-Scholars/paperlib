import { ipcRenderer } from "electron";
import { createWriteStream } from "fs";
import got, { HTTPError } from "got";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";
import os from "os";
import path from "path";
import stream from "stream";
import { promisify } from "util";

import { constructFileURL } from "./path";

// TODO: check all got request

export async function safeGot(
  url: string,
  headers: Record<string, string>,
  agent: any
) {
  const options = {
    headers: headers,
    retry: 0,
    timeout: {
      request: 5000,
    },
    agent: agent,
  };

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
    response = {
      body: robot_checked_body,
    };
  }
  return response;
}

export async function downloadPDFs(
  urlList: string[],
  agent: Record<string, HttpProxyAgent | HttpsProxyAgent | void> = {}
): Promise<string[]> {
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
        got.stream(url, {
          headers: headers,
          rejectUnauthorized: false,
          agent: agent,
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
