import fs from "fs";
import { PaperEntityDraft } from "../..//models/PaperEntityDraft";
import { SharedState } from "../../utils/appstate";
import { Preference } from "../../utils/preference";
import { getAllFiles } from "../../utils/path";
import { FileBackend } from "./backends/backend";
import { LocalFileBackend } from "./backends/local-backend";
import { WebDavFileBackend } from "./backends/webdav-backend";

export class FileRepository {
  sharedState: SharedState;
  preference: Preference;

  backend: FileBackend;

  constructor(sharedState: SharedState, preference: Preference) {
    this.sharedState = sharedState;
    this.preference = preference;

    this.backend = this.initBackend();

    this.sharedState.register("viewState.storageBackendReinited", () => {
      this.backend = this.initBackend();
    });
  }

  async check() {
    this.backend.check();
  }

  async access(url: string, download: boolean): Promise<string> {
    return await this.backend.access(url, download);
  }
  async move(entity: PaperEntityDraft): Promise<PaperEntityDraft | null> {
    return await this.backend.move(entity);
  }
  async remove(entity: PaperEntityDraft): Promise<boolean> {
    return await this.backend.remove(entity);
  }
  async removeFile(url: string): Promise<boolean> {
    return await this.backend.removeFile(url);
  }

  async listPDFs(folderUrl: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      try {
        const files = getAllFiles(folderUrl);
        resolve(files);
      } catch (e) {
        console.error(e);
        reject([]);
      }
    });
  }

  async parseZoteroCSV(csvUrl: string) {
    const data = fs.readFileSync(csvUrl, "utf8");
    let dataList = data.split("\n");

    const keys = dataList[0].split('","');
    const values = dataList.slice(1).map((line) => {
      if (line) {
        const vs = line.split('","');
        return vs.reduce((acc, v, i) => {
          acc[keys[i]] = v === '""' ? "" : v;
          return acc;
        }, {} as any);
      }
    });

    let paperEntityDrafts = [];
    for (const value of values) {
      try {
        if (value) {
          const entityDraft = new PaperEntityDraft(true);
          entityDraft.setValue("title", value.Title);
          if (value.Author) {
            const authors = value.Author.split(";")
              .map((author: string) => {
                if (author.trim()) {
                  const first_last = author.split(",").map((author: string) => {
                    return author.trim();
                  });
                  first_last.reverse();
                  return first_last.join(" ");
                }
              })
              .join(", ");
            entityDraft.setValue("authors", authors);
          }
          entityDraft.setValue("publication", value["Publication Title"]);
          entityDraft.setValue("pubTime", value["Publication Year"]);
          entityDraft.setValue("doi", value["DOI"]);
          entityDraft.setValue("addTime", new Date(value["Date Added"]));
          const pubType = [
            "journalArticle",
            "conferencePaper",
            "others",
            "book",
          ].indexOf(value["Item Type"]);
          entityDraft.setValue("pubType", pubType > -1 ? pubType : 2);
          console.log(value["File Attachments"]);
          const attachments = value["File Attachments"].split(";");
          const mainURL = attachments[0];
          const supURLs = attachments.slice(1).map((url: string) => url.trim());
          if (mainURL) {
            entityDraft.setValue("mainURL", mainURL);
          }
          if (supURLs.length > 0) {
            entityDraft.setValue("supURLs", supURLs);
          }
          entityDraft.setValue("pages", value["Pages"]);
          entityDraft.setValue("volume", value["Volume"]);
          entityDraft.setValue("number", value["Issue"]);
          entityDraft.setValue("publisher", value["Publisher"]);

          paperEntityDrafts.push(entityDraft);
        }
      } catch (e) {
        console.error(e);
      }
    }

    return paperEntityDrafts;
  }

  initBackend(): FileBackend {
    if (this.preference.get("syncFileStorage") === "local") {
      return new LocalFileBackend(this.sharedState, this.preference);
    } else if (this.preference.get("syncFileStorage") === "webdav") {
      return new WebDavFileBackend(this.sharedState, this.preference);
    } else {
      throw new Error("Unknown file storage backend");
    }
  }
}
