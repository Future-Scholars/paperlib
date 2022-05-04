import { PaperEntityDraft } from "../..//models/PaperEntityDraft";
import { SharedState } from "../../utils/appstate";
import { Preference } from "../../utils/preference";
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
