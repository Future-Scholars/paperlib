import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType, ScraperType } from "./scraper";

export class PwCScraper extends Scraper {
  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable = paperEntityDraft.title !== "" && this.getEnable("pwc");

    const connectedTitle = formatString({
      str: paperEntityDraft.title,
      removeStr: "&amp;",
      lowercased: true,
      trimWhite: true,
    })
      .replace(/ /g, "-")
      .replace(/\./g, "");
    const scrapeURL = `https://paperswithcode.com/api/v1/search/?q=${connectedTitle}`;

    const headers = {
      Accept: "application/json",
    };

    if (enable) {
      this.stateStore.logState.processLog = `Scraping code from paperswithcode.com ...`;
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const response = JSON.parse(rawResponse.body) as {
      count?: number;
      results: {
        url: string;
        is_official: boolean;
        stars: number;
      }[];
    };

    if (response.count) {
      let codeList: string[] = [];

      const sortedResults = response.results.sort((a, b) => b.stars - a.stars);

      for (const result of sortedResults.slice(0, 3)) {
        codeList.push(
          JSON.stringify({
            url: result.url,
            isOfficial: result.is_official,
          })
        );
      }
      codeList = codeList.sort((a, b) => {
        const aIsOfficial = JSON.parse(a).isOfficial;
        const bIsOfficial = JSON.parse(b).isOfficial;
        if (aIsOfficial && !bIsOfficial) {
          return -1;
        } else if (!aIsOfficial && bIsOfficial) {
          return 1;
        } else {
          return 0;
        }
      });
      paperEntityDraft.setValue("codes", codeList);
    }
    return paperEntityDraft;
  }

  scrapeImpl = scrapeImpl;
}

async function scrapeImpl(
  this: ScraperType,
  paperEntityDraft: PaperEntity,
  force = false
): Promise<PaperEntity> {
  const { scrapeURL, headers, enable } = this.preProcess(
    paperEntityDraft
  ) as ScraperRequestType;

  if (enable || force) {
    const rawSearchResponse = (await window.networkTool.get(
      scrapeURL,
      headers
    )) as Response<string>;

    const searchResponse = JSON.parse(rawSearchResponse.body) as {
      count?: number;
      results: {
        paper: {
          id: string;
          title: string;
        };
        repository: {
          url: string;
        };
        is_official: boolean;
      }[];
    };
    const targetTitle = formatString({
      str: paperEntityDraft.title,
      removeStr: "&amp;",
      removeSymbol: true,
      lowercased: true,
    });

    let id = "";
    if (searchResponse.count) {
      for (const result of searchResponse.results) {
        const hitTitle = formatString({
          str: result.paper.title,
          removeStr: "&amp;",
          removeSymbol: true,
          lowercased: true,
        });

        if (hitTitle === targetTitle && result.repository) {
          id = result.paper.id;
          break;
        }
      }
    }

    if (id) {
      const rawRepoResponse = (await window.networkTool.get(
        `https://paperswithcode.com/api/v1/papers/${id}/repositories/`,
        headers
      )) as Response<string>;

      return this.parsingProcess(
        rawRepoResponse,
        paperEntityDraft
      ) as PaperEntity;
    } else {
      return paperEntityDraft;
    }
  } else {
    return paperEntityDraft;
  }
}
