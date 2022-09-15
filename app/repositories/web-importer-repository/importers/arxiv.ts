import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import { WebContentType, WebImporter } from "./importer";

export class ArXivWebImporter extends WebImporter {
  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    const urlRegExp = new RegExp(
      "^https?://([^\\.]+\\.)?(arxiv\\.org|xxx\\.lanl\\.gov)/(/\\w|abs/|pdf/)"
    );
    super(stateStore, preference, urlRegExp);
  }

  async parsingProcess(
    webContent: WebContentType
  ): Promise<PaperEntity | boolean> {
    let entityDraft: PaperEntity | boolean = false;
    const arXivID = webContent.url.split("/")[4].replace(".pdf", "");

    if (arXivID) {
      entityDraft = new PaperEntity(true);
      const downloadURL = `https://arxiv.org/pdf/${arXivID}.pdf`;

      const downloadedFilePath = await window.networkTool.downloadPDFs([
        downloadURL,
      ]);

      entityDraft.setValue("arxiv", arXivID);
      entityDraft.setValue("pubType", 0);
      entityDraft.setValue("publication", "arXiv");
      if (downloadedFilePath.length > 0) {
        entityDraft.setValue("mainURL", downloadedFilePath[0]);
      }
    }

    return entityDraft;
  }
}
