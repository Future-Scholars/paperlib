<script setup lang="ts">
import { onMounted, Ref, ref } from "vue";

import { PaperCategorizer } from "packages/preload/models/PaperCategorizer";
import { PaperEntity } from "packages/preload/models/PaperEntity";

import SidebarView from "./sidebar-view/sidebar-view.vue";
import MainView from "./main-view/main-view.vue";
import EditView from "./edit-view/edit-view.vue";

const sortBy = ref("addTime");
const sortOrder = ref("desc");

const entities: Ref<PaperEntity[]> = ref([]);
const tags: Ref<PaperCategorizer[]> = ref([]);
const folders: Ref<PaperCategorizer[]> = ref([]);

const searchText = ref("");
const selectedCategorizer = ref("lib-all");
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
// State Update
window.appInteractor.registerState("dbState.entitiesUpdated", (value) => {
  void reloadEntities();
});

window.appInteractor.registerState("dbState.tagsUpdated", (value) => {
  void reloadTags();
});

window.appInteractor.registerState("dbState.foldersUpdated", (value) => {
  void reloadFolders();
});

// =======================================
onMounted(async () => {
  await reloadTags();
  await reloadFolders();
  await reloadEntities();
});
</script>

<template>
  <div class="flex text-neutral-700">
    <SidebarView :tags="tags" :folders="folders" />
    <MainView :entities="entities" />
  </div>
  <EditView class="text-neutral-700" />
</template>
