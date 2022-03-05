import { Scraper } from "./scraper";
import { formatString } from "../../utils/misc";

export class CVFScraper extends Scraper {
    constructor(enable) {
        super();
        this.enable = enable;
    }

    preProcess(entityDraft) {
        let enable = entityDraft.title !== "" && (entityDraft.publication === "arXiv" || entityDraft.publication === "") && this.enable;
        let shortTitle = formatString({
            str: entityDraft.title, 
            removeWhite: true, 
            removeStr: "&amp"
        });
        let scrapeURL = `https://paperlib.app/api/cvf/${shortTitle}`;
        let headers = {};

        return { scrapeURL, headers, enable };
    }

    parsingProcess(rawResponse, entityDraft) {
        let response = JSON.parse(rawResponse.body);
        if (typeof response.year !== "undefined") {
            let pubTime = response.year
            let publication = response.booktitle
            var pubType
            if (response.type === "inproceedings") {
                pubType = 1
            } else if (response.type === "article") {
                pubType = 0
            } else {
                pubType = 2
            }
            entityDraft.setValue("pubTime", `${pubTime}`, false);
            entityDraft.setValue("pubType", pubType, false);
            entityDraft.setValue("publication", publication, false);
        }
        return entityDraft
    }
}
