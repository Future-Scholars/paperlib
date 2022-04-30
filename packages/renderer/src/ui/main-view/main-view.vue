<script setup lang="ts">
import { ref, Ref } from "vue";

import { PaperEntity } from "../../../../preload/models/PaperEntity";
import { PaperEntityDraft } from "../../../../preload/models/PaperEntityDraft";

import WindowMenuBar from "./menubar-view/window-menu-bar.vue";
import DataView from "./data-view/data-view.vue";
import DetailView from "./detail-view/detail-view.vue";

import { createModalView } from "../components/modal-view";

const props = defineProps({
  entities: Array as () => PaperEntity[],
});

const sortBy = ref("addTime");
const sortOrder = ref("desc");
const selectedIndex: Ref<number[]> = ref([]);
const selectedEntities: Ref<PaperEntity[]> = ref([]);

const reloadSelectedEntities = () => {
  selectedEntities.value = [];
  selectedIndex.value.forEach((index) => {
    selectedEntities.value.push(props.entities![index]);
  });
};

const clearSelected = () => {
  selectedIndex.value = [];
  selectedEntities.value = [];
  window.appInteractor.setState(
    "selectionState.selectedIndex",
    JSON.stringify(selectedIndex.value)
  );
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

const switchViewType = (viewType: string) => {
  window.appInteractor.setState("viewState.viewType", JSON.stringify(viewType));
};

const switchSortBy = (key: string) => {
  window.appInteractor.setState("viewState.sortBy", JSON.stringify(key));
};

const switchSortOrder = (order: string) => {
  window.appInteractor.setState("viewState.sortOrder", JSON.stringify(order));
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
    case "list-view":
      switchViewType("list");
      break;
    case "table-view":
      switchViewType("table");
      break;
    case "sort-by-title":
    case "sort-by-authors":
    case "sort-by-addTime":
    case "sort-by-publication":
    case "sort-by-pubTime":
      switchSortBy(command.replaceAll("sort-by-", ""));
      break;
    case "sort-order-asce":
    case "sort-order-desc":
      switchSortOrder(command.replaceAll("sort-order-", ""));
      break;
    case "preference":
      window.appInteractor.setState("viewState.isPreferenceViewShown", "true");
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

window.appInteractor.registerState("viewState.sortBy", (value) => {
  sortBy.value = JSON.parse(value as string) as string;
  clearSelected();
});

window.appInteractor.registerState("viewState.sortOrder", (value) => {
  sortOrder.value = JSON.parse(value as string) as string;
  clearSelected();
});

window.appInteractor.registerState("viewState.searchText", (value) => {
  clearSelected();
});

window.appInteractor.registerState(
  "selectionState.selectedCategorizer",
  (value) => {
    clearSelected();
  }
);
</script>

<template>
  <div class="grow flex flex-col w-full h-screen bg-white">
    <WindowMenuBar
      class="flex-none"
      @click="onMenuButtonClicked"
      :sortBy="sortBy"
      :sortOrder="sortOrder"
      :disableSingleBtn="selectedEntities.length !== 1"
      :disableMultiBtn="selectedEntities.length === 0"
    />
  </div>
</template>
