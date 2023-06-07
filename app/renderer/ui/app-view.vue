<script setup lang="ts">
import "splitpanes/dist/splitpanes.css";
import { Ref, computed, nextTick, onMounted, provide, ref, watch } from "vue";

import { removeLoading } from "@/preload/loading";
import { CategorizerResults } from "@/repositories/db-repository/categorizer-repository";
import { FeedEntityResults } from "@/repositories/db-repository/feed-entity-repository";
import { FeedResults } from "@/repositories/db-repository/feed-repository";
import { PaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import { PaperSmartFilterResults } from "@/repositories/db-repository/smartfilter-repository";
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
const prefState = MainRendererStateStore.usePreferenceState();
const logState = MainRendererStateStore.useLogState();

// ================================
// Data
// ================================
const paperEntities: Ref<PaperEntityResults> = ref([]);
provide(
  "paperEntities",
  computed(() => paperEntities.value)
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
  window.appInteractor.setPreference("sidebarWidth", width);
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
  paperEntities.value = await window.entityInteractor.loadPaperEntities(
    viewState.searchText,
    flaged,
    tag,
    folder,
    prefState.mainviewSortBy,
    prefState.mainviewSortOrder
  );
};
watch(
  () => dbState.entitiesUpdated,
  (value) => reloadPaperEntities()
);

const reloadTags = async () => {
  tags.value = await window.entityInteractor.loadCategorizers(
    "PaperTag",
    prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
};
watch(
  () => dbState.tagsUpdated,
  (value) => reloadTags()
);

const reloadFolders = async () => {
  folders.value = await window.entityInteractor.loadCategorizers(
    "PaperFolder",
    prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
};
watch(
  () => dbState.foldersUpdated,
  (value) => reloadFolders()
);

const reloadPaperSmartFilters = async () => {
  smartfilters.value = await window.entityInteractor.loadPaperSmartFilters(
    "PaperPaperSmartFilter",
    prefState.sidebarSortBy === "count" ? "name" : prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
};
watch(
  () => dbState.smartfiltersUpdated,
  (value) => reloadPaperSmartFilters()
);

const reloadFeeds = async () => {
  const results = await window.feedInteractor.loadFeeds(
    prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
  feeds.value = results;
};
watch(
  () => dbState.feedsUpdated,
  (value) => reloadFeeds()
);

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
  feedEntities.value = await window.feedInteractor.loadFeedEntities(
    viewState.searchText,
    feed,
    unread,
    prefState.mainviewSortBy,
    prefState.mainviewSortOrder
  );
};
watch(
  () => dbState.feedEntitiesUpdated,
  (value) => reloadFeedEntities()
);

// ================================
// Register State
// ================================
watch(
  () =>
    prefState.mainviewSortBy +
    prefState.mainviewSortOrder +
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

watch(
  () => prefState.sidebarSortBy + prefState.sidebarSortOrder,
  (value) => {
    reloadTags();
    reloadFolders();
    reloadPaperSmartFilters();
  }
);

watch(
  () => viewState.realmReiniting,
  (value) => {
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

    window.appInteractor.initDB();
  }
);

watch(
  () => viewState.realmReinited,
  async (value) => {
    var startTime = Date.now();
    await reloadPaperEntities();
    await reloadTags();
    await reloadFolders();
    await reloadPaperSmartFilters();
    removeLoading();
    reloadFeedEntities();
    reloadFeeds();
    var endTime = Date.now();
    window.logger.info(
      `Data reinited in ${endTime - startTime}ms`,
      "",
      false,
      "Data"
    );
  }
);

window.appInteractor.registerMainSignal("window-lost-focus", (_: any) => {
  viewState.mainViewFocused = false;
  void window.appInteractor.pauseSync();
});

window.appInteractor.registerMainSignal("window-gained-focus", (_) => {
  viewState.mainViewFocused = true;
  void window.appInteractor.resumeSync();
});

window.appInteractor.registerMainSignal("update-download-progress", (value) => {
  window.logger.progress("Downloading Update...", value, true, "Version");
});

// ================================
// Dev Functions
// ================================
const addDummyData = async () => {
  await window.entityInteractor.addDummyData();
};
const addTestData = async () => {
  await window.entityInteractor.create([
    `${process.cwd()}/tests/pdfs/cs/1.pdf`,
  ]);
};
const addTwoTestData = async () => {
  await window.entityInteractor.create([
    `${process.cwd()}/tests/pdfs/cs/1.pdf`,
    `${process.cwd()}/tests/pdfs/cs/2.pdf`,
  ]);
};
const removeAll = async () => {
  await window.entityInteractor.removeAll();
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
  window.logger.info(randomString, "additional info", true, "DEVLOG");
};
const logWarn = () => {
  const randomString = Math.random().toString(36).slice(-8);
  window.logger.warn(randomString, "additional info", true, "DEVLOG");
};
const logError = () => {
  const randomString = Math.random().toString(36).slice(-8);
  window.logger.error(randomString, "additional info", true, "DEVLOG");
};
const logProgress = () => {
  const randomNumber = Math.floor(Math.random() * 100);
  window.logger.progress("Progress...", randomNumber, true, "DEVLOG");
};

// ================================
// Mount Hook
// ================================
onMounted(async () => {
  nextTick(async () => {
    window.appInteractor.initDB();
  });
});
</script>

<template>
  <div class="flex text-neutral-700 dark:text-neutral-200">
    <div id="dev-btn-bar" class="space-x-2 fixed right-0 bottom-0 text-xs">
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
    <EditView />
    <FeedEditView />
    <PaperSmartFilterEditView />
    <PreferenceView />
    <DeleteConfirmView />
    <PresettingView />
    <WhatsNewView />
  </div>
</template>
