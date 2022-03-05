import { XMLParser } from "fast-xml-parser";

import { Scraper } from "./scraper";
import { formatString } from "../../utils/misc";

export class ArXivScraper extends Scraper {
    constructor(enable) {
        super();
        this.enable = enable;
        this.xmlParser = new XMLParser();
    }

    preProcess(entityDraft) {
        let enable = entityDraft.arxiv !== "" && this.enable;
        let arxivID = formatString({
            str: entityDraft.arxiv,
            removeStr: "arXiv:",
        });
        let scrapeURL = `https://export.arxiv.org/api/query?id_list=${arxivID}`;
        let headers = {
            "accept-encoding": "UTF-32BE",
        };

        return { scrapeURL, headers, enable };
    }

    parsingProcess(rawResponse, entityDraft) {
        let arxivResponse = this.xmlParser.parse(rawResponse.body).feed.entry;
        let title = arxivResponse.title;
        let authorList = arxivResponse.author;
        let authors = authorList
            .map((author) => {
                return author.name;
            })
            .join(", ");
        let pubTime = arxivResponse.published.substring(0, 4);
        entityDraft.setValue("title", title, false);
        entityDraft.setValue("authors", authors, false);
        entityDraft.setValue("pubTime", pubTime, false);
        entityDraft.setValue("pubType", 0, false);
        entityDraft.setValue("publication", "arXiv", false);

        return entityDraft
    }
}
