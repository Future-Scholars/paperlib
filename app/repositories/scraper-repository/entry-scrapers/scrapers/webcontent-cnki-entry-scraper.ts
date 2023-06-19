import parse from "node-html-parser";

import { PaperEntity } from "@/models/paper-entity";

import { AbstractEntryScraper } from "./entry-scraper";

export interface IWebcontentCNKIEntryScraperPayload {
  url: string;
  document: string;
  cookies: string;
}

export class WebcontentCNKIEntryImporter extends AbstractEntryScraper {
  static validPayload(payload: any) {
    if (
      !payload.hasOwnProperty("url") ||
      !payload.hasOwnProperty("document") ||
      !payload.hasOwnProperty("cookies")
    ) {
      return false;
    }
    const urlRegExp = new RegExp("^https?://kns.cnki.net/kcms/detail");
    return urlRegExp.test(payload.url);
  }

  static async scrape(
    payload: IWebcontentCNKIEntryScraperPayload
  ): Promise<PaperEntity[]> {
    if (!this.validPayload(payload)) {
      return [];
    }

    const url = payload.url;

    const urlParams = new URLSearchParams(url.split("?")[1]);
    const filename = urlParams.get("filename") || "";
    const dbname = urlParams.get("dbname") || "";

    const refRequestUrl = "https://kns.cnki.net/kns8/manage/ShowExport";
    const refRequestFormData = new FormData();
    refRequestFormData.append("filename", filename);
    refRequestFormData.append("dbname", dbname);
    refRequestFormData.append("displaymode", "Refworks");
    refRequestFormData.append("ordertype", "desc");

    const response = await window.networkTool.postForm(
      refRequestUrl,
      refRequestFormData
    );

    const root = parse(response.body);
    const refwork = root.querySelector("li")?.innerHTML;

    if (refwork) {
      const lines = refwork.split("<br>");
      if (lines.length === 0) {
        return [];
      } else {
        const paperEntityDraft = new PaperEntity(true);

        const authorList: string[] = [];

        let isDissertation = false;
        let isPatent = false;
        let isStandard = false;
        let patentID = "";

        for (const line of lines) {
          if (line.startsWith("T1")) {
            paperEntityDraft.setValue("title", line.slice(3));
          } else if (
            line.startsWith("A1") ||
            line.startsWith(
              "A2" || line.startsWith("A3") || line.startsWith("A4")
            )
          ) {
            const aList = line
              .slice(3)
              .split(";")
              .map((author) => author.trim());
            authorList.push(...aList);
          } else if (line.startsWith("YR")) {
            paperEntityDraft.setValue("pubTime", line.slice(3));
          } else if (line.startsWith("JF")) {
            paperEntityDraft.setValue("publication", line.slice(3));
          } else if (line.startsWith("PB")) {
            paperEntityDraft.setValue("publisher", line.slice(3));
          } else if (line.startsWith("RT")) {
            const type = line.slice(3);
            if (type === "Dissertation/Thesis") {
              isDissertation = true;
            } else if (type === "Patent") {
              isPatent = true;
            } else if (type === "Standard") {
              isStandard = true;
            }

            let typeIdx;
            if (type === "Journal Article") {
              typeIdx = 0;
            } else if (type === "Conference Proceeding") {
              typeIdx = 1;
            } else if (type === "Book") {
              typeIdx = 3;
            } else {
              typeIdx = 2;
            }
            paperEntityDraft.setValue("pubType", typeIdx);
          } else if (line.startsWith("OP")) {
            paperEntityDraft.setValue("pages", line.slice(3));
          } else if (line.startsWith("vo")) {
            paperEntityDraft.setValue("volume", line.slice(3));
          } else if (line.startsWith("IS")) {
            paperEntityDraft.setValue("numbers", line.slice(3));
          } else if (line.startsWith("FD")) {
            paperEntityDraft.setValue("pubTime", line.slice(3, 7));
          } else if (line.startsWith("ID")) {
            patentID = line.slice(3);
          }
        }

        if (isDissertation || isStandard) {
          paperEntityDraft.setValue("publication", paperEntityDraft.publisher);
        }

        if (isPatent) {
          paperEntityDraft.setValue("publication", patentID);
        }

        paperEntityDraft.setValue(
          "authors",
          authorList.filter((a) => a).join(", ")
        );
        return [paperEntityDraft];
      }
    }

    return [];
  }
}
