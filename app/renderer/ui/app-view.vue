<script setup lang="ts">
import "splitpanes/dist/splitpanes.css";
import {
  Ref,
  computed,
  nextTick,
  onBeforeMount,
  onMounted,
  provide,
  ref,
  watch,
} from "vue";

import { removeLoading } from "@/preload/loading";
import { CategorizerResults } from "@/repositories/db-repository/categorizer-repository";
import { FeedEntityResults } from "@/repositories/db-repository/feed-entity-repository";
import { FeedResults } from "@/repositories/db-repository/feed-repository";
import { PaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import DeleteConfirmView from "./delete-confirm-view/delete-confirm-view.vue";
import EditView from "./edit-view/edit-view.vue";
import FeedEditView from "./edit-view/feed-edit-view.vue";
import MainView from "./main-view/main-view.vue";
import PreferenceView from "./preference-view/preference-view.vue";
import SidebarView from "./sidebar-view/sidebar-view.vue";

// ================================
// State
// ================================

const viewState = MainRendererStateStore.useViewState();
const dbState = MainRendererStateStore.useDBState();
const selectionState = MainRendererStateStore.useSelectionState();
const prefState = MainRendererStateStore.usePreferenceState();

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
  console.log("Reload paper entities...");
  let flaged = false;

  let tag = "";
  let folder = "";
  if (selectionState.selectedCategorizer.startsWith("tag-")) {
    tag = selectionState.selectedCategorizer.replace("tag-", "");
  } else if (selectionState.selectedCategorizer.startsWith("folder-")) {
    folder = selectionState.selectedCategorizer.replace("folder-", "");
  } else if (selectionState.selectedCategorizer === "lib-flaged") {
    flaged = true;
  }
  paperEntities.value = await window.entityInteractor.loadPaperEntities(
    viewState.searchText,
    flaged,
    tag,
    folder,
    prefState.mainviewSortBy,
    prefState.mainviewSortOrder
  );
  console.log(`Paper entities (${paperEntities.value.length}) loaded!`);
};
watch(
  () => dbState.entitiesUpdated,
  (value) => reloadPaperEntities()
);

const reloadTags = async () => {
  console.log("Reload tags...");
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
  console.log("Reload folders...");
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

const reloadFeeds = async () => {
  console.log("Reload feeds...");
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
  console.log("Reload feed entities...");
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
    // TODO: clear more

    paperEntities.value = [];
    tags.value = [];
    folders.value = [];

    window.appInteractor.initDB();
  }
);

watch(
  () => viewState.realmReinited,
  async (value) => {
    console.time("Reload Data");
    await reloadPaperEntities();
    await reloadTags();
    await reloadFolders();
    removeLoading();
    reloadFeedEntities();
    reloadFeeds();
    console.timeEnd("Reload Data");
  }
);

// ================================
// Dev Functions
// ================================
const addDummyData = async () => {
  await window.entityInteractor.addDummyData();
};
const removeAll = async () => {
  await window.entityInteractor.removeAll();
};
const reloadAll = async () => {
  await reloadPaperEntities();
  await reloadTags();
  await reloadFolders();
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
    <div class="flex space-x-2 fixed left-24 text-xs">
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
    </div>
    <splitpanes @resized="onSidebarResized($event)">
      <pane :key="1" min-size="12" :size="viewState.sidebarWidth">
        <SidebarView class="sidebar-windows-bg" />
      </pane>
      <pane :key="2">
        <MainView />
      </pane>
    </splitpanes>
    <EditView />
    <FeedEditView />
    <PreferenceView />
    <DeleteConfirmView />
  </div>
</template>
