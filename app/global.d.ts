import fs from "fs";
import path from "path";

import { AppInteractor } from "./interactors/app-interactor";
import { EntityInteractor } from "./interactors/entity-interactor";

declare global {
  interface Window {
    appInteractor: AppInteractor;
    entityInteractor: EntityInteractor;
    quicklookInteractor: { preview: () => void; closePreview: () => void };
    fsAPI: typeof fs;
    pathAPI: typeof path;
  }

  interface Realm {
    safeWrite: (callback: () => void) => void;
  }
}
