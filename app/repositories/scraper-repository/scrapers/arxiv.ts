import { XMLParser } from "fast-xml-parser";
import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { isMetadataCompleted } from "@/utils/metadata";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";

const xmlParser = new XMLParser();

interface ResponseType {
  feed: {
    entry?: {
      title: string;
      author: { name: string }[] | { name: string };
      published: string;
    };
  };
}

export class ArXivScraper extends Scraper {
  static checkEnable(paperEntityDraft: PaperEntity): boolean {
    return (
      paperEntityDraft.arxiv !== "" && !isMetadataCompleted(paperEntityDraft)
    );
  }

  static preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const arxivID = formatString({
      str: paperEntityDraft.arxiv,
      removeStr: "arXiv:",
    });
    const scrapeURL = `https://export.arxiv.org/api/query?id_list=${arxivID}`;

    const headers = {
      "accept-encoding": "UTF-32BE",
    };

    return { scrapeURL, headers };
  }

  static parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const parsedResponse = xmlParser.parse(rawResponse.body) as ResponseType;

    const arxivResponse = parsedResponse.feed.entry;

    if (arxivResponse) {
      const title = arxivResponse.title;
      const authorList = arxivResponse.author;
      let authors;
      if (Array.isArray(authorList)) {
        authors = authorList
          .map((author) => {
            return author.name.trim();
          })
          .join(", ");
      } else {
        authors = authorList.name.trim();
      }

      const pubTime = arxivResponse.published.substring(0, 4);
      paperEntityDraft.setValue("title", title, false, true);
      paperEntityDraft.setValue("authors", authors);
      paperEntityDraft.setValue("pubTime", pubTime);
      paperEntityDraft.setValue("pubType", 0);
      paperEntityDraft.setValue("publication", "arXiv");
    }
    return paperEntityDraft;
  }
}
