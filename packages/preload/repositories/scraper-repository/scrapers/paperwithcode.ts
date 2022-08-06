import got, { Response } from "got";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

import { Scraper, ScraperRequestType, ScraperType } from "./scraper";
import { formatString } from "../../../utils/string";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";

export class PwCScraper extends Scraper {
  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    const enable = entityDraft.title !== "" && this.getEnable("pwc");

    const connectedTitle = formatString({
      str: entityDraft.title,
      removeStr: "&amp",
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
      this.sharedState.set(
        "viewState.processInformation",
        `Scraping code from paperswithcode.com ...`
      );
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    entityDraft: PaperEntityDraft
  ): PaperEntityDraft {
    const response = JSON.parse(rawResponse.body) as {
      count?: number;
      results: {
        url: string;
        is_official: boolean;
      }[];
    };
    if (response.count) {
      let codeList: string[] = [];
      for (const result of response.results) {
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
      entityDraft.setValue("codes", codeList);
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
    const agent = this.getProxyAgent();
    let options = {
      headers: headers,
      retry: 1,
      timeout: 10000,
      agent: agent,
    };
    const rawSearchResponse = await got(scrapeURL, options);

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
      str: entityDraft.title,
      removeStr: "&amp",
      removeSymbol: true,
      lowercased: true,
    });

    let id = "";
    if (searchResponse.count) {
      const codeList: string[] = [];
      for (const result of searchResponse.results) {
        const hitTitle = formatString({
          str: result.paper.title,
          removeStr: "&amp",
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
      const rawRepoResponse = await got(
        `https://paperswithcode.com/api/v1/papers/${id}/repositories/`,
        options
      );

      return this.parsingProcess(
        rawRepoResponse,
        entityDraft
      ) as PaperEntityDraft;
    } else {
      return entityDraft;
    }
  } else {
    return entityDraft;
  }
}
