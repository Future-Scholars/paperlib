<script setup lang="ts">
import "splitpanes/dist/splitpanes.css";
import {
  inject,
  nextTick,
  onBeforeMount,
  onMounted,
  provide,
  Ref,
  ref,
  watch,
} from "vue";

import SidebarView from "./sidebar-view/sidebar-view.vue";
import MainView from "./main-view/main-view.vue";

import { MainRendererStateStore } from "@/state/renderer/appstate";
import { PaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import { CategorizerResults } from "@/repositories/db-repository/categorizer-repository";
import { removeLoading } from "@/preload/loading";

// ================================
// State
// ================================

const viewState = MainRendererStateStore.useViewState();
const dbState = MainRendererStateStore.useDBState();

// ================================
// Data
// ================================
const paperEntities: Ref<PaperEntityResults> = ref([]);
provide("paperEntities", paperEntities);
const tags: Ref<CategorizerResults> = ref([]);
provide("tags", tags);
const folders: Ref<CategorizerResults> = ref([]);
provide("folders", folders);

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
  paperEntities.value = [];
  paperEntities.value = await window.entityInteractor.loadPaperEntities();
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
    viewState.sidebarSortBy,
    viewState.sidebarSortOrder
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
    viewState.sidebarSortBy,
    viewState.sidebarSortOrder
  );
};
watch(
  () => dbState.foldersUpdated,
  (value) => reloadFolders()
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
    await reloadPaperEntities();
    await reloadTags();
    await reloadFolders();
    removeLoading();
  });
});
</script>

<style></style>

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
  </div>
</template>
