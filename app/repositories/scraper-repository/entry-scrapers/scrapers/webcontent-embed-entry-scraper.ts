import { readFileSync } from "fs";

import { PaperEntity } from "@/models/paper-entity";

import { AbstractEntryScraper } from "./entry-scraper";

export interface IWebcontentEmbedEntryScraperPayload {
  type: "webcontent";
  value: {
    url: string;
    document: string;
    cookies: string;
  };
}

export class WebcontentEmbedEntryImporter extends AbstractEntryScraper {
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
    const urlRegExp = new RegExp("^https?://");
    const urlTest = urlRegExp.test(payload.url);

    if (!urlTest) {
      return false;
    }

    var el = document.createElement("html");
    el.innerHTML = payload.document;

    // Get meta tags
    const metaTags = el.getElementsByTagName("meta");

    if (metaTags.length > 0) {
      let matched = false;
      for (const meta of metaTags) {
        if (meta.name === "citation_title") {
          matched = true;
        }
      }

      return matched;
    } else {
      return false;
    }
  }

  static async scrape(
    payload: IWebcontentEmbedEntryScraperPayload
  ): Promise<PaperEntity[]> {
    if (!this.validPayload(payload)) {
      return [];
    }

    var el = document.createElement("html");
    el.innerHTML = payload.value.document;

    // Get meta tags
    const metaTags = el.getElementsByTagName("meta");
    if (metaTags.length > 0) {
      const entityDraft = new PaperEntity(true);
      let matched = false;

      const authors: string[] = [];

      for (const meta of metaTags) {
        if (meta.name === "citation_title") {
          entityDraft.setValue("title", meta.content);
          matched = true;
        }
        if (meta.name === "citation_author") {
          authors.push(meta.content);
        }
        if (meta.name === "citation_publication_date") {
          entityDraft.setValue("pubTime", meta.content.split("/")[0]);
        }
        if (meta.name === "citation_doi") {
          entityDraft.setValue("doi", meta.content);
        }
        if (meta.name === "citation_pdf_url") {
          let downloadURL: string;
          if (payload.value.url.includes("adsabs.harvard.edu")) {
            downloadURL = `https://ui.adsabs.harvard.edu${meta.content}`;
          } else {
            if (meta.content.endsWith(".pdf")) {
              downloadURL = meta.content;
            } else {
              downloadURL = meta.content + ".pdf";
            }
          }

          const downloadedFilePath = await networkTool.downloadPDFs([
            downloadURL,
          ]);
          if (downloadedFilePath.length > 0) {
            const fileContent = readFileSync(downloadedFilePath[0]);
            if (
              fileContent.subarray(0, 5).toString() === "%PDF-" &&
              fileContent.subarray(-5).toString().includes("EOF")
            ) {
              entityDraft.setValue("mainURL", downloadedFilePath[0]);
            }
          }
        }
      }
      if (authors.length > 0) {
        entityDraft.setValue(
          "authors",
          authors
            .map((author) => {
              return author.trim();
            })
            .join(", ")
        );
      }
      if (!matched) {
        return [];
      } else {
        return [entityDraft];
      }
    } else {
      return [];
    }
  }
}
