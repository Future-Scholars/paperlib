import { PaperEntity } from "@/models/paper-entity";

import { Downloader, DownloaderRequestType } from "./downloader";

export class ArXivDownloader extends Downloader {
  preProcess(paperEntityDraft: PaperEntity): DownloaderRequestType {
    const enable = paperEntityDraft.arxiv !== "" && this.getEnable("arxiv");

    let queryUrl;
    queryUrl = `https://arxiv.org/pdf/${paperEntityDraft.arxiv}.pdf`;

    const headers = {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
    };

    if (enable) {
      window.logger.info(
        "Downloading PDF from ArXiv ...",
        "",
        true,
        "Downloader"
      );
    }

    return { queryUrl, headers, enable };
  }

  async queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    paperEntityDraft: PaperEntity | null
  ): Promise<string> {
    return queryUrl;
  }
}
