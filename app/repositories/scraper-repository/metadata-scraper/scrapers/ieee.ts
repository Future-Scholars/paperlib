import { Response } from "got";

import { isMetadataCompleted } from "@/base/metadata";
import { formatString } from "@/base/string";
import { PaperEntity } from "@/models/paper-entity";
import { ScraperPreference } from "@/preference/preference";

import { Scraper, ScraperRequestType } from "./scraper";

interface ResponseType {
  total_records: number;
  articles: {
    title: string;
    authors: {
      authors: {
        full_name: string;
      }[];
    };
    publication_year: string;
    content_type: string;
    publication_title: string;
    volume: string;
    publisher: string;
    start_page: string;
    end_page: string;
  }[];
}

export class IEEEScraper extends Scraper {
  static checkEnable(paperEntityDraft: PaperEntity): boolean {
    const IEEEAPIKey =
      (window.preference.get("scrapers") as Record<string, ScraperPreference>)[
        "ieee"
      ]?.args ?? "";

    return (
      paperEntityDraft.title !== "" &&
      IEEEAPIKey !== "" &&
      !isMetadataCompleted(paperEntityDraft)
    );
  }

  static preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const IEEEAPIKey =
      (window.preference.get("scrapers") as Record<string, ScraperPreference>)[
        "ieee"
      ]?.args ?? "";

    let requestTitle = formatString({
      str: paperEntityDraft.title,
      removeNewline: true,
    });
    requestTitle = requestTitle.replace(/ /g, "+");
    const scrapeURL =
      "http://ieeexploreapi.ieee.org/api/v1/search/articles?apikey=" +
      IEEEAPIKey +
      "&format=json&max_records=25&start_record=1&sort_order=asc&sort_field=article_number&article_title=" +
      requestTitle;

    const headers = {
      Accept: "application/json",
    };

    return { scrapeURL, headers };
  }

  static parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const response = JSON.parse(rawResponse.body) as ResponseType;
    if (response.total_records > 0) {
      for (const article of response.articles) {
        const plainHitTitle = formatString({
          str: article.title,
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

        if (plainHitTitle != existTitle) {
          continue;
        } else {
          const title = article.title.replace(/&amp;/g, "&");
          const authors = article.authors.authors
            .map((author) => {
              return author.full_name.trim();
            })
            .join(", ");

          const pubTime = article.publication_year;

          let pubType;
          if (
            article.content_type.includes("Journals") ||
            article.content_type.includes("Article")
          ) {
            pubType = 0;
          } else if (article.content_type.includes("Conferences")) {
            pubType = 1;
          } else if (article.content_type.includes("Book")) {
            pubType = 3;
          } else {
            pubType = 2;
          }

          const publication = article.publication_title;
          paperEntityDraft.setValue("title", title, false, true);
          paperEntityDraft.setValue("authors", authors);
          paperEntityDraft.setValue("pubTime", `${pubTime}`);
          paperEntityDraft.setValue("pubType", pubType);
          paperEntityDraft.setValue("publication", publication);
          if (article.volume) {
            paperEntityDraft.setValue("volume", article.volume);
          }
          if (article.start_page) {
            paperEntityDraft.setValue("pages", article.start_page);
          }
          if (article.end_page) {
            paperEntityDraft.setValue(
              "pages",
              paperEntityDraft.pages + "-" + article.end_page
            );
          }
          if (article.publisher) {
            paperEntityDraft.setValue("publisher", article.publisher);
          }
          break;
        }
      }
    }
    return paperEntityDraft;
  }
}
