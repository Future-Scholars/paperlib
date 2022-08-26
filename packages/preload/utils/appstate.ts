import { randomUUID } from "crypto";
import { ipcRenderer } from "electron";
import { Preference } from "./preference";

export class State {
  value: string | number | boolean;
  id: string;
  checkDuplicated: boolean;
  publishChannel: BroadcastChannel;

  constructor(value: string | number | boolean, checkDuplicated = true) {
    this.value = value;
    this.id = randomUUID();
    this.checkDuplicated = checkDuplicated;
    this.publishChannel = new BroadcastChannel(this.id);
  }

  get() {
    return this.value;
  }

  set(value: string | number | boolean, publish = true) {
    if (value === this.value && this.checkDuplicated) {
      return;
    }
    this.value = value;
    if (publish) {
      this.publishChannel.postMessage(value);
    }
  }
}

export class SharedState {
  viewState: Record<string, State>;
  selectionState: Record<string, State>;
  sharedData: Record<string, State>;
  dbState: Record<string, State>;

  constructor(preference: Preference) {
    this.viewState = {
      processingQueueCount: new State(0, false),
      entitiesCount: new State(0),
      feedEntitiesCount: new State(0),

      sortBy: new State(preference.get("mainviewSortBy") as string),
      sortOrder: new State(preference.get("mainviewSortOrder") as string),
      searchText: new State(""),
      searchMode: new State("general"),

      isModalShown: new State(false),
      isEditViewShown: new State(false),
      isPreferenceViewShown: new State(false),
      isFeedEditViewShown: new State(false),

      preferenceUpdated: new State(`${Date.now()}`),
      realmReinited: new State(`${Date.now()}`),
      storageBackendReinited: new State(`${Date.now()}`),

      alertInformation: new State("", false),
      infoInformation: new State("", false),
      processInformation: new State("", false),

      viewType: new State(preference.get("mainviewType") as string),
      contentType: new State("library"),
      theme: new State("light"),

      renderRequired: new State(`${Date.now()}`),

      syncFileStorageAvaliable: new State(false),
    };

    // Selection State
    this.selectionState = {
      selectedIndex: new State(""),
      selectedIds: new State(""),
      selectedCategorizer: new State(""),
      selectedFeed: new State("feed-all"),
      dragedIds: new State(""),
      pluginLinkedFolder: new State(
        preference.get("pluginLinkedFolder") as string
      ),
    };

    // Shared Data
    this.sharedData = {
      editEntityDraft: new State(""),
      editFeedDraft: new State(""),
    };

    // DB State
    this.dbState = {
      entitiesUpdated: new State(`${Date.now()}`),
      tagsUpdated: new State(`${Date.now()}`),
      foldersUpdated: new State(`${Date.now()}`),
      feedsUpdated: new State(`${Date.now()}`),
      feedEntitiesUpdated: new State(`${Date.now()}`),
      defaultPath: new State(ipcRenderer.sendSync("userData")),
    };
  }

  get(dest: string) {
    const state = getObj(this, dest) as State;
    return state;
  }

  set(dest: string, value: any, publish = true) {
    const state = getObj(this, dest) as State;
    state.set(value, publish);
  }

  register(dest: string, callback: (value: any) => void) {
    const state = this.get(dest);
    const channel = new BroadcastChannel(state.id);
    channel.addEventListener("message", (event) => {
      callback(event.data);
    });
  }
}

export class PluginSharedState {
  selectionState: Record<string, State>;

  constructor(preference: Preference) {
    this.selectionState = {
      pluginLinkedFolder: new State(
        preference.get("pluginLinkedFolder") as string
      ),
    };
  }

  get(dest: string) {
    const state = getObj(this, dest) as State;
    return state;
  }

  set(dest: string, value: any, publish = true) {
    const state = getObj(this, dest) as State;
    state.set(value, publish);
  }

  register(dest: string, callback: (value: any) => void) {
    const state = this.get(dest);
    const channel = new BroadcastChannel(state.id);
    channel.addEventListener("message", (event) => {
      callback(event.data);
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getObj(obj: any, dest: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return dest.split(".").reduce((a, b) => a[b], obj);
}
