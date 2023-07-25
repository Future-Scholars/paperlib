import fs from "fs";
import path from "path";
import { Store } from "pinia";

import { APIShape, MainAPIShape } from "./api/api";
import { NetworkTool } from "./base/network";
import { PreferenceService } from "./common/services/preference-service";
import { Preference } from "./preference/preference";

import { MainRendererStateStore } from "./state/renderer/appstate";
import { FileSystemService } from "./main/services/filesystem-service";
import { ContextMenuService } from "./main/services/contextmenu-service";

import { ExtensionRPCService } from "./extension/services/extension-rpc-service";

declare global {
  interface Window {
    previewInteractor: PreviewInteractor;
    pluginSideInteractor: PluginSideInteractor;

    preference: Preference;
    stateStore: MainRendererStateStore;
  }

  interface Realm {
    safeWrite: <T>(callback: () => T) => T;
    paperEntityListened: boolean;
    tagsListened: boolean;
    foldersListened: boolean;
    smartfilterListened: boolean;
    feedEntityListened: boolean;
    feedListened: boolean;
  }

  var PLAPI: APIShape;
  var PLMainAPI: MainAPIShape;
}
