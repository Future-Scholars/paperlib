<script setup lang="ts">
import "splitpanes/dist/splitpanes.css";
import { nextTick, onBeforeMount, onMounted, Ref, ref } from "vue";

import { PaperCategorizer } from "../../../preload/models/PaperCategorizer";
import { PaperEntity } from "../../../preload/models/PaperEntity";
import { Feed } from "../../../preload/models/Feed";
import { FeedEntity } from "../../../preload/models/FeedEntity";

import SidebarView from "./sidebar-view/sidebar-view.vue";
import MainView from "./main-view/main-view.vue";
import EditView from "./edit-view/edit-view.vue";
import PreferenceView from "./preference-view/preference-view.vue";
import FeedEditView from "./edit-view/feed-edit-view.vue";
import ModalView from "./modal-view.vue";

import { PreferenceStore } from "../../../preload/utils/preference";

const sortBy = ref(window.appInteractor.getState("viewState.sortBy") as string);
const sortOrder = ref(
  window.appInteractor.getState("viewState.sortOrder") as string
);
const contentType = ref("library");

const entities: Ref<PaperEntity[]> = ref([]);
const tags: Ref<PaperCategorizer[]> = ref([]);
const folders: Ref<PaperCategorizer[]> = ref([]);
const feeds: Ref<Feed[]> = ref([]);
const feedEntities: Ref<FeedEntity[]> = ref([]);

const searchText = ref("");
const selectedCategorizer = ref("lib-all");
const selectedFeed = ref("feed-all");

const preference: Ref<PreferenceStore> = ref(
  window.appInteractor.loadPreferences()
);
const showSidebarCount = ref(false);
const isSidebarCompact = ref(false);

const showMainYear = ref(true);
const showMainPublication = ref(true);
const showMainPubType = ref(false);
const showMainRating = ref(false);
const showMainFlag = ref(true);
const showMainTags = ref(false);
const showMainFolders = ref(false);
const showMainNote = ref(false);

const sidebarSortBy = ref("name");
const sidebarSortOrder = ref("asce");

const sidebarWidth = ref(20);

const onSidebarResized = (event: any) => {
  const width = event[0].size ? event[0].size : 20;
  window.appInteractor.updatePreference("sidebarWidth", width);
};

// =======================================
// Data
const reloadEntities = async () => {
  let flaged = false;
  let tag = "";
  let folder = "";
  if (selectedCategorizer.value.startsWith("tag-")) {
    tag = selectedCategorizer.value.replace("tag-", "");
  } else if (selectedCategorizer.value.startsWith("folder-")) {
    folder = selectedCategorizer.value.replace("folder-", "");
  } else if (selectedCategorizer.value === "lib-flaged") {
    flaged = true;
  }
  const results = await window.entityInteractor.loadEntities(
    searchText.value,
    flaged,
    tag,
    folder,
    sortBy.value,
    sortOrder.value
  );
  entities.value = results;
};

const reloadTags = async () => {
  const results = await window.entityInteractor.loadCategorizers(
    "PaperTag",
    sidebarSortBy.value,
    sidebarSortOrder.value
  );
  tags.value = results;
};

const reloadFolders = async () => {
  const results = await window.entityInteractor.loadCategorizers(
    "PaperFolder",
    sidebarSortBy.value,
    sidebarSortOrder.value
  );
  folders.value = results;
};

const reloadFeeds = async () => {
  const results = await window.feedInteractor.loadFeeds(
    sidebarSortBy.value,
    sidebarSortOrder.value
  );
  feeds.value = results;
};

const reloadFeedEntities = async () => {
  let selectedFeedName;
  let unread = false;
  if (selectedFeed.value === "feed-all") {
    selectedFeedName = "";
  } else if (selectedFeed.value === "feed-unread") {
    unread = true;
    selectedFeedName = "";
  } else {
    selectedFeedName = selectedFeed.value.replace("feed-", "");
  }
  const results = await window.feedInteractor.loadFeedEntities(
    searchText.value,
    selectedFeedName,
    unread,
    sortBy.value,
    sortOrder.value
  );
  feedEntities.value = results;
};

const onShowModal = () => {
  window.appInteractor.setState("viewState.isModalShown", true);
};

const onDeleteSelected = () => {
  const ids = JSON.parse(
    window.appInteractor.getState("selectionState.selectedIds") as string
  );
  window.appInteractor.setState(
    "selectionState.selectedIndex",
    JSON.stringify([])
  );
  void window.entityInteractor.delete(ids);
  window.appInteractor.setState("viewState.isModalShown", false);
};

// =======================================
// Preferences
const reloadPreference = () => {
  preference.value = window.appInteractor.loadPreferences();
  showSidebarCount.value = preference.value.showSidebarCount;
  isSidebarCompact.value = preference.value.isSidebarCompact;

  showMainYear.value = preference.value.showMainYear;
  showMainPublication.value = preference.value.showMainPublication;
  showMainPubType.value = preference.value.showMainPubType;
  showMainRating.value = preference.value.showMainRating;
  showMainFlag.value = preference.value.showMainFlag;
  showMainTags.value = preference.value.showMainTags;
  showMainFolders.value = preference.value.showMainFolders;
  showMainNote.value = preference.value.showMainNote;

  if (
    sidebarSortBy.value !== preference.value.sidebarSortBy ||
    sidebarSortOrder.value !== preference.value.sidebarSortOrder
  ) {
    sidebarSortBy.value = preference.value.sidebarSortBy;
    sidebarSortOrder.value = preference.value.sidebarSortOrder;
    reloadTags();
    reloadFolders();
    reloadFeeds();
  }
};

const setupTheme = () => {
  window.appInteractor.changeTheme(preference.value.preferedTheme);
};

// =======================================
// State Update

window.appInteractor.registerState("dbState.entitiesUpdated", (value) => {
  reloadEntities();
});

window.appInteractor.registerState("dbState.tagsUpdated", (value) => {
  reloadTags();
});

window.appInteractor.registerState("dbState.foldersUpdated", (value) => {
  reloadFolders();
});

window.appInteractor.registerState("dbState.feedsUpdated", (value) => {
  reloadFeeds();
});

window.appInteractor.registerState("dbState.feedEntitiesUpdated", (value) => {
  reloadFeedEntities();
});

window.appInteractor.registerState("viewState.sortBy", (value) => {
  sortBy.value = value as string;
  if (contentType.value === "library") {
    reloadEntities();
  } else if (contentType.value === "feed") {
    reloadFeedEntities();
  }
});

window.appInteractor.registerState("viewState.sortOrder", (value) => {
  sortOrder.value = value as string;
  if (contentType.value === "library") {
    reloadEntities();
  } else if (contentType.value === "feed") {
    reloadFeedEntities();
  }
});

window.appInteractor.registerState("viewState.contentType", (value) => {
  contentType.value = value as string;

  if (contentType.value === "library") {
    reloadEntities();
  } else if (contentType.value === "feed") {
    reloadFeedEntities();
  }
});

window.appInteractor.registerState("viewState.searchText", (value) => {
  searchText.value = value as string;
  if (contentType.value === "library") {
    reloadEntities();
  } else if (contentType.value === "feed") {
    reloadFeedEntities();
  }
});

window.appInteractor.registerState(
  "selectionState.selectedCategorizer",
  (value) => {
    selectedCategorizer.value = value as string;
    reloadEntities();
  }
);

window.appInteractor.registerState("selectionState.selectedFeed", (value) => {
  selectedFeed.value = value as string;
  reloadFeedEntities();
});

window.appInteractor.registerState("viewState.preferenceUpdated", (value) => {
  reloadPreference();
});

window.appInteractor.registerState("viewState.realmReinited", (value) => {
  (async () => {
    if (contentType.value === "library") {
      reloadEntities();
    } else if (contentType.value === "feed") {
      reloadFeedEntities();
    }
    await reloadTags();
    await reloadFolders();
    await reloadFeeds();
    reloadPreference();
  })();
});

window.appInteractor.registerMainSignal("window-lost-focus", (_: any) => {
  void window.appInteractor.pauseSync();
});

window.appInteractor.registerMainSignal("window-gained-focus", (_) => {
  void window.appInteractor.resumeSync();
});

// =======================================
onBeforeMount(async () => {
  reloadPreference();
  setupTheme();
  sidebarWidth.value = window.appInteractor.getPreference(
    "sidebarWidth"
  ) as number;
});
onMounted(async () => {
  await reloadTags();
  await reloadFolders();
  await reloadEntities();
  await reloadFeeds();

  nextTick(() => {
    console.log("Remove loading...");
    const oStyle = document.getElementById(
      "app-loading-style"
    ) as HTMLStyleElement;
    const oDiv = document.getElementById("app-loading-wrap") as HTMLDivElement;

    document.head.appendChild(oStyle);
    document.body.removeChild(oDiv);
  });
});
</script>

<style>
.splitpanes--vertical > .splitpanes__splitter {
  min-width: 2px;
}
</style>

<template>
  <div class="flex text-neutral-700 dark:text-neutral-200">
    <splitpanes @resized="onSidebarResized($event)">
      <pane :key="1" min-size="12" :size="sidebarWidth">
        <SidebarView
          class="sidebar-windows-bg"
          :tags="tags"
          :folders="folders"
          :feeds="feeds"
          :showSidebarCount="showSidebarCount"
          :compact="isSidebarCompact"
      /></pane>
      <pane :key="2">
        <MainView
          :entities="entities"
          :feedEntities="feedEntities"
          :show-main-year="showMainYear"
          :show-main-publication="showMainPublication"
          :show-main-pub-type="showMainPubType"
          :show-main-flag="showMainFlag"
          :show-main-tags="showMainTags"
          :show-main-folders="showMainFolders"
          :show-main-rating="showMainRating"
          :show-main-note="showMainNote"
          @delete="onShowModal"
        />
      </pane>
    </splitpanes>
  </div>
  <EditView class="text-neutral-700" :tags="tags" :folders="folders" />
  <FeedEditView class="text-neutral-700" />
  <PreferenceView :preference="preference" />
  <ModalView
    title="Confirmation"
    info="Are you sure to delete?"
    :cancel-btn="true"
    :ok-btn="true"
    @confirm="onDeleteSelected"
  />
</template>
