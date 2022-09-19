import chokidar from "chokidar";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

export interface FileBackend {
  stateStore: MainRendererStateStore;
  preference: Preference;

  watcher?: chokidar.FSWatcher;

  check(): void;
  access(url: string, download: boolean): Promise<string>;
  startWatch(): void;
  stopWatch(): Promise<void>;
  move(
    paperEntity: PaperEntity,
    fourceDelete: boolean
  ): Promise<PaperEntity | null>;
  remove(paperEntity: PaperEntity): Promise<boolean>;
  removeFile(url: string): Promise<boolean>;
}
