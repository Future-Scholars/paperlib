import { Scraper } from "./scraper";
import { formatString } from "../../utils/misc";

export class IEEEScraper extends Scraper {
    constructor(enable, apiKey) {
        super();
        this.enable = enable;
        this.apiKey = apiKey;
    }

    preProcess(entityDraft) {
        let enable = entityDraft.title !== "" && (entityDraft.publication === "arXiv" || entityDraft.publication === "") && this.enable;
        var requestTitle = formatString({
            str: entityDraft.title, 
            removeNewline: true
        });
        requestTitle = requestTitle.replace(" ", "+")

        let scrapeURL = "http://ieeexploreapi.ieee.org/api/v1/search/articles?apikey=" +
                        this.apiKey +
                        "&format=json&max_records=25&start_record=1&sort_order=asc&sort_field=article_number&article_title=" +
                        requestTitle;

        let headers = {
            Accept: "application/json",
        };

        return { scrapeURL, headers, enable };
    }

    parsingProcess(rawResponse, entityDraft) {
        let response = JSON.parse(rawResponse.body);
        if (response.total_records > 0) {
            for (const article of response.articles) {
                var plainHitTitle = formatString({
                    str: article.title,
                    removeStr: "&amp",
                });
                plainHitTitle = formatString({
                    str: plainHitTitle,
                    removeSymbol: true,
                    lowercased: true,
                });

                var existTitle = formatString({
                    str: entityDraft.title,
                    removeStr: "&amp",
                });
                existTitle = formatString({
                    str: existTitle,
                    removeSymbol: true,
                    lowercased: true,
                });

                if (plainHitTitle != existTitle) {
                    continue;
                } else {
                    let title = article.title.replace("&amp;", "&");
                    let authors = article.authors.authors
                        .map((author) => {
                            return author.full_name.trim();
                        })
                        .join(", ");

                    let pubTime = article.publication_year;
                    var pubType;

                    if (
                        article.content_type.includes("Journals") ||
                        article.content_type.includes("Article")
                    ) {
                        pubType = 0;
                    } else if (
                        article.content_type.includes("Conferences")
                    ) {
                        pubType = 1;
                    } else {
                        pubType = 2;
                    }

                    let publication = article.publication_title;
                    entityDraft.setValue("title", title, false);
                    entityDraft.setValue("authors", authors, false);
                    entityDraft.setValue("pubTime", `${pubTime}`, false);
                    entityDraft.setValue("pubType", pubType, false);
                    entityDraft.setValue("publication", publication, false);

                    break;
                }
            }
        }
        return entityDraft
    }
}
