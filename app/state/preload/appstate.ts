import { ObjectId } from "bson";

import { State } from "./state";
import { Preference } from "../../preference/preference";

export class PreloadStateStore {
  commChannel: BroadcastChannel;
  preference: Preference;

  registerHandler: Record<string, (value: any) => void>;

  logState: Record<string, State>;
  viewState: Record<string, State>;
  dbState: Record<string, State>;
  selectionState: Record<string, State>;

  constructor(preference: Preference) {
    const electron = require("electron");
    this.commChannel = new BroadcastChannel("state-store");
    this.preference = preference;

    this.registerHandler = {};

    this.logState = {
      processLog: new State("logState.processLog", "", this.commChannel, false),
      alertLog: new State("logState.alertLog", "", this.commChannel, false),
      infoLog: new State("logState.infoLog", "", this.commChannel, false),
    };
    this.viewState = {
      isModalShown: new State(
        "viewState.isModalShown",
        false,
        this.commChannel
      ),
      isEditViewShown: new State(
        "viewState.isEditViewShown",
        false,
        this.commChannel
      ),
      isPreferenceViewShown: new State(
        "viewState.isPreferenceViewShown",
        false,
        this.commChannel
      ),
      isFeedEditViewShown: new State(
        "viewState.isFeedEditViewShown",
        false,
        this.commChannel
      ),

      processingQueueCount: new State(
        "viewState.processingQueueCount",
        0,
        this.commChannel,
        false
      ),
      entitiesCount: new State("viewState.entitiesCount", 0, this.commChannel),
      feedEntitiesCount: new State(
        "viewState.feedEntitiesCount",
        0,
        this.commChannel
      ),

      sortBy: new State(
        "viewState.sortBy",
        preference.get("mainviewSortBy") as string,
        this.commChannel
      ),
      sortOrder: new State(
        "viewState.sortOrder",
        preference.get("mainviewSortOrder") as string,
        this.commChannel
      ),
      viewType: new State(
        "viewState.viewType",
        preference.get("mainviewType") as string,
        this.commChannel
      ),
      contentType: new State(
        "viewState.contentType",
        "library",
        this.commChannel
      ),
      searchText: new State("viewState.searchText", "", this.commChannel),
      searchMode: new State(
        "viewState.searchMode",
        "general",
        this.commChannel
      ),

      sidebarWidth: new State(
        "viewState.sidebarWidth",
        preference.get("sidebarWidth") as string,
        this.commChannel
      ),
      sidebarSortBy: new State(
        "viewState.sidebarSortBy",
        preference.get("sidebarSortBy") as string,
        this.commChannel
      ),
      sidebarSortOrder: new State(
        "viewState.sidebarSortOrder",
        preference.get("sidebarSortOrder") as string,
        this.commChannel
      ),

      preferenceUpdated: new State(
        "viewState.preferenceUpdated",
        Date.now(),
        this.commChannel
      ),
      realmReinited: new State(
        "viewState.realmReinited",
        Date.now(),
        this.commChannel
      ),
      storageBackendReinited: new State(
        "viewState.storageBackendReinited",
        Date.now(),
        this.commChannel
      ),
      renderRequired: new State(
        "viewState.renderRequired",
        Date.now(),
        this.commChannel
      ),

      syncFileStorageAvaliable: new State(
        "viewState.syncFileStorageAvaliable",
        false,
        this.commChannel
      ),
    };
    this.dbState = {
      entitiesUpdated: new State(
        "dbState.entitiesUpdated",
        Date.now(),
        this.commChannel
      ),
      tagsUpdated: new State(
        "dbState.tagsUpdated",
        Date.now(),
        this.commChannel
      ),
      foldersUpdated: new State(
        "dbState.foldersUpdated",
        Date.now(),
        this.commChannel
      ),
      feedsUpdated: new State(
        "dbState.feedsUpdated",
        Date.now(),
        this.commChannel
      ),
      feedEntitiesUpdated: new State(
        "dbState.feedEntitiesUpdated",
        Date.now(),
        this.commChannel
      ),

      defaultPath: new State(
        "dbState.defaultPath",
        electron.ipcRenderer.sendSync("userData"),
        this.commChannel
      ),
    };
    this.selectionState = {
      selectedIndex: new State(
        "selectionState.selectedIndex",
        [] as number[],
        this.commChannel
      ),
      selectedIds: new State(
        "selectionState.selectedIds",
        [] as (string | ObjectId)[],
        this.commChannel
      ),
      selectedCategorizer: new State(
        "selectionState.selectedCategorizer",
        "lib-all",
        this.commChannel
      ),
      selectedFeed: new State(
        "selectionState.selectedFeed",
        "feed-all",
        this.commChannel
      ),
      dragedIds: new State(
        "selectionState.dragedIds",
        [] as (string | ObjectId)[],
        this.commChannel
      ),
      pluginLinkedFolder: new State(
        "selectionState.pluginLinkedFolder",
        "",
        this.commChannel
      ),
      editingCategorizer: new State(
        "selectionState.editingCategorizer",
        "",
        this.commChannel
      ),
    };

    this.commChannel.onmessage = (event) => {
      const { op, key, value } = event.data;
      if (op === "init") {
        for (const storeKey in getObj(this, key)) {
          this.commChannel.postMessage({
            key: `${key}.${storeKey}`,
            value: JSON.stringify(getObj(this, key)[storeKey].value),
          });
        }
      } else if (op === "update") {
        getObj(this, key).value_ = JSON.parse(value);
        if (this.registerHandler[key]) {
          this.registerHandler[key](JSON.parse(value));
        }
      }
    };
  }

  register(key: string, callback: (value: any) => void) {
    this.registerHandler[key] = callback;
  }
}

export class PluginPreloadStateStore {
  commChannel: BroadcastChannel;
  preference: Preference;

  registerHandler: Record<string, (value: any) => void>;

  selectionState: Record<string, State>;

  constructor(preference: Preference) {
    this.commChannel = new BroadcastChannel("plugin-state-store");
    this.preference = preference;

    this.registerHandler = {};

    this.selectionState = {
      pluginLinkedFolder: new State(
        "selectionState.pluginLinkedFolder",
        "",
        this.commChannel
      ),
    };

    this.commChannel.onmessage = (event) => {
      const { op, key, value } = event.data;
      if (op === "init") {
        for (const storeKey in getObj(this, key)) {
          this.commChannel.postMessage({
            key: `${key}.${storeKey}`,
            value: JSON.stringify(getObj(this, key)[storeKey].value),
          });
        }
      } else if (op === "update") {
        getObj(this, key).value_ = JSON.parse(value);
        if (this.registerHandler[key]) {
          this.registerHandler[key](JSON.parse(value));
        }
      }
    };
  }

  register(key: string, callback: (value: any) => void) {
    this.registerHandler[key] = callback;
  }
}

export function getObj(obj: any, dest: string) {
  return dest.split(".").reduce((a, b) => a[b], obj);
}
