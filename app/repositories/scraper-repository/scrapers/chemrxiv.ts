import { Response } from "got";
import stringSimilarity from "string-similarity";

import { PaperEntity } from "@/models/paper-entity";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { Preference } from "@/preference/preference";

import { Scraper, ScraperRequestType } from "./scraper";
import { DOIInnerScraper } from "./doi-inner";
import { formatString } from "@/utils/string";

export class ChemRxivScraper extends Scraper {
  doiScraper: DOIInnerScraper;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    super(stateStore, preference);

    this.doiScraper = new DOIInnerScraper(stateStore, preference);
  }

  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      this.getEnable("chemrxiv") && (
        paperEntityDraft.doi !== "" && paperEntityDraft.doi.includes('chemrxiv') || paperEntityDraft.title !== "") &&
      this.isPreprint(paperEntityDraft);

    let scrapeURL: string;
    if (paperEntityDraft.doi !== "") {
      scrapeURL = `https://chemrxiv.org/engage/chemrxiv/public-api/v1/items/doi/${paperEntityDraft.doi}`;
    } else {
      scrapeURL = `https://chemrxiv.org/engage/chemrxiv/public-api/v1/items?term=${paperEntityDraft.title}`;
    }

    const headers = {
    };

    if (enable) {
      this.stateStore.logState.processLog = `Scraping metadata from chemRxiv...`;
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const parsedResponse = JSON.parse(rawResponse.body) as ChemRxivResponse | { itemHits: ChemRxivResponse[] }
    let chemRxivResponses: ChemRxivResponse[];
    if (parsedResponse.hasOwnProperty('itemHits')) {
      chemRxivResponses = (parsedResponse as { itemHits: ChemRxivResponse[] }).itemHits;
    } else {
      chemRxivResponses = [parsedResponse as ChemRxivResponse];
    }

    for (const response of chemRxivResponses) {
      const plainHitTitle = formatString({
        str: response.title,
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

      if (response.doi === paperEntityDraft.doi || sim > 0.95) {
        paperEntityDraft.setValue("title", response.title, false, true);
        paperEntityDraft.setValue("authors", response.authors.map(a => `${a.firstName} ${a.lastName}`).join(', '), false);
        paperEntityDraft.setValue("pubTime", response.statusDate.slice(0, 4), false);
        if (response.vor) {
          paperEntityDraft.setValue("doi", response.vor.vorDoi, false);
        } else {
          paperEntityDraft.setValue("publication", "chemRxiv", false);
        }
        break;
      }
    }
    return paperEntityDraft;
  }

  // @ts-ignore
  scrapeImpl = scrapeImpl;
}

async function scrapeImpl(
  this: ChemRxivScraper,
  paperEntityDraft: PaperEntity,
  force = false
): Promise<PaperEntity> {
  const { scrapeURL, headers, enable, content } = this.preProcess(
    paperEntityDraft
  ) as ScraperRequestType;

  if (enable || force) {
    const response = (await window.networkTool.get(
      scrapeURL,
      headers,
      1,
      false,
      5000
    )) as Response<string>;
    paperEntityDraft = this.parsingProcess(
      response,
      paperEntityDraft
    ) as PaperEntity;

    paperEntityDraft = await this.doiScraper.scrape(paperEntityDraft);
    this.uploadCache(paperEntityDraft, "chemrxiv");

    return paperEntityDraft;
  } else {
    return paperEntityDraft;
  }
}

interface ChemRxivResponse {
  "doi": string,
  "vor"?: {
    "vorDoi": string,
  },
  "title": string,
  "statusDate": string,
  "authors":
  {
    "firstName": string,
    "lastName": string,
  }[]
}