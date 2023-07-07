import { Response } from "got";
import stringSimilarity from "string-similarity";

import { isMetadataCompleted } from "@/base/metadata";
import { formatString } from "@/base/string";
import { PaperEntity } from "@/models/paper-entity";

import { Scraper, ScraperRequestType } from "./scraper";

interface ResponseType {
  Items: {
    DOI: string;
    Issue?: string;
    JournalName?: string;
    PublicationDateTime: string;
    PublicationType: string;
    PublisherName: string;
    ParentTitle: string;
    StartPage?: string;
    EndPage?: string;
    Title: string;
    AuthorEditorLinks?: string;
    VolumeNumber: string;
  }[];
}

export class SPIEScraper extends Scraper {
  static checkEnable(paperEntityDraft: PaperEntity): boolean {
    return (
      paperEntityDraft.title !== "" && !isMetadataCompleted(paperEntityDraft)
    );
  }

  static preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const title = formatString({
      str: paperEntityDraft.title,
      removeNewline: true,
    }).replace(" ", "+");
    const scrapeURL = `https://www.spiedigitallibrary.org/search?term=${title}`;
    const headers = {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
    };

    return { scrapeURL, headers };
  }

  static parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const resultsStr = rawResponse.body.match(/DisplayResults\(\[.*\]\);/g);
    if (resultsStr && resultsStr[0]) {
      const results = JSON.parse(
        resultsStr[0].replace("DisplayResults([", "").slice(0, -6)
      ) as ResponseType;

      for (const item of results.Items) {
        const plainHitTitle = formatString({
          str: item.Title,
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

        const sim = stringSimilarity.compareTwoStrings(
          plainHitTitle,
          existTitle
        );
        if (sim > 0.95) {
          paperEntityDraft.setValue(
            "title",
            item.Title.replaceAll("&amp;", "&"),
            false,
            true
          );
          paperEntityDraft.setValue("doi", item.DOI, false);

          if (item.PublicationType.toLowerCase().includes("journal")) {
            paperEntityDraft.setValue("pubType", 0, false);
          } else if (item.PublicationType.toLowerCase().includes("book")) {
            paperEntityDraft.setValue("pubType", 3, false);
          } else if (
            item.PublicationType.toLowerCase().includes("proceeding")
          ) {
            paperEntityDraft.setValue("pubType", 1, false);
          } else {
            paperEntityDraft.setValue("pubType", 2, false);
          }

          if (item.StartPage && item.EndPage) {
            paperEntityDraft.setValue(
              "pages",
              `${item.StartPage}-${item.EndPage}`,
              false
            );
          }
          paperEntityDraft.setValue(
            "publication",
            item.JournalName?.replaceAll("_", " ") || item.ParentTitle,
            false
          );
          paperEntityDraft.setValue(
            "pubTime",
            `${new Date(item.PublicationDateTime).getFullYear()}`,
            false
          );
          paperEntityDraft.setValue(
            "authors",
            item.AuthorEditorLinks
              ? item.AuthorEditorLinks.split(" ")
                  .map((a) => a.trim().split("|")[0]?.replace("_", " "))
                  .filter((a) => a)
                  .join(", ")
              : "",
            false
          );
          paperEntityDraft.setValue("number", item.Issue, false);
          paperEntityDraft.setValue("volume", item.VolumeNumber, false);
          paperEntityDraft.setValue("publisher", item.PublisherName, false);

          break;
        }
      }
    }
    return paperEntityDraft;
  }
}
