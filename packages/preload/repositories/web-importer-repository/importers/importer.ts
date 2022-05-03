import path from "path";
import os from "os";
import stream from "stream";
import { promisify } from "util";
import got from "got";
import { createWriteStream } from "fs";

import { PaperEntityDraft } from "../../../models/PaperEntityDraft";
import { Preference } from "../../../utils/preference";
import { constructFileURL } from "../../../utils/path";

export interface WebContentType {
  url: string;
  document: string;
}

export interface WebImporterType {
  preference: Preference;

  parse(webContent: WebContentType): Promise<PaperEntityDraft | boolean>;

  preProcess(webContent: WebContentType): boolean;
  parsingProcess(
    webContent: WebContentType
  ): Promise<PaperEntityDraft | boolean>;
}

export class WebImporter implements WebImporterType {
  preference: Preference;
  urlRegExp: RegExp;

  constructor(preference: Preference, urlRegExp: RegExp) {
    this.preference = preference;
    this.urlRegExp = urlRegExp;
  }

  async parse(webContent: WebContentType): Promise<PaperEntityDraft | boolean> {
    const enable = this.preProcess(webContent);

    if (enable) {
      return await this.parsingProcess(webContent);
    } else {
      return false;
    }
  }

  preProcess(webContent: WebContentType): boolean {
    return this.urlRegExp.test(webContent.url);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async parsingProcess(
    webContent: WebContentType
  ): Promise<PaperEntityDraft | boolean> {
    throw new Error("Method not implemented.");
  }

  async downloadProcess(urlList: string[]): Promise<string[]> {
    const _download = async (url: string): Promise<string> => {
      const filename = url.split("/").pop() as string;
      const targetUrl = path.join(os.homedir(), "Downloads", filename);
      const pipeline = promisify(stream.pipeline);

      await pipeline(
        got.stream(url),
        createWriteStream(constructFileURL(targetUrl, false, false))
      );
      return targetUrl;
    };

    const downloadedUrls = (await Promise.all(urlList.map(_download))).filter(
      (url) => url !== ""
    );

    return downloadedUrls;
  }
}
