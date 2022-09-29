import { Response } from "got";
import stringSimilarity from "string-similarity";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";
import { DOIInnerScraper } from "./doi-inner";

export class SemanticScholarScraper extends Scraper {
  doiScraper: DOIInnerScraper;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    super(stateStore, preference);

    this.doiScraper = new DOIInnerScraper(stateStore, preference);
  }

  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      this.getEnable("semanticscholar") &&
      paperEntityDraft.title !== "" &&
      this.isPreprint(paperEntityDraft);
    const scrapeURL = `https://api.semanticscholar.org/graph/v1/paper/search?query=${formatString(
      {
        str: paperEntityDraft.title,
        whiteSymbol: true,
      }
    )}&limit=10&fields=externalIds,authors,title,venue,year,publicationTypes,journal`;

    const headers = {};
    if (enable) {
      this.stateStore.logState.processLog = `Scraping metadata from semanticscholar.org ...`;
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const parsedResponse = JSON.parse(rawResponse.body) as {
      data: [
        {
          title: string;
          publicationTypes?: string[];
          authors?: { name: string }[];
          venue?: string;
          year?: string;
          journal?: {
            name?: string;
            pages?: string;
            volume?: string;
          };
          externalIds?: {
            ArXiv?: string;
            DOI?: string;
          };
        }
      ];
    };
    for (const item of parsedResponse.data) {
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
        if (item.publicationTypes?.[-1]?.toLowerCase().includes("journal")) {
          paperEntityDraft.setValue("type", 0, false);
        } else if (
          item.publicationTypes?.[-1]?.toLowerCase().includes("book")
        ) {
          paperEntityDraft.setValue("type", 3, false);
        } else if (
          item.publicationTypes?.[-1]?.toLowerCase().includes("conference")
        ) {
          paperEntityDraft.setValue("type", 1, false);
        } else {
          paperEntityDraft.setValue("type", 2, false);
        }

        if (item.journal?.name) {
          paperEntityDraft.setValue("publication", item.journal.name.replaceAll('&amp;', '&'), false);
        } else {
          paperEntityDraft.setValue("publication", item.venue?.replaceAll('&amp;', '&'), false);
        }

        paperEntityDraft.setValue(
          "pubTime",
          item.year ? `${item.year}` : "",
          false
        );
        paperEntityDraft.setValue(
          "authors",
          item.authors?.map((author) => author.name).join(", "),
          false
        );
        paperEntityDraft.setValue("volume", item.journal?.volume, false);
        paperEntityDraft.setValue("pages", item.journal?.pages, false);

        paperEntityDraft.setValue("arxiv", item.externalIds?.ArXiv, false);
        paperEntityDraft.setValue("doi", item.externalIds?.DOI, false);
        break;
      }
    }

    return paperEntityDraft;
  }

  // @ts-ignore
  scrapeImpl = scrapeImpl;
}

async function scrapeImpl(
  this: SemanticScholarScraper,
  paperEntityDraft: PaperEntity,
  force = false
): Promise<PaperEntity> {
  const { scrapeURL, headers, enable } = this.preProcess(
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

    const authorListfromSemanticScholar = paperEntityDraft.authors.split(", ");

    paperEntityDraft = await this.doiScraper.scrape(paperEntityDraft);

    // Sometimes DOI returns incomplete author list, so we use Semantic Scholar's author list if it is longer
    if (
      paperEntityDraft.authors.split(", ").length <
      authorListfromSemanticScholar.length
    ) {
      paperEntityDraft.setValue(
        "authors",
        authorListfromSemanticScholar.join(", "),
        false
      );
    }

    this.uploadCache(paperEntityDraft, "semanticscholar");

    return paperEntityDraft;
  } else {
    return paperEntityDraft;
  }
}
