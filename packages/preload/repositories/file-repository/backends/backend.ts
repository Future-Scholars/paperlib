import { PaperEntityDraft } from "../../../models/PaperEntityDraft";
import { SharedState } from "../../../utils/appstate";
import { Preference } from "../../../utils/preference";

export interface FileBackend {
  sharedState: SharedState;
  preference: Preference;

  check(): void;
  access(url: string, download: boolean): Promise<string>;
  move(
    entity: PaperEntityDraft,
    fourceDelete: boolean
  ): Promise<PaperEntityDraft | null>;
  remove(entity: PaperEntityDraft): Promise<boolean>;
  removeFile(url: string): Promise<boolean>;
}
