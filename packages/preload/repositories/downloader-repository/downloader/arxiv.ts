import { Downloader, DownloaderRequestType } from "./downloader";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";

export class ArXivDownloader extends Downloader {
  preProcess(entityDraft: PaperEntityDraft): DownloaderRequestType {
    const enable = entityDraft.arxiv !== "" && this.getEnable("arxiv");

    let queryUrl;
    queryUrl = `https://arxiv.org/pdf/${entityDraft.arxiv}.pdf`;

    const headers = {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
    };

    if (enable) {
      this.sharedState.set(
        "viewState.processInformation",
        `Downloading PDF from ArXiv ...`
      );
    }

    return { queryUrl, headers, enable };
  }

  async queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    entityDraft: PaperEntityDraft | null
  ): Promise<string> {
    return queryUrl;
  }
}
