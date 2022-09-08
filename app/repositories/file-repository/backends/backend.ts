import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

export interface FileBackend {
  stateStore: MainRendererStateStore;
  preference: Preference;

  check(): void;
  access(url: string, download: boolean): Promise<string>;
  move(
    paperEntity: PaperEntity,
    fourceDelete: boolean
  ): Promise<PaperEntity | null>;
  remove(paperEntity: PaperEntity): Promise<boolean>;
  removeFile(url: string): Promise<boolean>;
}
