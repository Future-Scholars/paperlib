import { ObjectId } from "bson";
import { Pinia, Store, defineStore } from "pinia";

import { Feed } from "@/models/feed";
import { PaperEntity } from "@/models/paper-entity";
import {
  Preference,
  PreferenceStore,
  defaultPreferences,
} from "@/preference/preference";

import {
  BufferState,
  DBState,
  LogState,
  PluginSelectionState,
  PreviewViewState,
  SelectionState,
  ViewState,
} from "../states";

export class RendererStateStore {
  constructor() { }
}

export class MainRendererStateStore extends RendererStateStore {
  logState: Store<string, LogState>;
  viewState: Store<string, ViewState>;
  bufferState: Store<string, BufferState>;
  dbState: Store<string, DBState>;
  selectionState: Store<string, SelectionState>;
  preferenceState: Store<string, PreferenceStore>;

  constructor(preference: Preference, pinia?: Pinia) {
    super();

    this.logState = MainRendererStateStore.useLogState(pinia);
    this.viewState = MainRendererStateStore.useViewState(pinia);
    this.bufferState = MainRendererStateStore.useBufferState(pinia);
    this.dbState = MainRendererStateStore.useDBState(pinia);
    this.selectionState = MainRendererStateStore.useSelectionState(pinia);

    // Bind prefence to the state
    this.preferenceState = MainRendererStateStore.usePreferenceState(pinia);
    this.preferenceState.$patch(
      JSON.parse(JSON.stringify(preference.store.store))
    );
  }

  static useLogState = defineStore("logState", {
    state: () => {
      return {
        processLog: "",
        alertLog: "",
        infoLog: "",
        progressLog: {
          id: "",
          value: 0,
          msg: "",
        },
      };
    },
  });

  static useViewState = defineStore("viewState", {
    state: () => {
      return {
        os: process.platform,

        // View Shown
        isDeleteConfirmShown: false,
        isEditViewShown: false,
        isPreferenceViewShown: false,
        isFeedEditViewShown: false,

        // Count
        processingQueueCount: 0,
        entitiesCount: 0,
        feedEntitiesCount: 0,

        // Mainview
        viewType: "list",
        contentType: "library",
        searchText: "",
        searchMode: "general",
        feedEntityAddingStatus: 0,
        detailsOnDragging: false,

        //
        inputFieldFocused: false,

        // Sidebar
        sidebarWidth: 20,

        // Update Signal
        realmReiniting: 0,
        realmReinited: 0,
        scraperReinited: 0,
        downloaderReinited: 0,
        storageBackendReinited: 0,
        renderRequired: 0,

        //
        syncFileStorageAvaliable: false,
      };
    },
  });

  static useBufferState = defineStore("bufferState", {
    state: () => {
      return {
        editingPaperEntityDraft: new PaperEntity(false),
        editingFeedDraft: new Feed(false),
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

  static usePreferenceState = defineStore("preferenceState", {
    state: () => {
      return defaultPreferences;
    },
  });
}

export class PluginRendererStateStore extends RendererStateStore {
  selectionState: Store<string, PluginSelectionState>;

  constructor() {
    super();
    this.selectionState = PluginRendererStateStore.useSelectionState();
  }

  static useSelectionState = defineStore("selectionState", {
    state: () => {
      return {
        pluginLinkedFolder: "",
      };
    },
  });
}

export class PreviewRendererStateStore extends RendererStateStore {
  viewState: Store<string, PreviewViewState>;

  constructor(pinia?: Pinia) {
    super();
    this.viewState = PreviewRendererStateStore.useViewState(pinia);
  }

  static useViewState = defineStore("viewState", {
    state: () => {
      return {
        isRendering: true,
      };
    },
  });
}
