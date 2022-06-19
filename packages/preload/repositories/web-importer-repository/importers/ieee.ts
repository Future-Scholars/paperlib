import { parse } from "node-html-parser";

import { WebContentType, WebImporter } from "./importer";
import { Preference } from "../../../utils/preference";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";

export class IEEEWebImporter extends WebImporter {
  constructor(preference: Preference) {
    const urlRegExp = new RegExp("^https?://ieeexplore.ieee.org/document");
    super(preference, urlRegExp);
  }

  async parsingProcess(
    webContent: WebContentType
  ): Promise<PaperEntityDraft | boolean> {
    console.log(webContent);

    let entityDraft: PaperEntityDraft | boolean = false;

    const root = parse(webContent.document);
    const doiNode = root.querySelector(".stats-document-abstract-doi");
    const doi = doiNode?.lastChild.rawText;

    if (doi) {
      entityDraft = new PaperEntityDraft(true);
      entityDraft.doi = doi;
      const downloadURL = `https://sci.bban.top/pdf/${doi.toLowerCase()}.pdf`;
      if (downloadURL) {
        const downloadedFilePath = await this.downloadProcess([downloadURL]);
        if (downloadedFilePath && downloadedFilePath.length > 0) {
          entityDraft.mainURL = downloadedFilePath[0];
        }
      }
    }
    return entityDraft;
  }
}
