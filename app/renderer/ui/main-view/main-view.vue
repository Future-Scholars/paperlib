<script setup lang="ts">
import { Ref, inject, ref, watch } from "vue";

import { FeedEntity } from "@/models/feed-entity";
import { PaperEntity } from "@/models/paper-entity";
import { FeedEntityResults } from "@/repositories/db-repository/feed-entity-repository";
import { PaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import FeedDataView from "./data-view/feed-data-view.vue";
import PaperDataView from "./data-view/paper-data-view.vue";
import FeedDetailView from "./detail-view/feed-detail-view.vue";
import PaperDetailView from "./detail-view/paper-detail-view.vue";
import WindowMenuBar from "./menubar-view/window-menu-bar.vue";

// ================================
// State
// ================================
const viewState = MainRendererStateStore.useViewState();
const selectionState = MainRendererStateStore.useSelectionState();
const bufferState = MainRendererStateStore.useBufferState();
const prefState = MainRendererStateStore.usePreferenceState();

// ================================
// Data
// ================================
const selectedEntityPlaceHolder = ref(new PaperEntity(false));
const selectedFeedEntityPlaceHolder = ref(new FeedEntity(false));

const paperEntities = inject<Ref<PaperEntityResults>>("paperEntities");
const feedEntities = inject<Ref<FeedEntityResults>>("feedEntities");

const selectedPaperEntities = ref<Array<PaperEntity>>([]);
const selectedFeedEntities = ref<Array<FeedEntity>>([]);

// ================================
// Event Handlers
// ================================
const openSelectedEntities = () => {
  if (viewState.contentType === "library") {
    selectedPaperEntities.value.forEach((paperEntity) => {
      window.appInteractor.open(paperEntity.mainURL);
    });
  } else {
    selectedFeedEntities.value.forEach((entity) => {
      window.appInteractor.open(entity.mainURL);
    });
  }
};

const showInFinderSelectedEntities = () => {
  if (viewState.contentType === "library") {
    selectedPaperEntities.value.forEach((paperEentity) => {
      window.appInteractor.showInFinder(paperEentity.mainURL);
    });
  }
};

const previewSelectedEntities = () => {
  if (viewState.contentType === "library") {
    window.appInteractor.preview(selectedPaperEntities.value[0].mainURL);
  }
};

const reloadSelectedEntities = () => {
  if (viewState.contentType === "library") {
    selectedPaperEntities.value = [];
    let tempSelectedPaperEntities = [];
    let tempSelectedIds = [];
    if (paperEntities) {
      for (const index of selectionState.selectedIndex) {
        if (paperEntities.value.length > index) {
          tempSelectedPaperEntities.push(paperEntities.value[index]);
          tempSelectedIds.push(`${paperEntities.value[index].id}`);
        } else if (selectionState.selectedIndex.length === 1) {
          selectionState.selectedIndex = [];
          selectionState.selectedIds = [];
          break;
        }
      }
      selectedPaperEntities.value = tempSelectedPaperEntities;
      selectionState.selectedIds = tempSelectedIds;
    }
  } else {
    selectedFeedEntities.value = [];
    let tempSelectedFeedEntities = [];
    let tempSelectedIds = [];
    if (feedEntities) {
      for (const index of selectionState.selectedIndex) {
        if (feedEntities.value.length > index) {
          tempSelectedFeedEntities.push(feedEntities.value[index]);
          tempSelectedIds.push(`${feedEntities.value[index].id}`);
        } else if (selectionState.selectedIndex.length === 1) {
          selectionState.selectedIndex = [];
          selectionState.selectedIds = [];
          break;
        }
      }
      selectedFeedEntities.value = tempSelectedFeedEntities;
      selectionState.selectedIds = tempSelectedIds;
    }
  }
};

const clearSelected = () => {
  selectionState.selectedIndex = [];
};

const scrapeSelectedEntities = () => {
  if (viewState.contentType === "library") {
    const paperEntityDrafts = selectedPaperEntities.value.map((paperEntity) => {
      const paperEntityDraft = new PaperEntity(false).initialize(paperEntity);
      return paperEntityDraft;
    });
    void window.entityInteractor.scrape(paperEntityDrafts);
  }
};

const scrapeSelectedEntitiesFrom = (scraperName: string) => {
  if (viewState.contentType === "library") {
    const paperEntityDrafts = selectedPaperEntities.value.map((paperEntity) => {
      const paperEntityDraft = new PaperEntity(false).initialize(paperEntity);
      return paperEntityDraft;
    });
    void window.entityInteractor.scrapeFrom(paperEntityDrafts, scraperName);
  }
};

const deleteSelectedEntities = () => {
  if (viewState.contentType === "library") {
    viewState.isDeleteConfirmShown = true;
  }
};

const editSelectedEntities = () => {
  if (viewState.contentType === "library") {
    const paperEntityDraft = new PaperEntity(false).initialize(
      selectedPaperEntities.value[0]
    );
    bufferState.editingPaperEntityDraft = paperEntityDraft;
    viewState.isEditViewShown = true;
  }
};

const flagSelectedEntities = () => {
  if (viewState.contentType === "library") {
    const paperEntityDrafts = selectedPaperEntities.value.map((paperEntity) => {
      const paperEntityDraft = new PaperEntity(false).initialize(paperEntity);
      paperEntityDraft.flag = !paperEntityDraft.flag;
      return paperEntityDraft;
    });
    void window.entityInteractor.update(paperEntityDrafts);
  }
};

const exportSelectedEntities = (format: string) => {
  if (viewState.contentType === "library") {
    window.entityInteractor.export(selectedPaperEntities.value, format);
  }
};

// const addSelectedFeedEntities = async () => {
//   if (contentType.value === "feed") {
//     feedEntityAddingStatus.value = 1;
//     const feedEntityDrafts = selectedFeedEntities.value.map((entity) => {
//       const feedEntityDraft = new FeedEntityDraft();
//       feedEntityDraft.initialize(entity);
//       return feedEntityDraft;
//     });
//     await window.feedInteractor.addFeedEntities(
//       JSON.stringify(feedEntityDrafts)
//     );
//     feedEntityAddingStatus.value = 2;
//   }
// };

const switchViewType = (viewType: string) => {
  window.appInteractor.setPreference("mainviewType", viewType);
};

const switchSortBy = (key: string) => {
  window.appInteractor.setPreference("mainviewSortBy", key);
};

const switchSortOrder = (order: string) => {
  window.appInteractor.setPreference("mainviewSortOrder", order);
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
      viewState.isPreferenceViewShown = true;
      break;
  }
};

const onArrowUpPressed = () => {
  const currentIndex = selectionState.selectedIndex[0] || 0;
  const newIndex = currentIndex - 1 < 0 ? 0 : currentIndex - 1;
  if (!viewState.isEditViewShown && !viewState.isPreferenceViewShown) {
    selectionState.selectedIndex = [newIndex];
  }
};

const onArrowDownPressed = () => {
  const currentIndex = selectionState.selectedIndex[0] || 0;
  const newIndex =
    currentIndex + 1 >
    (viewState.contentType === "library"
      ? viewState.entitiesCount
      : viewState.feedEntitiesCount) -
      1
      ? currentIndex
      : currentIndex + 1;
  if (!viewState.isEditViewShown && !viewState.isPreferenceViewShown) {
    selectionState.selectedIndex = [newIndex];
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
    exportSelectedEntities("BibTex");
  }
);

window.appInteractor.registerMainSignal(
  "data-context-menu-export-bibtex-key",
  () => {
    exportSelectedEntities("BibTex-Key");
  }
);

window.appInteractor.registerMainSignal(
  "data-context-menu-export-plain",
  () => {
    exportSelectedEntities("PlainText");
  }
);

// window.appInteractor.registerMainSignal("feed-data-context-menu-add", () => {
//   addSelectedFeedEntities();
// });

// window.appInteractor.registerMainSignal("feed-data-context-menu-read", () => {
//   readSelectedFeedEntities(null);
// });

// // ========================================================
// // Register Shortcut
window.appInteractor.registerMainSignal("shortcut-Preference", () => {
  viewState.isPreferenceViewShown = true;
});

window.appInteractor.registerMainSignal("shortcut-Enter", () => {
  if (
    !viewState.inputFieldFocused &&
    (selectedPaperEntities.value.length >= 1 ||
      selectedFeedEntities.value.length >= 1) &&
    !viewState.isDeleteConfirmShown &&
    !viewState.isEditViewShown &&
    !viewState.isPreferenceViewShown
  ) {
    openSelectedEntities();
  }
});

window.appInteractor.registerMainSignal("shortcut-Space", () => {
  if (
    !viewState.inputFieldFocused &&
    selectedPaperEntities.value.length >= 1 &&
    !viewState.isDeleteConfirmShown &&
    !viewState.isEditViewShown &&
    !viewState.isPreferenceViewShown
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
      event.preventDefault();
      onArrowDownPressed();
    }

    if (event.code === "ArrowUp") {
      event.preventDefault();
      onArrowUpPressed();
    }

    if (event.code === "Space" && selectedPaperEntities.value.length >= 1) {
      previewSelectedEntities();
    }
  }
}
window.addEventListener("keydown", preventSpaceArrowScrollEvent, true);

// =======================================
// Register State Change
// =======================================

window.appInteractor.registerMainSignal("shortcut-cmd-shift-c", () => {
  if (selectedPaperEntities.value.length >= 1) {
    exportSelectedEntities("BibTex");
  }
});

window.appInteractor.registerMainSignal("shortcut-cmd-shift-k", () => {
  if (selectedPaperEntities.value.length >= 1) {
    exportSelectedEntities("BibTex-Key");
  }
}),
  window.appInteractor.registerMainSignal("shortcut-cmd-e", () => {
    if (selectedPaperEntities.value.length == 1) {
      editSelectedEntities();
    }
  });

window.appInteractor.registerMainSignal("shortcut-cmd-f", () => {
  if (selectedPaperEntities.value.length >= 1) {
    flagSelectedEntities();
  }
});

window.appInteractor.registerMainSignal("shortcut-cmd-r", () => {
  if (selectedPaperEntities.value.length >= 1) {
    scrapeSelectedEntities();
  }
});

window.appInteractor.registerMainSignal("shortcut-arrow-up", onArrowUpPressed);

window.appInteractor.registerMainSignal(
  "shortcut-arrow-down",
  onArrowDownPressed
);

watch(
  () => selectionState.selectedIndex,
  (value) => {
    reloadSelectedEntities();
  }
);

watch(
  () => paperEntities?.value,
  (value) => {
    reloadSelectedEntities();
  }
);

watch(
  () =>
    viewState.contentType +
    prefState.mainviewSortBy +
    prefState.mainviewSortOrder +
    viewState.searchText +
    selectionState.selectedCategorizer +
    selectionState.selectedFeed,
  (value) => clearSelected()
);
</script>

<template>
  <div class="grow flex flex-col h-screen bg-white dark:bg-neutral-800">
    <WindowMenuBar
      class="flex-none"
      @click="onMenuButtonClicked"
      :disableSingleBtn="selectionState.selectedIndex.length !== 1"
      :disableMultiBtn="selectionState.selectedIndex.length === 0"
    />
    <div class="grow flex divide-x dark:divide-neutral-700">
      <PaperDataView v-if="viewState.contentType === 'library'" />
      <Transition
        enter-active-class="transition ease-out duration-75"
        enter-from-class="transform opacity-0"
        enter-to-class="transform opacity-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100"
        leave-to-class="transform opacity-0"
      >
        <PaperDetailView
          :entity="
            selectedPaperEntities.length === 1
              ? selectedPaperEntities[0]
              : selectedEntityPlaceHolder
          "
          v-show="selectionState.selectedIndex.length === 1"
          v-if="viewState.contentType === 'library'"
        />
      </Transition>

      <FeedDataView v-if="viewState.contentType === 'feed'" />
      <Transition
        enter-active-class="transition ease-out duration-75"
        enter-from-class="transform opacity-0"
        enter-to-class="transform opacity-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100"
        leave-to-class="transform opacity-0"
      >
        <FeedDetailView
          :entity="
            selectedFeedEntities.length === 1
              ? selectedFeedEntities[0]
              : selectedFeedEntityPlaceHolder
          "
          v-show="selectionState.selectedIndex.length === 1"
          v-if="viewState.contentType === 'feed'"
        />
      </Transition>
    </div>
  </div>
</template>
