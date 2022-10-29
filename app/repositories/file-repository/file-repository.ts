import fs from "fs";
import { watch } from "vue";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { getAllFiles } from "@/utils/path";

import { FileBackend } from "./backends/backend";
import { LocalFileBackend } from "./backends/local-backend";
import { WebDavFileBackend } from "./backends/webdav-backend";

export class FileRepository {
  stateStore: MainRendererStateStore;
  preference: Preference;

  backend: FileBackend;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;

    this.backend = this.initBackend();

    watch(
      () => this.stateStore.viewState.storageBackendReinited,
      () => {
        this.backend = this.initBackend();
      }
    );
  }

  async check() {
    this.backend.check();
  }

  async access(url: string, download: boolean): Promise<string> {
    return await this.backend.access(url, download);
  }

  startWatch() {
    this.backend.startWatch();
  }

  async stopWatch() {
    await this.backend.stopWatch();
  }

  async move(
    paperEntity: PaperEntity,
    fourceDelete = false,
    forceNotLink = false
  ): Promise<PaperEntity | null> {
    return await this.backend.move(paperEntity, fourceDelete, forceNotLink);
  }
  async remove(paperEntity: PaperEntity): Promise<boolean> {
    return await this.backend.remove(paperEntity);
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
          const paperEntityDraft = new PaperEntity(true);
          paperEntityDraft.setValue("title", value.Title);
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
            paperEntityDraft.setValue("authors", authors);
          }
          paperEntityDraft.setValue("publication", value["Publication Title"]);
          paperEntityDraft.setValue("pubTime", value["Publication Year"]);
          paperEntityDraft.setValue("doi", value["DOI"]);
          paperEntityDraft.setValue("addTime", new Date(value["Date Added"]));
          const pubType = [
            "journalArticle",
            "conferencePaper",
            "others",
            "book",
          ].indexOf(value["Item Type"]);
          paperEntityDraft.setValue("pubType", pubType > -1 ? pubType : 2);
          const attachments = value["File Attachments"].split(";");
          const mainURL = attachments[0];
          let supURLs = attachments.slice(1).map((url: string) => url.trim());
          if (mainURL) {
            if (mainURL.endsWith(".pdf")) {
              paperEntityDraft.setValue("mainURL", mainURL);
            } else {
              supURLs.push(mainURL);
            }
          }
          if (supURLs.length > 0) {
            paperEntityDraft.setValue("supURLs", supURLs);
          }
          paperEntityDraft.setValue("pages", value["Pages"]);
          paperEntityDraft.setValue("volume", value["Volume"]);
          paperEntityDraft.setValue("number", value["Issue"]);
          paperEntityDraft.setValue("publisher", value["Publisher"]);

          paperEntityDrafts.push(paperEntityDraft);
        }
      } catch (e) {
        console.error(e);
      }
    }

    return paperEntityDrafts;
  }

  initBackend(): FileBackend {
    if (this.preference.get("syncFileStorage") === "local") {
      return new LocalFileBackend(this.stateStore, this.preference);
    } else if (this.preference.get("syncFileStorage") === "webdav") {
      return new WebDavFileBackend(this.stateStore, this.preference);
    } else {
      throw new Error("Unknown file storage backend");
    }
  }
}
