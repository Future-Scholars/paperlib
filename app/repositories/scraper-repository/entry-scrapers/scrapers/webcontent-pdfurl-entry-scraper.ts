import { PaperEntity } from "@/models/paper-entity";

import { AbstractEntryScraper } from "./entry-scraper";
import { PDFEntryScraper } from "./pdf-entry-scraper";

export interface IWebcontentPDFURLEntryScraperPayload {
  url: string;
  document: string;
  cookies: string;
}

export class WebcontentPDFURLEntryImporter extends AbstractEntryScraper {
  static validPayload(payload: any) {
    if (
      !payload.hasOwnProperty("url") ||
      !payload.hasOwnProperty("document") ||
      !payload.hasOwnProperty("cookies")
    ) {
      return false;
    }
    const urlRegExp = new RegExp(".*.pdf$");
    return urlRegExp.test(payload.url);
  }

  static async scrape(
    payload: IWebcontentPDFURLEntryScraperPayload
  ): Promise<PaperEntity[]> {
    if (!this.validPayload(payload)) {
      return [];
    }

    const downloadURL = payload.url;

    if (downloadURL) {
      const downloadedFilePath = await window.networkTool.downloadPDFs([
        downloadURL,
      ]);
      if (downloadedFilePath.length > 0) {
        return PDFEntryScraper.scrape({ url: downloadedFilePath[0] });
      } else {
        return [];
      }
    } else {
      return [];
    }
  }
}
