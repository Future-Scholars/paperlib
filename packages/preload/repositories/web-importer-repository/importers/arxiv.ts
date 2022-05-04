import { WebContentType, WebImporter } from "./importer";
import { Preference } from "../../../utils/preference";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";

export class ArXivWebImporter extends WebImporter {
  constructor(preference: Preference) {
    const urlRegExp = new RegExp(
      "^https?://([^\\.]+\\.)?(arxiv\\.org|xxx\\.lanl\\.gov)/(/\\w|abs/|pdf/)"
    );
    super(preference, urlRegExp);
  }

  async parsingProcess(
    webContent: WebContentType
  ): Promise<PaperEntityDraft | boolean> {
    let entityDraft: PaperEntityDraft | boolean = false;
    const arXivID = webContent.url.split("/")[4].replace(".pdf", "");

    if (arXivID) {
      entityDraft = new PaperEntityDraft(true);
      const downloadURL = `https://arxiv.org/pdf/${arXivID}.pdf`;

      const downloadedFilePath = await this.downloadProcess([downloadURL]);

      entityDraft.setValue("arxiv", arXivID);
      entityDraft.setValue("pubType", 0);
      entityDraft.setValue("publication", "arXiv");
      entityDraft.setValue("mainURL", downloadedFilePath[0]);
    }

    return entityDraft;
  }
}
