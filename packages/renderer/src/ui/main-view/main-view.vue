<script setup lang="ts">
import { ref, Ref, createApp } from "vue";

import { PaperEntity } from "../../../../preload/models/PaperEntity";
import { PaperEntityDraft } from "../../../../preload/models/PaperEntityDraft";

import WindowMenuBar from "./components/window-menu-bar.vue";
import ListView from "./data-view/list-view.vue";
import DetailView from "./detail-view/detail-view.vue";

import { createModalView } from "../components/modal-view";

const props = defineProps({
  entities: Array as () => PaperEntity[],
});

const selectedIndex: Ref<number[]> = ref([]);
const selectedEntities: Ref<PaperEntity[]> = ref([]);

const reloadSelectedEntities = () => {
  selectedEntities.value = [];
  selectedIndex.value.forEach((index) => {
    selectedEntities.value.push(props.entities![index]);
  });
};

const scrapeSelectedEntities = () => {
  const entityDrafts = selectedEntities.value.map((entity) => {
    const entityDraft = new PaperEntityDraft();
    entityDraft.initialize(entity);
    return entityDraft;
  });
  void window.entityInteractor.scrape(JSON.stringify(entityDrafts));
};

const deleteSelectedEntities = () => {
  createModalView(
    "Delete",
    `Are you sure to delete ${selectedEntities.value.length} paper(s)?`,
    () => {
      const ids = selectedEntities.value.map((entity) => entity._id as string);
      window.appInteractor.setState(
        "selectionState.selectedIndex",
        JSON.stringify([])
      );
      void window.entityInteractor.delete(ids);
      window.appInteractor.setState("viewState.isModalShown", "false");
    },
    () => {
      window.appInteractor.setState("viewState.isModalShown", "false");
    }
  );
};

const editSelectedEntities = () => {
  const entityDraft = new PaperEntityDraft();
  entityDraft.initialize(selectedEntities.value[0]);
  window.appInteractor.setState(
    "sharedData.editEntityDraft",
    JSON.stringify(entityDraft)
  );
  window.appInteractor.setState(
    "viewState.isEditViewShown",
    JSON.stringify(true)
  );
};

const flagSelectedEntities = () => {
  const entityDrafts = selectedEntities.value.map((entity) => {
    const entityDraft = new PaperEntityDraft();
    entityDraft.initialize(entity);
    entityDraft.flag = !entityDraft.flag;
    return entityDraft;
  });
  void window.entityInteractor.update(JSON.stringify(entityDrafts));
};

const tagSelectedEntities = () => {
  const entityDraft = new PaperEntityDraft();
  entityDraft.initialize(selectedEntities.value[0]);
  window.appInteractor.setState(
    "sharedData.editEntityDraft",
    JSON.stringify(entityDraft)
  );
  window.appInteractor.setState(
    "viewState.isTagViewShown",
    JSON.stringify(true)
  );
};

const folderSelectedEntities = () => {
  const entityDraft = new PaperEntityDraft();
  entityDraft.initialize(selectedEntities.value[0]);
  window.appInteractor.setState(
    "sharedData.editEntityDraft",
    JSON.stringify(entityDraft)
  );
  window.appInteractor.setState(
    "viewState.isFolderViewShown",
    JSON.stringify(true)
  );
};

const noteSelectedEntities = () => {
  const entityDraft = new PaperEntityDraft();
  entityDraft.initialize(selectedEntities.value[0]);
  window.appInteractor.setState(
    "sharedData.editEntityDraft",
    JSON.stringify(entityDraft)
  );
  window.appInteractor.setState(
    "viewState.isNoteViewShown",
    JSON.stringify(true)
  );
};

const onMenuButtonClicked = (command: string) => {
  switch (command) {
    case "rescrape":
      scrapeSelectedEntities();
      break;
    case "delete":
      deleteSelectedEntities();
      break;
    case "edit":
      editSelectedEntities();
      break;
    case "flag":
      flagSelectedEntities();
      break;
    case "tag":
      tagSelectedEntities();
      break;
    case "folder":
      folderSelectedEntities();
      break;
    case "note":
      noteSelectedEntities();
      break;
  }
};

// =======================================
// Register state change
window.appInteractor.registerState("selectionState.selectedIndex", (value) => {
  selectedIndex.value = JSON.parse(value as string) as number[];
  reloadSelectedEntities();
});

window.appInteractor.registerState("dbState.entitiesUpdated", (value) => {
  reloadSelectedEntities();
});
</script>

<template>
  <div class="grow flex flex-col h-screen bg-white">
    <WindowMenuBar class="flex-none" @click="onMenuButtonClicked" />

    <div class="grow flex divide-x">
      <ListView :entities="entities" />
      <DetailView
        :entity="selectedEntities[0]"
        v-if="selectedEntities.length === 1"
      />
    </div>
  </div>
</template>
