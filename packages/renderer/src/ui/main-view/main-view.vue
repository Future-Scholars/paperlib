<script setup lang="ts">
import { ref, Ref } from "vue";

import {
  PaperEntity,
  PaperEntityPlaceholder,
} from "../../../../preload/models/PaperEntity";
import { PaperEntityDraft } from "../../../../preload/models/PaperEntityDraft";

import WindowMenuBar from "./menubar-view/window-menu-bar.vue";
import DataView from "./data-view/data-view.vue";
import DetailView from "./detail-view/detail-view.vue";

import { createModalView } from "../components/modal-view";

const props = defineProps({
  entities: Array as () => PaperEntity[],
  showMainYear: Boolean,
  showMainPublication: Boolean,
  showMainPubType: Boolean,
  showMainRating: Boolean,
  showMainFlag: Boolean,
  showMainTags: Boolean,
  showMainFolders: Boolean,
  showMainNote: Boolean,
});

const sortBy = ref("addTime");
const sortOrder = ref("desc");
const selectedIndex: Ref<number[]> = ref([]);
const selectedEntities: Ref<PaperEntity[]> = ref([]);

const openSelectedEntities = () => {
  selectedEntities.value.forEach((entity) => {
    window.appInteractor.open(entity.mainURL);
  });
};

const showInFinderSelectedEntities = () => {
  selectedEntities.value.forEach((entity) => {
    window.appInteractor.showInFinder(entity.mainURL);
  });
};

const previewSelectedEntities = () => {
  window.appInteractor.preview(selectedEntities.value[0].mainURL);
};

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

const scrapeSelectedEntitiesFrom = (scraperName: string) => {
  const entityDrafts = selectedEntities.value.map((entity) => {
    const entityDraft = new PaperEntityDraft();
    entityDraft.initialize(entity);
    return entityDraft;
  });
  void window.entityInteractor.scrapeFrom(
    JSON.stringify(entityDrafts),
    scraperName
  );
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
      window.appInteractor.setState("viewState.isModalShown", false);
    },
    () => {
      window.appInteractor.setState("viewState.isModalShown", false);
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
  window.appInteractor.setState("viewState.isEditViewShown", true);
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

const exportSelectedEntities = (format: string) => {
  window.entityInteractor.export(
    JSON.stringify(selectedEntities.value),
    format
  );
};

const switchViewType = (viewType: string) => {
  window.appInteractor.setState("viewState.viewType", viewType);
};

const switchSortBy = (key: string) => {
  window.appInteractor.setState("viewState.sortBy", key);
};

const switchSortOrder = (order: string) => {
  window.appInteractor.setState("viewState.sortOrder", order);
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
      window.appInteractor.setState("viewState.isPreferenceViewShown", true);
      break;
  }
};

// ========================================================
// Register Context Menu

window.appInteractor.registerMainSignal("data-context-menu-edit", () => {
  editSelectedEntities();
});

window.appInteractor.registerMainSignal("data-context-menu-flag", () => {
  flagSelectedEntities();
});

window.appInteractor.registerMainSignal("data-context-menu-delete", () => {
  deleteSelectedEntities();
});

window.appInteractor.registerMainSignal("data-context-menu-scrape", () => {
  scrapeSelectedEntities();
});

window.appInteractor.registerMainSignal(
  "data-context-menu-scrape-from",
  (args) => {
    scrapeSelectedEntitiesFrom(args[0]);
  }
);

window.appInteractor.registerMainSignal("data-context-menu-open", () => {
  openSelectedEntities();
});

window.appInteractor.registerMainSignal(
  "data-context-menu-showinfinder",
  () => {
    showInFinderSelectedEntities();
  }
);

window.appInteractor.registerMainSignal(
  "data-context-menu-export-bibtex",
  () => {
    exportSelectedEntities("bibtex");
  }
);

window.appInteractor.registerMainSignal(
  "data-context-menu-export-plain",
  () => {
    exportSelectedEntities("plain");
  }
);

// ========================================================
// Register Shortcut
window.appInteractor.registerMainSignal("shortcut-Preference", () => {
  window.appInteractor.setState("viewState.isPreferenceViewShown", true);
});

window.appInteractor.registerMainSignal("shortcut-Enter", () => {
  if (
    selectedEntities.value.length >= 1 &&
    !window.appInteractor.getState("viewState.isModalShown") &&
    !window.appInteractor.getState("viewState.isEditViewShown") &&
    !window.appInteractor.getState("viewState.isPreferenceViewShown")
  ) {
    openSelectedEntities();
  }
});

window.appInteractor.registerMainSignal("shortcut-Space", () => {
  if (
    selectedEntities.value.length >= 1 &&
    !window.appInteractor.getState("viewState.isModalShown") &&
    !window.appInteractor.getState("viewState.isEditViewShown") &&
    !window.appInteractor.getState("viewState.isPreferenceViewShown")
  ) {
    previewSelectedEntities();
  }
});
function preventSpaceArrowScrollEvent(event: KeyboardEvent) {
  if (
    event.code === "Space" ||
    event.code === "ArrowDown" ||
    event.code === "ArrowUp"
  ) {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return true;
    }
    if (event.target == document.body) {
      event.preventDefault();
    }

    if (event.code === "ArrowDown") {
      const currentIndex = selectedIndex.value[0] || 0;
      const newIndex =
        currentIndex + 1 >
        (window.appInteractor.getState("viewState.entitiesCount") as number) - 1
          ? currentIndex
          : currentIndex + 1;
      window.appInteractor.setState(
        "selectionState.selectedIndex",
        JSON.stringify([newIndex])
      );
    }

    if (event.code === "ArrowUp") {
      const currentIndex = selectedIndex.value[0] || 0;
      const newIndex = currentIndex - 1 < 0 ? 0 : currentIndex - 1;
      window.appInteractor.setState(
        "selectionState.selectedIndex",
        JSON.stringify([newIndex])
      );
    }

    if (event.code === "Space" && selectedEntities.value.length >= 1) {
      previewSelectedEntities();
    }
  }
}
window.addEventListener("keydown", preventSpaceArrowScrollEvent, true);

window.appInteractor.registerMainSignal("shortcut-cmd-shift-c", () => {
  if (selectedEntities.value.length >= 1) {
    exportSelectedEntities("bibtex");
  }
});

window.appInteractor.registerMainSignal("shortcut-cmd-e", () => {
  if (selectedEntities.value.length == 1) {
    editSelectedEntities();
  }
});

window.appInteractor.registerMainSignal("shortcut-cmd-f", () => {
  if (selectedEntities.value.length >= 1) {
    flagSelectedEntities();
  }
});

window.appInteractor.registerMainSignal("shortcut-cmd-r", () => {
  if (selectedEntities.value.length >= 1) {
    scrapeSelectedEntities();
  }
});

window.appInteractor.registerMainSignal("shortcut-arrow-up", () => {
  const currentIndex = selectedIndex.value[0] || 0;
  const newIndex = currentIndex - 1 < 0 ? 0 : currentIndex - 1;
  if (
    !window.appInteractor.getState("viewState.isEditViewShown") &&
    !window.appInteractor.getState("viewState.isPreferenceViewShown")
  ) {
    window.appInteractor.setState(
      "selectionState.selectedIndex",
      JSON.stringify([newIndex])
    );
  }
});

window.appInteractor.registerMainSignal("shortcut-arrow-down", () => {
  const currentIndex = selectedIndex.value[0] || 0;
  const newIndex =
    currentIndex + 1 >
    (window.appInteractor.getState("viewState.entitiesCount") as number) - 1
      ? currentIndex
      : currentIndex + 1;
  if (
    !window.appInteractor.getState("viewState.isEditViewShown") &&
    !window.appInteractor.getState("viewState.isPreferenceViewShown")
  ) {
    window.appInteractor.setState(
      "selectionState.selectedIndex",
      JSON.stringify([newIndex])
    );
  }
});

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
  sortBy.value = value as string;
  clearSelected();
});

window.appInteractor.registerState("viewState.sortOrder", (value) => {
  sortOrder.value = value as string;
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
  <div class="grow flex flex-col h-screen bg-white dark:bg-neutral-800">
    <WindowMenuBar
      class="flex-none"
      @click="onMenuButtonClicked"
      :sortBy="sortBy"
      :sortOrder="sortOrder"
      :disableSingleBtn="selectedEntities.length !== 1"
      :disableMultiBtn="selectedEntities.length === 0"
    />

    <div class="grow flex divide-x dark:divide-neutral-700">
      <DataView
        :entities="entities"
        :sortBy="sortBy"
        :sortOrder="sortOrder"
        :show-main-year="showMainYear"
        :show-main-publication="showMainPublication"
        :show-main-pub-type="showMainPubType"
        :show-main-flag="showMainFlag"
        :show-main-tags="showMainTags"
        :show-main-folders="showMainFolders"
        :show-main-rating="showMainRating"
        :show-main-note="showMainNote"
      />
      <DetailView
        :entity="
          selectedEntities.length === 1
            ? selectedEntities[0]
            : PaperEntityPlaceholder
        "
        v-show="selectedEntities.length === 1"
      />
    </div>
  </div>
</template>
