import { PaperEntity } from "@/models/paper-entity";

import { AbstractEntryScraper } from "./entry-scraper";
import { PDFEntryScraper } from "./pdf-entry-scraper";

export interface IWebcontentPDFURLEntryScraperPayload {
  type: "webcontent";
  value: {
    url: string;
    document: string;
    cookies: string;
  };
}

export class WebcontentPDFURLEntryImporter extends AbstractEntryScraper {
  static validPayload(payload: any) {
    if (
      !payload.hasOwnProperty("type") ||
      !payload.hasOwnProperty("value") ||
      payload.type !== "webcontent" ||
      !payload.value.hasOwnProperty("url") ||
      !payload.value.hasOwnProperty("document") ||
      !payload.value.hasOwnProperty("cookies")
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

    const downloadURL = payload.value.url;

    if (downloadURL) {
      const downloadedFilePath = await networkTool.downloadPDFs([downloadURL]);
      if (downloadedFilePath.length > 0) {
        return PDFEntryScraper.scrape({
          type: "file",
          value: downloadedFilePath[0],
        });
      } else {
        return [];
      }
    } else {
      return [];
    }
  }
}
