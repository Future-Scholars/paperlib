import fs from 'fs';
import * as pdfjs from 'pdfjs-dist';

import { Scraper, ScraperRequestType, ScraperType } from './scraper';
import { Preference } from '../../../utils/preference';
import { PaperEntityDraft } from '../../../models/PaperEntityDraft';
import { constructFileURL } from '../../../utils/path';
import { formatString } from '../../../utils/string';
import {
  PDFDocumentProxy,
  PDFPageProxy,
  TextItem,
} from 'pdfjs-dist/types/src/display/api';

export class PDFScraper extends Scraper {
  constructor(preference: Preference) {
    super(preference);

    // @ts-ignore
    const pdfjsWorker = import('pdfjs-dist/build/pdf.worker.entry');
    // @ts-ignore
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  }

  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    const enable =
      entityDraft.mainURL !== '' &&
      fs.existsSync(
        constructFileURL(
          entityDraft.mainURL,
          true,
          false,
          this.preference.get('appLibFolder') as string
        )
      ) &&
      entityDraft.mainURL.endsWith('.pdf') &&
      (this.preference.get('pdfBuiltinScraper') as boolean);

    const scrapeURL = constructFileURL(
      entityDraft.mainURL,
      true,
      true,
      this.preference.get('appLibFolder') as string
    );

    const headers = {};

    return { scrapeURL, headers, enable };
  }

  // @ts-ignore
  parsingProcess(
    rawResponse: PDFFileResponseType,
    entityDraft: PaperEntityDraft
  ): PaperEntityDraft {
    const metaData = rawResponse.metaData as {
      info: {
        Title: string;
        Author: string;
      };
    };
    const firstPageText = rawResponse.firstPageText;

    entityDraft.setValue('title', metaData.info.Title);
    entityDraft.setValue('authors', metaData.info.Author);

    // Extract arXiv ID
    const arxivIds = firstPageText.match(
      new RegExp(
        'arXiv:(\\d{4}.\\d{4,5}|[a-z\\-] (\\.[A-Z]{2})?\\/\\d{7})(v\\d )?',
        'g'
      )
    );
    if (arxivIds) {
      const arxivId = formatString({ str: arxivIds[0], removeWhite: true });
      entityDraft.setValue('arxiv', arxivId);
    }

    // Extract DOI
    const dois = firstPageText.match(
      new RegExp(
        '(?:' + '(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?![%"#? ])\\S)+)' + ')',
        'g'
      )
    );
    if (dois) {
      const doi = formatString({ str: dois[0], removeWhite: true });
      entityDraft.setValue('doi', doi);
    }

    return entityDraft;
  }

  scrapeImpl = scrapeImpl;
}

async function scrapeImpl(
  this: ScraperType,
  entityDraft: PaperEntityDraft
): Promise<PaperEntityDraft> {
  const { scrapeURL, headers, enable } = this.preProcess(
    entityDraft
  ) as ScraperRequestType;
  if (enable) {
    try {
      const pdf = await pdfjs.getDocument(
        constructFileURL(scrapeURL, false, true)
      ).promise;
      const metaData = await pdf.getMetadata();
      const firstPageText = await _getPDFText(pdf);

      const response = {
        metaData: metaData,
        firstPageText: firstPageText,
      };

      // @ts-ignore
      return this.parsingProcess(response, entityDraft) as PaperEntityDraft;
    } catch (error) {
      throw error;
    }
  } else {
    return entityDraft;
  }
}

async function _getPDFText(pdfData: PDFDocumentProxy): Promise<string> {
  let firstPageText = '';
  const pageData = await pdfData.getPage(1);
  const pageText = await _renderPage(pageData);
  firstPageText = `${firstPageText}\n\n${pageText}`;
  return firstPageText;
}

async function _renderPage(pageData: PDFPageProxy): Promise<string> {
  const renderOptions = {
    normalizeWhitespace: false,
    disableCombineTextItems: false,
  };

  const textContent = await pageData.getTextContent(renderOptions);

  let lastY;
  let text = '';
  for (let item of textContent.items) {
    item = item as TextItem;
    if (lastY === item.transform[5] || !lastY) {
      text += item.str;
    } else {
      text += '\n' + item.str;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    lastY = item.transform[5];
  }
  return text;
}

export interface PDFFileResponseType {
  metaData: {
    info: {
      Title: string;
      Author: string;
    };
  };
  firstPageText: string;
}
