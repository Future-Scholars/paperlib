import { Response } from "got";
import stringSimilarity from "string-similarity";

import { formatString } from "@/base/string";
import { PaperEntity } from "@/models/paper-entity";

import { Scraper, ScraperRequestType } from "./scraper";

interface ResponseTypeA {
  data: [
    {
      paperId: string;
      title: string;
      citationCount?: number;
      influentialCitationCount?: number;
    }
  ];
}
interface ResponseTypeB {
  paperId: string;
  title: string;
  citationCount?: number;
  influentialCitationCount?: number;
}

export class CitationCountScraper extends Scraper {
  static checkEnable(paperEntityDraft: PaperEntity): boolean {
    return (
      paperEntityDraft.title !== "" ||
      paperEntityDraft.doi !== "" ||
      paperEntityDraft.arxiv !== ""
    );
  }
  static preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    let scrapeURL;
    if (paperEntityDraft.doi !== "") {
      scrapeURL = `https://api.semanticscholar.org/graph/v1/paper/${paperEntityDraft.doi}?fields=title,citationCount,influentialCitationCount`;
    } else if (paperEntityDraft.arxiv !== "") {
      scrapeURL = `https://api.semanticscholar.org/graph/v1/paper/arXiv:${
        paperEntityDraft.arxiv.toLowerCase().replace("arxiv:", "").split("v")[0]
      }?fields=title,citationCount,influentialCitationCount`;
    } else {
      scrapeURL = `https://api.semanticscholar.org/graph/v1/paper/search?query=${formatString(
        {
          str: paperEntityDraft.title,
          whiteSymbol: true,
        }
      )}&limit=10&fields=title,citationCount,influentialCitationCount`;
    }
    const headers = {};
    return { scrapeURL, headers };
  }

  static parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): any {
    const parsedResponse = JSON.parse(rawResponse.body) as
      | ResponseTypeA
      | ResponseTypeB;

    let citationCount = {
      semanticscholarId: "",
      citationCount: "N/A",
      influentialCitationCount: "N/A",
    };

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
        removeStr: "&amp;",
        removeSymbol: true,
        lowercased: true,
      });

      const existTitle = formatString({
        str: paperEntityDraft.title,
        removeStr: "&amp;",
        removeSymbol: true,
        lowercased: true,
      });

      const sim = stringSimilarity.compareTwoStrings(plainHitTitle, existTitle);
      if (sim > 0.95) {
        citationCount = {
          semanticscholarId: item.paperId,
          citationCount: `${item.citationCount}`,
          influentialCitationCount: `${item.influentialCitationCount}`,
        };
        break;
      }
    }

    return citationCount;
  }

  static async scrape(
    paperEntityDraft: PaperEntity,
    force = false
  ): Promise<PaperEntity> {
    if (!this.checkEnable(paperEntityDraft) && !force) {
      return paperEntityDraft;
    }

    const { scrapeURL, headers } = this.preProcess(paperEntityDraft);

    const response = (await networkTool.get(
      scrapeURL,
      headers,
      0,
      false,
      5000,
      true
    )) as Response<string>;
    return this.parsingProcess(response, paperEntityDraft);
  }
}
