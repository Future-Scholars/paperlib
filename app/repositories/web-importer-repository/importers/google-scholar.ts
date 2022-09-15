import { parse } from "node-html-parser";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { bibtex2json, bibtex2paperEntityDraft } from "@/utils/bibtex";
import { downloadPDFs, safeGot } from "@/utils/got";

import { WebContentType, WebImporter } from "./importer";

export class GoogleScholarWebImporter extends WebImporter {
  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    const urlRegExp = new RegExp("^https?://scholar.google.com");
    super(stateStore, preference, urlRegExp);
  }

  async parsingProcess(
    webContent: WebContentType
  ): Promise<PaperEntity | boolean> {
    let entityDraft: PaperEntity | boolean = false;
    const paper = parse(webContent.document);

    if (paper) {
      const agent = this.getProxyAgent();
      entityDraft = new PaperEntity(true);
      const fileUrlNode = paper.querySelector(".gs_or_ggsm")?.firstChild;
      // @ts-ignore
      const downloadURL = fileUrlNode?.attributes["href"];
      if (downloadURL) {
        this.stateStore.logState.processLog = `Downloading...`;
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
                        entityDraft = bibtex2paperEntityDraft(
                          bibtex,
                          entityDraft
                        );
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
