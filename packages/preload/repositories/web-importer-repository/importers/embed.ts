import { WebContentType, WebImporter } from "./importer";
import { Preference } from "../../../utils/preference";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";

export class EmbedWebImporter extends WebImporter {
  constructor(preference: Preference) {
    const urlRegExp = new RegExp("^https?://");
    super(preference, urlRegExp);
  }

  async parsingProcess(
    webContent: WebContentType
  ): Promise<PaperEntityDraft | boolean> {
    var el = document.createElement("html");
    el.innerHTML = webContent.document;

    // Get meta tags
    const metaTags = el.getElementsByTagName("meta");
    let entityDraft: PaperEntityDraft | boolean = false;
    if (metaTags.length > 0) {
      entityDraft = new PaperEntityDraft(true);
      let matched = false;

      const authors = [];

      // @ts-ignore
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
        if (meta.name === "citation_pdf_url") {
          let downloadURL;
          if (meta.content.endsWith(".pdf")) {
            downloadURL = meta.content;
          } else {
            downloadURL = meta.content + ".pdf";
          }
          const downloadedFilePath = await this.downloadProcess([downloadURL]);
          entityDraft.setValue("mainURL", downloadedFilePath[0]);
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
        entityDraft = false;
      }
    }

    return entityDraft;
  }
}
