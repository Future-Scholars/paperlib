import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";

export class SemanticScholarScraper extends Scraper {
  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    super(stateStore, preference);
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
    )}&limit=3&fields=externalIds,authors,title,venue,year,publicationTypes,journal`;

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

      if (plainHitTitle === existTitle) {
        paperEntityDraft.setValue("doi", item.externalIds?.DOI, false);

        if (item.publicationTypes?.[0]?.toLowerCase().includes("journal")) {
          paperEntityDraft.setValue("type", 0, false);
        } else if (item.publicationTypes?.[0]?.toLowerCase().includes("book")) {
          paperEntityDraft.setValue("type", 3, false);
        } else if (
          item.publicationTypes?.[0]?.toLowerCase().includes("conference")
        ) {
          paperEntityDraft.setValue("type", 1, false);
        } else {
          paperEntityDraft.setValue("type", 2, false);
        }

        paperEntityDraft.setValue("pages", item.journal?.pages, false);
        paperEntityDraft.setValue("publication", item.venue, false);
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
        paperEntityDraft.setValue("arxiv", item.externalIds?.ArXiv, false);
        paperEntityDraft.setValue("doi", item.externalIds?.DOI, false);

        break;
      }
    }

    return paperEntityDraft;
  }
}
