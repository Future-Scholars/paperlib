<script setup lang="ts">
import { onMounted, Ref, ref } from "vue";

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
  const results = await window.entityInteractor.loadCategorizers("PaperTag");
  tags.value = results;
};

const reloadFolders = async () => {
  const results = await window.entityInteractor.loadCategorizers("PaperFolder");
  folders.value = results;
};

// =======================================
// Preferences
const reloadPreference = () => {
  preference.value = window.appInteractor.loadPreferences();
  showSidebarCount.value = preference.value.showSidebarCount;
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
    () => {
      window.appInteractor.setState("viewState.isModalShown", false);
    }
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
onMounted(async () => {
  await reloadTags();
  await reloadFolders();
  await reloadEntities();
  reloadPreference();
});
</script>

<template>
  <div class="flex text-neutral-700">
    <SidebarView
      :tags="tags"
      :folders="folders"
      :showSidebarCount="showSidebarCount"
    />
    <MainView :entities="entities" />
  </div>
  <EditView class="text-neutral-700" :tags="tags" :folders="folders" />
  <PreferenceView :preference="preference" />
</template>
