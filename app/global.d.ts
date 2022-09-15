import fs from "fs";
import path from "path";

import { AppInteractor } from "./interactors/app-interactor";
import { EntityInteractor } from "./interactors/entity-interactor";
import { FeedInteractor } from "./interactors/feed-interactor";
import { PluginSideInteractor } from "./interactors/plugin-side-interactor";
import { PreviewInteractor } from "./interactors/preview-interactor";
import { RenderInteractor } from "./interactors/render-interactor";

declare global {
  interface Window {
    appInteractor: AppInteractor;
    entityInteractor: EntityInteractor;
    renderInteractor: RenderInteractor;
    feedInteractor: FeedInteractor;
    previewInteractor: PreviewInteractor;
    pluginSideInteractor: PluginSideInteractor;
  }

  interface Realm {
    safeWrite: <T>(callback: () => T) => T;
  }
}
