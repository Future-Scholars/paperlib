import { Scraper } from "./scraper";
import { formatString } from "../../utils/misc";

export class DOIScraper extends Scraper {
    constructor(preference) {
        super();
        this.preference = preference;
    }

    preProcess(entityDraft) {
        let enable = entityDraft.doi !== "" && this.preference.get("doiScraper");
        let doiID = formatString({
            str: entityDraft.doi,
            removeNewline: true,
            removeWhite: true,
        });
        let scrapeURL = `https://dx.doi.org/${doiID}`;
        let headers = {
            Accept: "application/json",
        };

        return { scrapeURL, headers, enable };
    }

    parsingProcess(rawResponse, entityDraft) {
        let response = JSON.parse(rawResponse.body);
        let title = response.title;
        let authors = response.author
            .map((author) => {
                return author.given + " " + author.family;
            })
            .join(", ");
        let pubTime = response.published["date-parts"]["0"][0];
        var pubType;
        if (response.type == "proceedings-article") {
            pubType = 1;
        } else if (response.type == "journal-article") {
            pubType = 0;
        } else {
            pubType = 2;
        }
        let publication = response["container-title"];

        entityDraft.setValue("title", title, false);
        entityDraft.setValue("authors", authors, false);
        entityDraft.setValue("pubTime", `${pubTime}`, false);
        entityDraft.setValue("pubType", pubType, false);
        entityDraft.setValue("publication", publication, false);

        return entityDraft
    }
}
