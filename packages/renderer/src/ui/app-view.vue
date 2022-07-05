<script setup lang="ts">
import "splitpanes/dist/splitpanes.css";
import { nextTick, onBeforeMount, onMounted, Ref, ref } from "vue";

import { PaperCategorizer } from "../../../preload/models/PaperCategorizer";
import { PaperEntity } from "../../../preload/models/PaperEntity";

import SidebarView from "./sidebar-view/sidebar-view.vue";
import MainView from "./main-view/main-view.vue";
import EditView from "./edit-view/edit-view.vue";
import PreferenceView from "./preference-view/preference-view.vue";
import { PreferenceStore } from "../../../preload/utils/preference";
import { createModalView } from "./components/modal-view";

const sortBy = ref("addTime");
const sortOrder = ref("desc");

const entities: Ref<PaperEntity[]> = ref([]);
const tags: Ref<PaperCategorizer[]> = ref([]);
const folders: Ref<PaperCategorizer[]> = ref([]);

const searchText = ref("");
const selectedCategorizer = ref("lib-all");

const preference: Ref<PreferenceStore> = ref(
  window.appInteractor.loadPreferences()
);
const showSidebarCount = ref(false);
const isSidebarCompact = ref(false);

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

// =======================================
// Preferences
const reloadPreference = () => {
  preference.value = window.appInteractor.loadPreferences();
  showSidebarCount.value = preference.value.showSidebarCount;
  isSidebarCompact.value = preference.value.isSidebarCompact;

  if (
    sidebarSortBy.value !== preference.value.sidebarSortBy ||
    sidebarSortOrder.value !== preference.value.sidebarSortOrder
  ) {
    sidebarSortBy.value = preference.value.sidebarSortBy;
    sidebarSortOrder.value = preference.value.sidebarSortOrder;
    reloadTags();
    reloadFolders();
  }
};

const setupTheme = () => {
  window.appInteractor.changeTheme(preference.value.preferedTheme);
};

// =======================================
// State Update

window.appInteractor.registerState("viewState.alertInformation", (value) => {
  createModalView(
    "Warning",
    value as string,
    () => {
      window.appInteractor.setState("viewState.isModalShown", false);
    },
    null
  );
});

window.appInteractor.registerState("viewState.infoInformation", (value) => {
  createModalView(
    "Paperlib",
    value as string,
    () => {
      window.appInteractor.setState("viewState.isModalShown", false);
    },
    null
  );
});

window.appInteractor.registerState("dbState.entitiesUpdated", (value) => {
  reloadEntities();
});

window.appInteractor.registerState("dbState.tagsUpdated", (value) => {
  reloadTags();
});

window.appInteractor.registerState("dbState.foldersUpdated", (value) => {
  reloadFolders();
});

window.appInteractor.registerState("viewState.sortBy", (value) => {
  sortBy.value = value as string;
  reloadEntities();
});

window.appInteractor.registerState("viewState.sortOrder", (value) => {
  sortOrder.value = value as string;
  reloadEntities();
});

window.appInteractor.registerState("viewState.searchText", (value) => {
  searchText.value = value as string;
  reloadEntities();
});

window.appInteractor.registerState(
  "selectionState.selectedCategorizer",
  (value) => {
    selectedCategorizer.value = value as string;
    reloadEntities();
  }
);

window.appInteractor.registerState("viewState.preferenceUpdated", (value) => {
  reloadPreference();
});

window.appInteractor.registerState("viewState.realmReinited", (value) => {
  (async () => {
    await reloadEntities();
    await reloadTags();
    await reloadFolders();
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
          :showSidebarCount="showSidebarCount"
          :compact="isSidebarCompact"
      /></pane>
      <pane :key="2">
        <MainView :entities="entities" />
      </pane>
    </splitpanes>
  </div>
  <EditView class="text-neutral-700" :tags="tags" :folders="folders" />
  <PreferenceView :preference="preference" />
</template>
