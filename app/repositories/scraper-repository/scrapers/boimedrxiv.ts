import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { Preference } from "@/preference/preference";

import { Scraper, ScraperRequestType } from "./scraper";
import { DOIInnerScraper } from "./doi-inner";

export class BioRxivScraper extends Scraper {
  doiScraper: DOIInnerScraper;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    super(stateStore, preference);

    this.doiScraper = new DOIInnerScraper(stateStore, preference);
  }

  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      this.getEnable("biomedrxiv") &&
      paperEntityDraft.doi !== "" && paperEntityDraft.doi.startsWith('10.1101') &&
      this.isPreprint(paperEntityDraft);

    const scrapeURL = `https://api.biorxiv.org/pubs/biorxiv/${paperEntityDraft.doi}`;

    const headers = {
    };

    if (enable) {
      this.stateStore.logState.processLog = `Scraping metadata from bioRxiv...`;
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const parsedResponse = JSON.parse(rawResponse.body) as {
      "collection":
      {
        "preprint_doi": string,
        "published_doi": string,
        "published_journal": string,
        "preprint_platform": string,
        "preprint_title": string,
        "preprint_authors": string,
        "preprint_date": string,
        "published_date": string,
      }[]
    };
    const biomedRxivResponse = parsedResponse.collection;

    if (biomedRxivResponse.length > 0) {
      for (const response of biomedRxivResponse) {
        if (response.preprint_doi === paperEntityDraft.doi) {
          paperEntityDraft.setValue("title", response.preprint_title, false, true);
          paperEntityDraft.setValue("authors", response.preprint_authors.split(';').map(a => a.trim()).join(', '), false);
          paperEntityDraft.setValue("date", response.preprint_date.slice(0, 4), false);
          paperEntityDraft.setValue("doi", response.published_doi, false);
          paperEntityDraft.setValue("publication", response.published_journal, false);
          break;
        }
      }
    }
    return paperEntityDraft;
  }

  // @ts-ignore
  scrapeImpl = scrapeImpl;
}

export class MedRxivScraper extends BioRxivScraper {
  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      this.getEnable("biomedrxiv") &&
      paperEntityDraft.doi !== "" && paperEntityDraft.doi.startsWith('10.1101') &&
      this.isPreprint(paperEntityDraft);

    const scrapeURL = `https://api.biorxiv.org/pubs/medrxiv/${paperEntityDraft.doi}`;

    const headers = {
    };

    if (enable) {
      this.stateStore.logState.processLog = `Scraping metadata from medRxiv...`;
    }

    return { scrapeURL, headers, enable };
  }
}


async function scrapeImpl(
  this: BioRxivScraper,
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
    this.uploadCache(paperEntityDraft, "biomedrxiv");

    return paperEntityDraft;
  } else {
    return paperEntityDraft;
  }
}