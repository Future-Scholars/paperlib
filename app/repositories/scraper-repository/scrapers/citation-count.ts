import { Response } from "got";
import stringSimilarity from "string-similarity";

import { PaperEntity } from "@/models/paper-entity";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";

export class CitationCountScraper extends Scraper {
  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable = paperEntityDraft.title !== "" || paperEntityDraft.doi !== "" || paperEntityDraft.arxiv !== "";

    let scrapeURL;
    if (paperEntityDraft.doi !== "") {
      scrapeURL = `https://api.semanticscholar.org/graph/v1/paper/${paperEntityDraft.doi}?fields=title,citationCount,influentialCitationCount`;
    } else if (paperEntityDraft.arxiv !== "") {
      scrapeURL = `https://api.semanticscholar.org/graph/v1/paper/arXiv:${paperEntityDraft.arxiv.toLowerCase().replace('arxiv:', '').split('v')[0]}?fields=title,citationCount,influentialCitationCount`;
    } else {
      scrapeURL = `https://api.semanticscholar.org/graph/v1/paper/search?query=${formatString(
        {
          str: paperEntityDraft.title,
          whiteSymbol: true,
        }
      )}&limit=10&fields=title,citationCount,influentialCitationCount`;
    }
    const headers = {};
    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): any {
    const parsedResponse = JSON.parse(rawResponse.body) as {
      data: [
        {
          paperId: string;
          title: string;
          citationCount?: number;
          influentialCitationCount?: number;
        }
      ]
    } | {
      paperId: string;
      title: string;
      citationCount?: number;
      influentialCitationCount?: number;
    };

    let citationCount = {
      semanticscholarId: '',
      citationCount: 'N/A',
      influentialCitationCount: 'N/A',
    }

    let itemList;
    // @ts-ignore
    if (parsedResponse.data) {
      // @ts-ignore
      itemList = parsedResponse.data;
    } else {
      itemList = [parsedResponse];
    }


    for (const item of itemList) {
      const plainHitTitle = formatString({
        str: item.title,
        removeStr: "&amp",
        removeSymbol: true,
        lowercased: true,
      });

      const existTitle = formatString({
        str: paperEntityDraft.title,
        removeStr: "&amp",
        removeSymbol: true,
        lowercased: true,
      });

      const sim = stringSimilarity.compareTwoStrings(plainHitTitle, existTitle);
      if (sim > 0.95) {
        citationCount = {
          semanticscholarId: item.paperId,
          citationCount: `${item.citationCount}`,
          influentialCitationCount: `${item.influentialCitationCount}`,
        }
        break;
      }
    }

    return citationCount;
  }

}