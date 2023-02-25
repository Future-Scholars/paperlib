import { XMLParser } from "fast-xml-parser";
import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";

export class ArXivScraper extends Scraper {
  xmlParser: XMLParser;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    super(stateStore, preference);
    this.xmlParser = new XMLParser();
  }

  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      this.getEnable("arxiv") &&
      paperEntityDraft.arxiv !== "" &&
      this.isPreprint(paperEntityDraft);

    const arxivID = formatString({
      str: paperEntityDraft.arxiv,
      removeStr: "arXiv:",
    });
    const scrapeURL = `https://export.arxiv.org/api/query?id_list=${arxivID}`;

    const headers = {
      "accept-encoding": "UTF-32BE",
    };

    if (enable) {
      this.stateStore.logState.processLog = `Scraping metadata from arXiv.org ...`;
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const parsedResponse = this.xmlParser.parse(rawResponse.body) as {
      feed: {
        entry?: {
          title: string;
          author: { name: string }[] | { name: string };
          published: string;
        };
      };
    };
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
