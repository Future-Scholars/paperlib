import { franc } from "franc";
import fs from "fs";
// @ts-ignore
import * as pdfjs from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?worker";
import {
  PDFDocumentProxy,
  PDFPageProxy,
  TextItem,
} from "pdfjs-dist/types/src/display/api";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { constructFileURL } from "@/utils/path";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";

pdfjs.GlobalWorkerOptions.workerPort = new pdfjsWorker();

export class PDFScraper extends Scraper {
  static checkEnable(paperEntityDraft: PaperEntity): boolean {
    return (
      paperEntityDraft.mainURL !== "" &&
      fs.existsSync(
        constructFileURL(
          paperEntityDraft.mainURL,
          true,
          false,
          window.preference?.get("appLibFolder") as string
        )
      ) &&
      paperEntityDraft.mainURL.endsWith(".pdf")
    );
  }

  static preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const scrapeURL = constructFileURL(
      paperEntityDraft.mainURL,
      true,
      true,
      window.preference?.get("appLibFolder") as string
    );

    const headers = {};

    return { scrapeURL, headers };
  }

  static parsingProcess(
    rawResponse: PDFFileResponseType,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const metaData = rawResponse.metaData as {
      info: {
        Title: string;
        Author: string;
      };
    };
    const firstPageText = rawResponse.firstPageText;

    let metaDataTitle = "";
    if (paperEntityDraft.title === "") {
      metaDataTitle = metaData.info.Title || "";
      if (
        metaDataTitle === "untitled" ||
        metaDataTitle.includes(".docx") ||
        metaDataTitle.includes(".doc")
      ) {
        metaDataTitle = "";
      }
    }

    // let authors;
    // if (metaData.info.Author?.includes(";")) {
    //   authors = metaData.info.Author.split(";")
    //     .map((author) => {
    //       return author.trim();
    //     })
    //     .join(", ");
    // } else {
    //   authors = metaData.info.Author || "";
    // }
    // if (paperEntityDraft.authors === "") {
    //   paperEntityDraft.setValue("authors", authors);
    // }

    // Extract arXiv ID
    let arxivIds = firstPageText.match(
      new RegExp(
        "arXiv:(\\d{4}.\\d{4,5}|[a-z\\-] (\\.[A-Z]{2})?\\/\\d{7})(v\\d )?",
        "g"
      )
    );
    if (arxivIds) {
      arxivIds[0] = arxivIds[0].replace("arXiv:", "");
    }
    // if not start with number, should be arXiv ID before 2007
    if (
      !arxivIds ||
      (arxivIds?.length > 0 && !arxivIds[0].slice(0, 1).match(/\d/))
    ) {
      arxivIds = firstPageText.match(
        new RegExp("arXiv:(.*/\\d{7})(v\\d )?", "g")
      );
    }
    if (arxivIds) {
      const arxivId = formatString({ str: arxivIds[0], removeWhite: true });
      if (paperEntityDraft.arxiv === "") {
        paperEntityDraft.setValue("arxiv", arxivId.replace("arXiv:", ""));
      }
    }

    // Extract DOI fron urls
    const dois = rawResponse.urls
      .map((url) => {
        if (url) {
          const doi = url.match(/10.\d{4,9}\/[-._;()/:A-Z0-9]+/gim);
          if (doi) {
            return doi[0];
          }
        }
        return "";
      })
      .filter((doi) => doi !== "");
    if (dois.length > 0) {
      // Vote for the most common DOI
      const doi = formatString({
        str: dois.sort(
          (a, b) =>
            dois.filter((v) => v === a).length -
            dois.filter((v) => v === b).length
        )[dois.length - 1],
        removeWhite: true,
      });
      if (paperEntityDraft.doi === "") {
        paperEntityDraft.setValue("doi", doi);
      }
    } else {
      // Extract DOI from first page
      const dois = firstPageText.match(/10.\d{4,9}\/[-._;()/:A-Z0-9]+/gim);
      if (dois) {
        const doi = formatString({ str: dois[0], removeWhite: true });
        if (paperEntityDraft.doi === "") {
          paperEntityDraft.setValue("doi", doi);
        }
      }
    }

    if (
      paperEntityDraft.doi.endsWith(",") ||
      paperEntityDraft.doi.endsWith(".")
    ) {
      paperEntityDraft.setValue("doi", paperEntityDraft.doi.slice(0, -1));
    }

    // Largest String as Title
    const largestText = rawResponse.largestText.slice(0, 400);
    if (paperEntityDraft.title === "") {
      const metaDataTitleLang = franc(metaDataTitle);
      const largestTextLang = franc(largestText);

      if (metaDataTitleLang === largestTextLang) {
        paperEntityDraft.setValue(
          "title",
          metaDataTitle.length > largestText.length
            ? metaDataTitle
            : largestText
        );
      } else {
        paperEntityDraft.setValue("title", largestText);
      }
    }

    return paperEntityDraft;
  }

  static async scrape(
    paperEntityDraft: PaperEntity,
    force = false
  ): Promise<PaperEntity> {
    if (!this.checkEnable(paperEntityDraft) && !force) {
      return paperEntityDraft;
    }

    const { scrapeURL, headers } = this.preProcess(paperEntityDraft);
    try {
      const pdf = await pdfjs.getDocument({
        url: constructFileURL(scrapeURL, false, true),
        useWorkerFetch: true,
        cMapUrl: "../viewer/cmaps/",
      }).promise;
      const metaData = await pdf.getMetadata();
      const urls = await _getPDFURL(pdf);
      const pageText = await _getPDFText(pdf);

      const response = {
        metaData: metaData,
        firstPageText: pageText.text,
        largestText: pageText.largestText,
        urls: urls,
      };

      return this.parsingProcess(response, paperEntityDraft);
    } catch (error) {
      throw error;
    }
  }
}

async function _getPDFURL(pdfData: PDFDocumentProxy): Promise<Array<string>> {
  const pageData = await pdfData.getPage(1);
  const annos = await pageData.getAnnotations();
  let urls: Array<string> = [];
  for (const anno of annos) {
    urls.push(anno.url);
  }
  return urls;
}

async function _getPDFText(
  pdfData: PDFDocumentProxy
): Promise<{ text: string; largestText: string }> {
  const pageData = await pdfData.getPage(1);
  return await _renderPage(pageData);
}

async function _renderPage(
  pageData: PDFPageProxy
): Promise<{ text: string; largestText: string }> {
  const renderOptions = {
    normalizeWhitespace: false,
    disableCombineTextItems: false,
  };

  const textContent = await pageData.getTextContent(renderOptions);

  let lastY;
  let text = "";
  let largestText = "";
  let secondLargestText = "";
  let largestFontSize = 0;
  let secondLargestFontSize = 0;
  let largestTextList: string[] = [];
  let secondLargestTextList: string[] = [];

  if (
    (textContent.items[0] as TextItem | undefined)?.str
      .slice(0, 100)
      .includes("ICLR")
  ) {
    const largestTextList: string[] = [];
    let largestWord = "";
    for (let item of textContent.items.slice(1)) {
      item = item as TextItem;
      if (item.height === 17.2154) {
        largestWord += item.str;
      } else if (item.height === 13.7723 || item.height === 0) {
        largestWord += item.str.toLowerCase();

        if (largestWord !== "") {
          largestTextList.push(largestWord.trim());
          largestWord = "";
        }
      } else {
        break;
      }
    }
    largestText = largestTextList.filter((w) => w).join(" ");
  } else {
    for (let item of textContent.items) {
      item = item as TextItem;

      if (item.height > largestFontSize) {
        secondLargestFontSize = largestFontSize;
        secondLargestTextList = largestTextList;
        largestFontSize = item.height;
        largestTextList = [item.str];
      } else if (item.height === largestFontSize) {
        largestTextList.push(item.str);
      } else if (item.height > secondLargestFontSize) {
        secondLargestFontSize = item.height;
        secondLargestTextList = [item.str];
      } else if (item.height === secondLargestFontSize) {
        secondLargestTextList.push(item.str);
      }

      if (lastY === item.transform[5] || !lastY) {
        text += item.str;
      } else {
        text += "\n" + item.str;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      lastY = item.transform[5];
    }

    largestTextList = largestTextList.filter((text) => text.length > 0);
    largestText = largestTextList.join(" ");
    secondLargestTextList = secondLargestTextList.filter(
      (text) => text.length > 0
    );
    secondLargestText = secondLargestTextList.join(" ");

    const lang = franc(largestText);

    if (
      largestText.length === 1 ||
      (lang !== "cmn" && lang !== "jpn" && !largestText.includes(" "))
    ) {
      largestText = secondLargestText;
    }
  }

  return { text: text, largestText: largestText };
}

export interface PDFFileResponseType {
  metaData: {
    info: {
      Title: string;
      Author: string;
    };
  };
  firstPageText: string;
  largestText: string;
  urls: string[];
}
