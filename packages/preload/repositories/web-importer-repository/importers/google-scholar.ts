import { parse } from "node-html-parser";

import { WebContentType, WebImporter } from "./importer";
import { SharedState } from "../../../utils/appstate";
import { Preference } from "../../../utils/preference";
import { safeGot } from "../../../utils/got";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";
import { downloadPDFs } from "../../../utils/got";
import { bibtex2entityDraft, bibtex2json } from "../../../utils/bibtex";

export class GoogleScholarWebImporter extends WebImporter {
  constructor(sharedState: SharedState, preference: Preference) {
    const urlRegExp = new RegExp("^https?://scholar.google.com");
    super(sharedState, preference, urlRegExp);
  }

  async parsingProcess(
    webContent: WebContentType
  ): Promise<PaperEntityDraft | boolean> {
    let entityDraft: PaperEntityDraft | boolean = false;
    const paper = parse(webContent.document);

    if (paper) {
      const agent = this.getProxyAgent();
      entityDraft = new PaperEntityDraft(true);
      const fileUrlNode = paper.querySelector(".gs_or_ggsm")?.firstChild;
      // @ts-ignore
      const downloadURL = fileUrlNode?.attributes["href"];
      if (downloadURL) {
        this.sharedState.set("viewState.processInformation", `Downloading...`);
        const downloadedFilePath = await downloadPDFs([downloadURL]);

        if (downloadedFilePath) {
          if (downloadedFilePath.length > 0) {
            entityDraft.mainURL = downloadedFilePath[0];
          }
        }
      }

      // @ts-ignore
      const paperInfo = paper.childNodes[0].lastChild;
      let title = paperInfo.childNodes[0];
      if (title) {
        let titleStr = title.childNodes.pop()?.rawText;

        if (titleStr) {
          const headers = {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
          };
          const scrapeUrl = `https://scholar.google.com/scholar?q=${titleStr.replaceAll(
            " ",
            "+"
          )}`;
          await safeGot(scrapeUrl, headers, agent);

          const dataid = title.parentNode.parentNode.attributes["data-aid"];
          if (dataid) {
            const citeUrl = `https://scholar.google.com/scholar?q=info:${dataid}:scholar.google.com/&output=cite&scirp=1&hl=en`;
            const citeResponse = await safeGot(citeUrl, headers, agent);
            if (citeResponse?.body) {
              const citeRoot = parse(citeResponse?.body);
              const citeBibtexNode = citeRoot.lastChild
                .childNodes[0] as any as HTMLElement;
              if (citeBibtexNode) {
                // @ts-ignore
                const citeBibtexUrl = citeBibtexNode.attributes["href"];
                if (citeBibtexUrl) {
                  const citeBibtexResponse = await safeGot(
                    citeBibtexUrl,
                    headers,
                    agent
                  );
                  const bibtexStr = citeBibtexResponse?.body;
                  if (bibtexStr) {
                    const bibtexs = bibtex2json(bibtexStr);
                    if (bibtexs.length > 0) {
                      const bibtex = bibtexs[0];
                      if (bibtex) {
                        entityDraft = bibtex2entityDraft(bibtex, entityDraft);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return entityDraft;
  }
}
