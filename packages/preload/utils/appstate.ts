import { randomUUID } from "crypto";
import { ipcRenderer } from "electron";

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

  set(value: string | number | boolean) {
    if (value === this.value && this.checkDuplicated) {
      return;
    }
    this.value = value;
    this.publishChannel.postMessage(value);
  }
}

export class SharedState {
  viewState: Record<string, State>;
  selectionState: Record<string, State>;
  sharedData: Record<string, State>;
  dbState: Record<string, State>;

  constructor() {
    this.viewState = {
      processingQueueCount: new State(0, false),
      entitiesCount: new State(0),

      sortBy: new State("addTime"),
      sortOrder: new State("desc"),
      searchText: new State(""),
      searchMode: new State("general"),

      isModalShown: new State(false),
      isEditViewShown: new State(false),
      isPreferenceViewShown: new State(false),

      preferenceUpdated: new State(`${Date.now()}`),
      realmReinited: new State(`${Date.now()}`),
      storageBackendReinited: new State(`${Date.now()}`),

      alertInformation: new State("", false),
      processInformation: new State("", false),

      viewType: new State("list"),
      theme: new State("light"),

      syncFileStorageAvaliable: new State(false),
    };

    // Selection State
    this.selectionState = {
      selectedIndex: new State(""),
      selectedCategorizer: new State(""),
    };

    // Shared Data
    this.sharedData = {
      editEntityDraft: new State(""),
    };

    // DB State
    this.dbState = {
      entitiesUpdated: new State(`${Date.now()}`),
      tagsUpdated: new State(`${Date.now()}`),
      foldersUpdated: new State(`${Date.now()}`),
      defaultPath: new State(ipcRenderer.sendSync("userData")),
    };
  }

  get(dest: string) {
    const state = getObj(this, dest) as State;
    return state;
  }

  set(dest: string, value: any) {
    const state = getObj(this, dest) as State;
    state.set(value);
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
