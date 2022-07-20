import { XMLParser } from "fast-xml-parser";
import { Response } from "got";

import { Scraper, ScraperRequestType } from "./scraper";
import { formatString } from "../../../utils/string";
import { Preference } from "../../../utils/preference";
import { SharedState } from "../../../utils/appstate";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";

export class ArXivScraper extends Scraper {
  xmlParser: XMLParser;

  constructor(sharedState: SharedState, preference: Preference) {
    super(sharedState, preference);
    this.xmlParser = new XMLParser();
  }

  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    const enable = this.getEnable("arxiv") && entityDraft.arxiv !== "";

    const arxivID = formatString({
      str: entityDraft.arxiv,
      removeStr: "arXiv:",
    });
    const scrapeURL = `https://export.arxiv.org/api/query?id_list=${arxivID}`;

    const headers = {
      "accept-encoding": "UTF-32BE",
    };

    if (enable) {
      this.sharedState.set(
        "viewState.processInformation",
        `Scraping metadata from arXiv.org ...`
      );
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    entityDraft: PaperEntityDraft
  ): PaperEntityDraft {
    const parsedResponse = this.xmlParser.parse(rawResponse.body) as {
      feed: {
        entry: {
          title: string;
          author: { name: string }[];
          published: string;
        };
      };
    };
    const arxivResponse = parsedResponse.feed.entry;
    const title = arxivResponse.title;
    const authorList = arxivResponse.author;
    const authors = authorList
      .map((author) => {
        return author.name.trim();
      })
      .join(", ");

    const pubTime = arxivResponse.published.substring(0, 4);
    entityDraft.setValue("title", title);
    entityDraft.setValue("authors", authors);
    entityDraft.setValue("pubTime", pubTime);
    entityDraft.setValue("pubType", 0);
    entityDraft.setValue("publication", "arXiv");

    return entityDraft;
  }
}
