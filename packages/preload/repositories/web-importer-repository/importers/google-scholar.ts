import { parse } from "node-html-parser";
import { BibtexParser } from "bibtex-js-parser";

import { WebContentType, WebImporter } from "./importer";
import { Preference } from "../../../utils/preference";
import { safeGot } from "../../../utils/got";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";

export class GoogleScholarWebImporter extends WebImporter {
  constructor(preference: Preference) {
    const urlRegExp = new RegExp("^https?://scholar.google.com");
    super(preference, urlRegExp);
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
        const downloadedFilePath = await this.downloadProcess([downloadURL]);
        if (downloadedFilePath && downloadedFilePath.length > 0) {
          entityDraft.mainURL = downloadedFilePath[0];
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
                  const bibtexs = BibtexParser.parseToJSON(bibtexStr);
                  for (const bibtex of bibtexs) {
                    if (bibtex.title) {
                      entityDraft.title = bibtex.title;
                    }
                    if (bibtex.year) {
                      entityDraft.pubTime = `${bibtex.year}`;
                    }
                    if (bibtex.author) {
                      const authors = bibtex.author
                        .split(" and ")
                        .map((author) => {
                          const first_last = author.split(",").map((author) => {
                            return author.trim();
                          });
                          first_last.reverse();
                          return first_last.join(" ");
                        })
                        .join(", ");
                      entityDraft.authors = authors;
                    }
                    if (bibtex.type === "article") {
                      if (bibtex.journal) {
                        entityDraft.publication = bibtex.journal;
                      }
                      entityDraft.pubType = 0;
                    } else if (
                      bibtex.type === "inproceedings" ||
                      bibtex.type === "incollection"
                    ) {
                      if (bibtex.booktitle) {
                        entityDraft.publication = bibtex.booktitle;
                      }
                      entityDraft.pubType = 1;
                    } else if (bibtex.type === "book") {
                      if (bibtex.publisher) {
                        entityDraft.publication = bibtex.publisher;
                      }
                      entityDraft.pubType = 3;
                    } else {
                      if (bibtex.journal) {
                        entityDraft.publication = bibtex.journal;
                      }
                      entityDraft.pubType = 2;
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
