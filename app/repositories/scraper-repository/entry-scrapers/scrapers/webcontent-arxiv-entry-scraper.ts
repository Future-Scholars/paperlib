import { PaperEntity } from "@/models/paper-entity";

import { AbstractEntryScraper } from "./entry-scraper";
import { PDFEntryScraper } from "./pdf-entry-scraper";

export interface IWebcontentArXivEntryScraperPayload {
  url: string;
  document: string;
  cookies: string;
}

export class WebcontentArXivEntryImporter extends AbstractEntryScraper {
  static validPayload(payload: any) {
    if (
      !payload.hasOwnProperty("url") ||
      !payload.hasOwnProperty("document") ||
      !payload.hasOwnProperty("cookies")
    ) {
      return false;
    }
    const urlRegExp = new RegExp(
      "^https?://([^\\.]+\\.)?(arxiv\\.org|xxx\\.lanl\\.gov)/(/\\w|abs/|pdf/)"
    );
    return urlRegExp.test(payload.url);
  }

  static async scrape(
    payload: IWebcontentArXivEntryScraperPayload
  ): Promise<PaperEntity[]> {
    if (!this.validPayload(payload)) {
      return [];
    }

    const arXivID = payload.url.split("/")[4].replace(".pdf", "");

    if (arXivID) {
      const downloadURL = `https://arxiv.org/pdf/${arXivID}.pdf`;

      const downloadedFilePath = await window.networkTool.downloadPDFs([
        downloadURL,
      ]);

      return PDFEntryScraper.scrape({
        url: downloadedFilePath[0],
      });
    } else {
      return [];
    }
  }
}
