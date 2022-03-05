import { Scraper } from "./scraper";
import { formatString } from "../../utils/misc";

function dblpParsingProcess(rawResponse, entityDraft) {
    let response = JSON.parse(rawResponse.body);
    if (response.result.hits["@sent"] > 0) {
        for (const hit of response.result.hits.hit) {
            let article = hit.info;

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

                let authorList = [];
                let authorResponse = article.authors.author;

                if ("@pid" in authorResponse) {
                    authorList.push(authorResponse.text.trim());
                } else {
                    for (const author of authorResponse) {
                        authorList.push(author.text.trim());
                    }
                }
                let authors = authorList.join(", ");

                let pubTime = article.year;
                var pubType;
                if (article.type.includes("Journal")) {
                    pubType = 0;
                } else if (article.type.includes("Conference")) {
                    pubType = 1;
                } else {
                    pubType = 2;
                }
                let pubKey = article.key.split("/").slice(0, 2).join("/");

                if (pubKey != "journals/corr") {
                    entityDraft.setValue("title", title, false);
                    entityDraft.setValue("authors", authors, false);
                    entityDraft.setValue("pubTime", `${pubTime}`, false);
                    entityDraft.setValue("pubType", pubType, false);
                    entityDraft.setValue("publication", "dblp://" + pubKey, false);
                }
                break;
            }
        }
    }

    return entityDraft
}

export class DBLPScraper extends Scraper {
    constructor(enable) {
        super();
        this.enable = enable;
    }

    preProcess(entityDraft) {
        var dblpQuery = formatString({
            str: entityDraft.title,
            removeStr: "&amp",
        });
        dblpQuery = formatString({
            str: dblpQuery,
            removeStr: "&",
        }).replace("—", "-");

        let enable = dblpQuery !== "" && this.enable;
        let scrapeURL = "https://dblp.org/search/publ/api?q=" +
                        dblpQuery +
                        "&format=json"
        let headers = {};

        return { scrapeURL, headers, enable };
    }

    parsingProcess(rawResponse, entityDraft) {
        return  dblpParsingProcess(rawResponse, entityDraft);
    }
}



export class DBLPbyTimeScraper extends Scraper {
    constructor(enable, offset) {
        super();
        this.enable = enable;
        this.offset = offset;
    }

    preProcess(entityDraft) {
        let year = parseInt(entityDraft.pubTime);

        var dblpQuery = formatString({
            str: entityDraft.title,
            removeStr: "&amp",
        });
        dblpQuery = formatString({
            str: dblpQuery,
            removeStr: "&",
        }).replace("—", "-");
        dblpQuery += " " + `year:${year + this.offset}`

        let enable = dblpQuery !== "" && !entityDraft.publication.startsWith("dblp://") && this.enable;
        let scrapeURL = "https://dblp.org/search/publ/api?q=" +
                        dblpQuery +
                        "&format=json"
        let headers = {};

        return { scrapeURL, headers, enable };
    }

    parsingProcess(rawResponse, entityDraft) {
        return  dblpParsingProcess(rawResponse, entityDraft);
    }
}


export class DBLPVenueScraper extends Scraper {
    constructor(enable) {
        super();
        this.enable = enable;
    }

    preProcess(entityDraft) {
        let enable = this.enable && entityDraft.publication.startsWith("dblp://");
        let scrapeURL = "https://dblp.org/search/venue/api?q=" +
                        entityDraft.publication.replace("dblp://", "") +
                        "&format=json";
        let headers = {};
        return { scrapeURL, headers, enable };
    }

    parsingProcess(rawResponse, entityDraft) {
        let response = JSON.parse(rawResponse.body);
        if (response.result.hits["@sent"] > 0) {
            let hits = response.result.hits.hit;
            for (const hit of hits) {
                let venueInfo = hit["info"]
                console.log(venueInfo["url"])
                console.log(entityDraft.publication.replace("dblp://", "") + "/")
                if (venueInfo["url"].includes(entityDraft.publication.replace("dblp://", "") + "/")) {
                    let venue = venueInfo["venue"]
                    entityDraft.setValue("publication", venue, false)
                    break
                }
            }
        }
        return entityDraft
    }
}