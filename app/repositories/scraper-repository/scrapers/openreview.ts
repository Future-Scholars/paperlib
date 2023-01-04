import { Response } from "got";

import { PaperEntity } from "@/models/paper-entity";
import { formatString } from "@/utils/string";

import { Scraper, ScraperRequestType } from "./scraper";
import { DBLPVenueScraper } from "./dblp";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { Preference } from "@/preference/preference";
import stringSimilarity from "string-similarity";

export class OpenreviewScraper extends Scraper {
  dblpVenueScraper: DBLPVenueScraper

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    super(stateStore, preference);
    this.dblpVenueScraper = new DBLPVenueScraper(stateStore, preference);
  }

  preProcess(paperEntityDraft: PaperEntity): ScraperRequestType {
    const enable =
      paperEntityDraft.title !== "" &&
      this.isPreprint(paperEntityDraft) &&
      this.getEnable("openreview");

    const scrapeURL = `https://api.openreview.net/notes/search?content=all&group=all&limit=10&source=forum&term=${paperEntityDraft.title}&type=terms`

    const headers = {
      Accept: "application/json",
    };

    if (enable) {
      this.stateStore.logState.processLog = `Scraping metadata from openreview.net ...`;
    }

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    paperEntityDraft: PaperEntity
  ): PaperEntity {
    const notes = (
      JSON.parse(rawResponse.body) as {
        notes: {
          content: {
            title: string;
            authors: string[];
            venueid: string;
            venue: string;
            _bibtex: string;
          };
        }[];
      }
    ).notes;

    for (const note of notes) {
      const plainHitTitle = formatString({
        str: note.content.title,
        removeStr: "&amp;",
        removeSymbol: true,
        lowercased: true,
      });

      console.log(note)

      const existTitle = formatString({
        str: paperEntityDraft.title,
        removeStr: "&amp;",
        removeSymbol: true,
        lowercased: true,
      });

      const sim = stringSimilarity.compareTwoStrings(plainHitTitle, existTitle);
      if (sim > 0.95) {
        const title = note.content.title;
        const authors = note.content.authors.join(", ");

        paperEntityDraft.setValue("title", title);
        paperEntityDraft.setValue("authors", authors);

        if (note.content.venue) {
          if (
            !note.content.venue.includes("Submitted") &&
            !note.content.venue.includes("CoRR")
          ) {
            let publication
            if (note.content.venueid.includes("dblp")) {
              const type = note.content.venueid.includes("conf")
                ? "conf"
                : "journals";

              const venueID = type + '/' + note.content.venueid.split("/")[2].toLowerCase();
              if (!venueID.includes("journals/corr")) {
                publication = `dblp://${JSON.stringify({ 'venueID': venueID, 'paperKey': '' })}`;
              } else {
                publication = "";
              }


            } else {
              publication = note.content.venue;
            }

            const pubTimeReg = note.content.venueid.match(/\d{4}/g);
            const pubTime = pubTimeReg ? pubTimeReg[0] : "";

            paperEntityDraft.setValue("pubTime", `${pubTime} `);
            paperEntityDraft.setValue("publication", publication);
          }
        } else {
          if (
            note.content._bibtex &&
            note.content._bibtex.includes("year={")
          ) {
            const pubTimeReg = note.content._bibtex.match(/year={(\d{4})/);
            const pubTime = pubTimeReg ? pubTimeReg[1] : "";
            paperEntityDraft.setValue("pubTime", `${pubTime} `);
          }
          paperEntityDraft.setValue("publication", "openreview.net");
        }

        break;
      }
    }

    return paperEntityDraft;
  }

  // @ts-ignore
  scrapeImpl = scrapeImpl;
}

async function scrapeImpl(
  this: OpenreviewScraper,
  paperEntityDraft: PaperEntity,
  force = false
): Promise<PaperEntity> {
  const { scrapeURL, headers, enable } = this.preProcess(
    paperEntityDraft
  ) as ScraperRequestType;

  if (enable || force) {
    const response = (await window.networkTool.get(
      scrapeURL,
      headers,
      1,
      false,
      5000
    )) as Response<string>;
    paperEntityDraft = this.parsingProcess(response, paperEntityDraft);

    if (paperEntityDraft.publication.includes("dblp")) {
      paperEntityDraft = await this.dblpVenueScraper.scrape(
        paperEntityDraft,
      );
    }

    this.uploadCache(paperEntityDraft, 'openreview');

    return paperEntityDraft;
  } else {
    return paperEntityDraft;
  }
}
