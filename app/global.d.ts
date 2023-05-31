import fs from "fs";
import path from "path";

import { AppInteractor } from "./interactors/app-interactor";
import { EntityInteractor } from "./interactors/entity-interactor";
import { FeedInteractor } from "./interactors/feed-interactor";
import { PluginSideInteractor } from "./interactors/plugin-side-interactor";
import { PreviewInteractor } from "./interactors/preview-interactor";
import { RenderInteractor } from "./interactors/render-interactor";
import { WordAddinInteractor } from "./interactors/word-addin-interactor";
import { Preference } from "./preference/preference";
import { MainRendererStateStore } from "./state/renderer/appstate";
import { NetworkTool } from "./utils/got";
import { Logger } from "./utils/logger";

declare global {
  interface Window {
    appInteractor: AppInteractor;
    entityInteractor: EntityInteractor;
    renderInteractor: RenderInteractor;
    feedInteractor: FeedInteractor;
    previewInteractor: PreviewInteractor;
    pluginSideInteractor: PluginSideInteractor;
    wordAddinInteractor: WordAddinInteractor;

    logger: Logger;
    networkTool: NetworkTool;
    preference: Preference;
    stateStore: MainRendererStateStore;
  }

  interface Realm {
    safeWrite: <T>(callback: () => T) => T;
  }
}
