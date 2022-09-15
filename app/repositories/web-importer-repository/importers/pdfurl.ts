import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import { WebContentType, WebImporter } from "./importer";

export class PDFUrlWebImporter extends WebImporter {
  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    const urlRegExp = new RegExp(".*.pdf$");
    super(stateStore, preference, urlRegExp);
  }

  async parsingProcess(
    webContent: WebContentType
  ): Promise<PaperEntity | boolean> {
    let entityDraft: PaperEntity | boolean = false;
    const downloadURL = webContent.url;

    if (downloadURL) {
      entityDraft = new PaperEntity(true);

      const downloadedFilePath = await window.networkTool.downloadPDFs([
        downloadURL,
      ]);
      if (downloadedFilePath.length > 0) {
        entityDraft.setValue("mainURL", downloadedFilePath[0]);
      }
    }

    return entityDraft;
  }
}
