import { defineStore, Pinia, Store } from "pinia";
import { ObjectId } from "bson";

import { watch } from "vue";

import { LogState, DBState, ViewState } from "../states";

export class RendererStateStore {
  commChannel: BroadcastChannel;
  subscriptions: Record<string, { value: any; send: boolean }>;

  constructor() {
    this.commChannel = new BroadcastChannel("state-store");

    this.subscriptions = {};

    this.commChannel.onmessage = (event) => {
      const { key, value } = event.data as { key: string; value: any };
      const [storeKey, stateKey] = key.split(".");

      try {
        let obj: Record<string, any> = {};
        obj[stateKey as keyof typeof obj] = JSON.parse(value);
        this.subscriptions[`${storeKey}.${stateKey}`].value = obj[stateKey];
        this.subscriptions[`${storeKey}.${stateKey}`].send = false;
        // @ts-ignore
        this[storeKey].$patch(obj);
      } catch (e) {
        console.error(value, e);
      }
    };
  }

  subscribe(store: Store) {
    for (const key in store.$state) {
      this.subscriptions[`${store.$id}.${key}`] = {
        // @ts-ignore
        value: store.$state[key],
        send: true,
      };

      watch(
        // @ts-ignore
        () => store.$state[key],
        (newValue) => {
          if (
            this.subscriptions[`${store.$id}.${key}`].send ||
            newValue !== this.subscriptions[`${store.$id}.${key}`].value
          ) {
            this.commChannel.postMessage({
              op: "update",
              key: `${store.$id}.${key}`,
              // @ts-ignore
              value: JSON.stringify(newValue),
            });
            this.subscriptions[`${store.$id}.${key}`].value = newValue;
            this.subscriptions[`${store.$id}.${key}`].send = true;
          }
        }
      );
    }
  }

  initFromPreload(store: Store) {
    try {
      // @ts-ignore
      this.commChannel.postMessage({
        op: "init",
        key: store.$id,
        value: "",
      });
    } catch (e) {
      console.error(e);
    }
  }
}

export class MainRendererStateStore extends RendererStateStore {
  logState: Store<string, LogState>;
  viewState: Store<string, ViewState>;
  dbState: Store<string, DBState>;
  selectionState: Store;

  constructor(pinia?: Pinia) {
    super();

    this.logState = MainRendererStateStore.useLogState(pinia);
    this.viewState = MainRendererStateStore.useViewState(pinia);
    this.dbState = MainRendererStateStore.useDBState(pinia);
    this.selectionState = MainRendererStateStore.useSelectionState(pinia);

    this.subscribe(this.logState);
    this.subscribe(this.viewState);
    this.subscribe(this.dbState);
    this.subscribe(this.selectionState);

    this.initFromPreload(this.viewState);
    this.initFromPreload(this.dbState);
  }

  static useLogState = defineStore("logState", {
    state: () => {
      return {
        processLog: "",
        alertLog: "",
        infoLog: "",
      };
    },
  });

  static useViewState = defineStore("viewState", {
    state: () => {
      return {
        // View Shown
        isModalShown: false,
        isEditViewShown: false,
        isPreferenceViewShown: false,
        isFeedEditViewShown: false,

        // Count
        processingQueueCount: 0,
        entitiesCount: 0,
        feedEntitiesCount: 0,

        // Mainview
        sortBy: "addTime",
        sortOrder: "desc",
        viewType: "list",
        contentType: "library",
        searchText: "",
        searchMode: "general",

        // Sidebar
        sidebarWidth: 20,
        sidebarSortBy: "name",
        sidebarSortOrder: "desc",

        // Update Signal
        preferenceUpdated: 0,
        realmReinited: 0,
        storageBackendReinited: 0,
        renderRequired: 0,

        //
        syncFileStorageAvaliable: false,
      };
    },
  });

  static useDBState = defineStore("dbState", {
    state: () => {
      return {
        entitiesUpdated: 0,
        tagsUpdated: 0,
        foldersUpdated: 0,
        feedsUpdated: 0,
        feedEntitiesUpdated: 0,
        defaultPath: "",
      };
    },
  });

  static useSelectionState = defineStore("selectionState", {
    state: () => {
      return {
        selectedIndex: [] as number[],
        selectedIds: [] as (string | ObjectId)[],
        selectedCategorizer: "lib-all",
        selectedFeed: "feed-all",
        dragedIds: [] as (string | ObjectId)[],
        pluginLinkedFolder: "",
        editingCategorizer: "",
      };
    },
  });
}

export class PluginRendererStateStore extends RendererStateStore {
  selectionState: Store;

  constructor() {
    super();
    this.selectionState = PluginRendererStateStore.useSelectionState();

    this.subscribe(this.selectionState);
  }

  static useSelectionState = defineStore("selectionState", {
    state: () => {
      return {
        selectedIndex: [] as number[],
        selectedIds: [] as (string | ObjectId)[],
        selectedCategorizer: "lib-all",
        selectedFeed: "feed-all",
        dragedIds: [] as (string | ObjectId)[],
        pluginLinkedFolder: "",
        editingCategorizer: "",
      };
    },
  });
}
