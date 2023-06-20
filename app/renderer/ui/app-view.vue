<script setup lang="ts">
import "splitpanes/dist/splitpanes.css";
import { Ref, computed, nextTick, onMounted, provide, ref, watch } from "vue";

import { disposable } from "@/base/dispose";
import { removeLoading } from "@/preload/loading";
import { CategorizerResults } from "@/repositories/db-repository/categorizer-repository";
import { FeedEntityResults } from "@/repositories/db-repository/feed-entity-repository";
import { FeedResults } from "@/repositories/db-repository/feed-repository";
import { IPaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import { PaperSmartFilterResults } from "@/repositories/db-repository/smartfilter-repository";
import { LogService } from "@/services/log-service";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import DeleteConfirmView from "./delete-confirm-view/delete-confirm-view.vue";
import EditView from "./edit-view/edit-view.vue";
import FeedEditView from "./edit-view/feed-edit-view.vue";
import PaperSmartFilterEditView from "./edit-view/smartfilter-edit-view.vue";
import MainView from "./main-view/main-view.vue";
import PreferenceView from "./preference-view/preference-view.vue";
import PresettingView from "./presetting-view/presetting-view.vue";
import SidebarView from "./sidebar-view/sidebar-view.vue";
import WhatsNewView from "./whats-new-view/whats-new-view.vue";

// ================================
// State
// ================================

const viewState = MainRendererStateStore.useViewState();
const dbState = MainRendererStateStore.useDBState();
const selectionState = MainRendererStateStore.useSelectionState();
const prefState = preferenceService.useState();

// ================================
// Data
// ================================
const paperEntities: Ref<IPaperEntityResults> = ref([]);
provide(
  "paperEntities",
  computed(() => paperEntities.value) // TODO: ?
);
const tags: Ref<CategorizerResults> = ref([]);
provide("tags", tags);
const folders: Ref<CategorizerResults> = ref([]);
provide("folders", folders);
const smartfilters: Ref<PaperSmartFilterResults> = ref([]);
provide("smartfilters", smartfilters);
const feeds: Ref<FeedResults> = ref([]);
provide("feeds", feeds);
const feedEntities: Ref<FeedEntityResults> = ref([]);
provide(
  "feedEntities",
  computed(() => feedEntities.value)
);

// ================================
// UI
// ================================

const onSidebarResized = (event: any) => {
  const width = event[0].size ? event[0].size : 20;
  preferenceService.set({ sidebarWidth: width });
};

// ================================
// Data load
// ================================
const reloadPaperEntities = async () => {
  let flaged = false;

  let tag = "";
  let folder = "";
  if (selectionState.selectedCategorizer.startsWith("tag-")) {
    tag = selectionState.selectedCategorizer.replace("tag-", "");
    viewState.searchText = "";
    viewState.searchMode = "general";
  } else if (selectionState.selectedCategorizer.startsWith("folder-")) {
    folder = selectionState.selectedCategorizer.replace("folder-", "");
    viewState.searchText = "";
    viewState.searchMode = "general";
  } else if (selectionState.selectedCategorizer === "lib-flaged") {
    flaged = true;
    viewState.searchText = "";
    viewState.searchMode = "general";
  }
  // TODO: fix any here
  paperEntities.value = await paperService.load(
    paperService.constructFilter({
      search: viewState.searchText,
      searchMode: viewState.searchMode as any,
      flaged,
      tag,
      folder,
    }),
    prefState.mainviewSortBy,
    prefState.mainviewSortOrder
  );
};

disposable(
  paperService.on("updated", () => {
    reloadPaperEntities();
  })
);

const reloadTags = async () => {
  tags.value = await categorizerService.load(
    "PaperTag",
    prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
};
disposable(categorizerService.on("tagsUpdated", () => reloadTags()));

const reloadFolders = async () => {
  folders.value = await categorizerService.load(
    "PaperFolder",
    prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
};
disposable(categorizerService.on("foldersUpdated", () => reloadFolders()));

const reloadPaperSmartFilters = async () => {
  smartfilters.value = await smartFilterService.load(
    "PaperPaperSmartFilter",
    prefState.sidebarSortBy === "count" ? "name" : prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
};
disposable(smartFilterService.on("updated", () => reloadPaperSmartFilters()));

const reloadFeeds = async () => {
  const results = await feedService.load(
    prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
  feeds.value = results;
};
disposable(feedService.on("updated", () => reloadFeeds()));

const reloadFeedEntities = async () => {
  let feed = "";
  let unread = false;

  if (selectionState.selectedFeed === "feed-all") {
    feed = "";
  } else if (selectionState.selectedFeed === "feed-unread") {
    unread = true;
    feed = "";
  } else {
    feed = selectionState.selectedFeed.replace("feed-", "");
  }

  // TODO: fix any here
  feedEntities.value = await feedService.loadEntities(
    feedService.constructFilter({
      search: viewState.searchText,
      searchMode: viewState.searchMode as any,
      feedName: feed,
      unread,
    }),
    prefState.mainviewSortBy,
    prefState.mainviewSortOrder
  );
};
disposable(feedService.on("entitiesUpdated", () => reloadFeedEntities()));

// ================================
// Register State
// ================================
disposable(
  preferenceService.onChanged(
    ["mainviewSortBy", "mainviewSortOrder"],
    (value) => {
      if (viewState.contentType === "library") {
        reloadPaperEntities();
      } else if (viewState.contentType === "feed") {
        reloadFeedEntities();
      }
    }
  )
);
disposable(
  preferenceService.onChanged(
    ["sidebarSortBy", "sidebarSortOrder"],
    (value) => {
      reloadTags();
      reloadFolders();
      reloadPaperSmartFilters();
    }
  )
);

watch(
  () =>
    viewState.contentType +
    viewState.searchText +
    selectionState.selectedCategorizer +
    selectionState.selectedFeed,
  (value) => {
    if (viewState.contentType === "library") {
      reloadPaperEntities();
    } else if (viewState.contentType === "feed") {
      reloadFeedEntities();
    }
  }
);

disposable(
  databaseService.on("dbInitialized", async () => {
    selectionState.selectedCategorizer = "";
    selectionState.selectedFeed = "";
    selectionState.selectedIds = [];
    selectionState.selectedIndex = [];
    selectionState.dragedIds = [];
    selectionState.pluginLinkedFolder = "";
    selectionState.editingCategorizer = "";
    paperEntities.value = [];
    tags.value = [];
    folders.value = [];
    feeds.value = [];
    feedEntities.value = [];
    var startTime = Date.now();
    await reloadPaperEntities();
    await reloadTags();
    await reloadFolders();
    await reloadPaperSmartFilters();
    removeLoading();
    reloadFeedEntities();
    reloadFeeds();
    var endTime = Date.now();
    logService.info(
      `Data reinited in ${endTime - startTime}ms`,
      "",
      false,
      "UI"
    );
  })
);

window.appInteractor.registerMainSignal("window-lost-focus", (_: any) => {
  viewState.mainViewFocused = false;
  databaseService.pauseSync();
});

window.appInteractor.registerMainSignal("window-gained-focus", (_) => {
  viewState.mainViewFocused = true;
  databaseService.resumeSync();
});

window.appInteractor.registerMainSignal("update-download-progress", (value) => {
  window.logger.progress("Downloading Update...", value, true, "Version");
});

// ================================
// Dev Functions
// ================================
const addDummyData = async () => {
  await paperService.addDummyData();
};
const addTestData = async () => {
  await paperService.create([`${process.cwd()}/tests/pdfs/cs/1.pdf`]);
};
const addTwoTestData = async () => {
  await paperService.create([
    `${process.cwd()}/tests/pdfs/cs/1.pdf`,
    `${process.cwd()}/tests/pdfs/cs/2.pdf`,
  ]);
};
const removeAll = async () => {
  await paperService.removeAll();
};
const reloadAll = async () => {
  await reloadPaperEntities();
  await reloadTags();
  await reloadFolders();
  await reloadPaperSmartFilters();
};
const log = () => {
  console.log("paperEntities ========");
  for (let i = 0; i < Math.min(10, paperEntities.value.length); i++) {
    console.log(paperEntities.value[i]);
  }

  console.log("tags ========");
  for (let i = 0; i < Math.min(10, tags.value.length); i++) {
    console.log(tags.value[i]);
  }

  console.log("folders ========");
  for (let i = 0; i < Math.min(10, folders.value.length); i++) {
    console.log(folders.value[i]);
  }
};
const logInfo = () => {
  const randomString = Math.random().toString(36).slice(-8);
  logService.info(randomString, "additional info", true, "DEVLOG");
};
const logWarn = () => {
  const randomString = Math.random().toString(36).slice(-8);
  logService.warn(randomString, "additional info", true, "DEVLOG");
};
const logError = () => {
  const randomString = Math.random().toString(36).slice(-8);
  logService.error(randomString, "additional info", true, "DEVLOG");
};
const logProgress = () => {
  const randomNumber = Math.floor(Math.random() * 100);
  logService.progress("Progress...", randomNumber, true, "DEVLOG");
};

const isWhatsNewShown = ref(false);

// ================================
// Mount Hook
// ================================
onMounted(async () => {
  nextTick(async () => {
    isWhatsNewShown.value = await appService.isVersionChanged();
    await databaseService.initialize(true);
  });
});
</script>

<template>
  <div class="flex text-neutral-700 dark:text-neutral-200">
    <div
      id="dev-btn-bar"
      class="space-x-2 fixed right-0 bottom-0 text-xs hidden"
    >
      <button
        class="bg-neutral-400 dark:bg-neutral-700 p-1 rounded-md"
        @click="reloadAll"
      >
        Reload all
      </button>
      <button
        class="bg-neutral-400 dark:bg-neutral-700 p-1 rounded-md"
        @click="addDummyData"
      >
        Add dummy
      </button>
      <button
        id="dev-add-test-data-btn"
        class="bg-neutral-400 dark:bg-neutral-700 p-1 rounded-md"
        @click="addTestData"
      >
        Add test
      </button>
      <button
        id="dev-add-two-test-data-btn"
        class="bg-neutral-400 dark:bg-neutral-700 p-1 rounded-md"
        @click="addTwoTestData"
      >
        Add two test
      </button>
      <button
        id="dev-delete-all-btn"
        class="bg-neutral-400 dark:bg-neutral-700 p-1 rounded-md"
        @click="removeAll"
      >
        Remove all
      </button>
      <button
        class="bg-neutral-400 dark:bg-neutral-700 p-1 rounded-md"
        @click="log"
      >
        Log
      </button>
      <button
        class="bg-neutral-400 dark:bg-neutral-700 p-1 rounded-md"
        @click="logInfo"
      >
        Notify Info
      </button>
      <button
        class="bg-neutral-400 dark:bg-neutral-700 p-1 rounded-md"
        @click="logWarn"
      >
        Notify Warn
      </button>
      <button
        class="bg-neutral-400 dark:bg-neutral-700 p-1 rounded-md"
        @click="logError"
      >
        Notify Error
      </button>
      <button
        class="bg-neutral-400 dark:bg-neutral-700 p-1 rounded-md"
        @click="logProgress"
      >
        Notify Progress
      </button>
    </div>
    <splitpanes @resized="onSidebarResized($event)">
      <pane :key="1" min-size="12" :size="prefState.sidebarWidth">
        <SidebarView class="sidebar-windows-bg" />
      </pane>
      <pane :key="2">
        <MainView />
      </pane>
    </splitpanes>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <EditView v-if="viewState.isEditViewShown" />
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <FeedEditView v-if="viewState.isFeedEditViewShown" />
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <PaperSmartFilterEditView
        v-if="viewState.isPaperSmartFilterEditViewShown"
      />
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <PreferenceView v-if="viewState.isPreferenceViewShown" />
    </Transition>

    <DeleteConfirmView />

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <PresettingView
        v-if="
          prefState.showPresettingLang ||
          prefState.showPresettingScraper ||
          prefState.showPresettingDB
        "
      />
    </Transition>
    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <WhatsNewView v-if="isWhatsNewShown" />
    </Transition>
  </div>
</template>
@/renderer/services/log-service
