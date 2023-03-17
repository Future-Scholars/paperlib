import { Response } from "got";
import stringSimilarity from "string-similarity";

import { PaperEntity } from "@/models/paper-entity";
import { isMetadataCompleted } from "@/utils/metadata";
import { formatString } from "@/utils/string";

import { DOIScraper } from "./doi";
import { Scraper, ScraperRequestType } from "./scraper";

interface ResponseType {
  data: [
    {
      title: string;
      authors?: { name: string }[];
      year?: string;
      publicationVenue?: {
        name: string;
        type: string;
      };
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
}

export class SemanticScholarScraper extends Scraper {
  static checkEnable(paperEntityDraft: PaperEntity): boolean {
    return (
      paperEntityDraft.title !== "" && !isMetadataCompleted(paperEntityDraft)
    );
  }

  static preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const scrapeURL = `https://api.semanticscholar.org/graph/v1/paper/search?query=${formatString(
      {
        str: paperEntityDraft.title,
        whiteSymbol: true,
      }
    )}&limit=10&fields=externalIds,authors,title,year,journal,publicationTypes`;

    const headers = {};

    return { scrapeURL, headers };
  }

  static parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const parsedResponse = JSON.parse(rawResponse.body) as ResponseType;
    for (const item of parsedResponse.data) {
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
        if (item.publicationVenue) {
          if (item.publicationVenue.type.includes("journal")) {
            paperEntityDraft.setValue("pubType", 0, false);
          } else if (item.publicationVenue.type.includes("book")) {
            paperEntityDraft.setValue("pubType", 3, false);
          } else if (item.publicationVenue.type.includes("conference")) {
            paperEntityDraft.setValue("pubType", 1, false);
          } else {
            paperEntityDraft.setValue("pubType", 2, false);
          }
        }

        if (item.journal?.name) {
          paperEntityDraft.setValue(
            "publication",
            item.journal.name.replaceAll("&amp;", "&"),
            false
          );
        } else {
          paperEntityDraft.setValue(
            "publication",
            item.publicationVenue?.name.replaceAll("&amp;", "&"),
            false
          );
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

  static async scrape(
    paperEntityDraft: PaperEntity,
    force = false
  ): Promise<PaperEntity> {
    if (!this.checkEnable(paperEntityDraft) && !force) {
      return paperEntityDraft;
    }

    const { scrapeURL, headers } = this.preProcess(paperEntityDraft);

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

    paperEntityDraft = await DOIScraper.scrape(paperEntityDraft);

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

    return paperEntityDraft;
  }
}
