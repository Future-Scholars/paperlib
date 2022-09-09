<script setup lang="ts">
import { Ref, inject, ref, watch } from "vue";

import { PaperEntity } from "@/models/paper-entity";
import { PaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import PaperDataView from "./data-view/paper-data-view.vue";
import PaperDetailView from "./detail-view/paper-detail-view.vue";
import WindowMenuBar from "./menubar-view/window-menu-bar.vue";

// import FeedDataView from "./data-view/feed-data-view.vue";
// import FeedDetailView from "./detail-view/feed-detail-view.vue";

// const props = defineProps({
//   entities: Array as () => PaperEntity[],
//   feedEntities: Array as () => FeedEntity[],
//   showMainYear: Boolean,
//   showMainPublication: Boolean,
//   showMainPubType: Boolean,
//   showMainRating: Boolean,
//   showMainFlag: Boolean,
//   showMainTags: Boolean,
//   showMainFolders: Boolean,
//   showMainNote: Boolean,
// });

// ================================
// State
// ================================
const viewState = MainRendererStateStore.useViewState();
const selectionState = MainRendererStateStore.useSelectionState();
const dbState = MainRendererStateStore.useDBState();
const bufferState = MainRendererStateStore.useBufferState();

// ================================
// Data
// ================================
const selectedEntityPlaceHolder = ref(new PaperEntity(false));
const paperEntities = inject<Ref<PaperEntityResults>>("paperEntities");

const selectedPaperEntities = ref<Array<PaperEntity>>([]);
// TODO: fix this type
const selectedFeedEntities = ref<Array<PaperEntity>>([]);

// const feedEntityAddingStatus = ref(0); // 0: not adding, 1: adding, 2: added

// ================================
// Event Handlers
// ================================
const openSelectedEntities = () => {
  if (viewState.contentType === "library") {
    selectedPaperEntities.value.forEach((paperEntity) => {
      window.appInteractor.open(paperEntity.mainURL);
    });
  } else {
    // TODO: uncomment this
    // selectedFeedEntities.value.forEach((entity) => {
    //   window.appInteractor.open(entity.mainURL);
    // });
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
    // TODO: Feed
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

// const readSelectedFeedEntities = (read: boolean | null, clear = false) => {
//   if (contentType.value === "feed") {
//     const feedEntityDrafts = selectedFeedEntities.value
//       .map((feedEntity) => {
//         const feedEntityDraft = new FeedEntityDraft();
//         feedEntityDraft.initialize(feedEntity);
//         if (feedEntityDraft.read !== read) {
//           feedEntityDraft.read = !feedEntityDraft.read;
//           return feedEntityDraft;
//         } else {
//           return null;
//         }
//       })
//       .filter((feedEntityDraft) => feedEntityDraft !== null);
//     if (clear) {
//       clearSelected();
//     }
//     void window.feedInteractor.updateFeedEntities(
//       JSON.stringify(feedEntityDrafts)
//     );
//   }
// };

const switchViewType = (viewType: string) => {
  viewState.viewType = viewType;
  window.appInteractor.setPreference("mainviewType", viewType);
};

const switchSortBy = (key: string) => {
  viewState.sortBy = key;
  window.appInteractor.setPreference("mainviewSortBy", key);
};

const switchSortOrder = (order: string) => {
  viewState.sortOrder = order;
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
// window.appInteractor.registerMainSignal("shortcut-Preference", () => {
//   window.appInteractor.setState("viewState.isPreferenceViewShown", true);
// });

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
    viewState.sortBy +
    viewState.sortOrder +
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

      <PaperDetailView
        :entity="
          selectedPaperEntities.length === 1
            ? selectedPaperEntities[0]
            : selectedEntityPlaceHolder
        "
        v-show="selectionState.selectedIndex.length === 1"
        v-if="viewState.contentType === 'library'"
      />

      <!-- 
      <FeedDataView
        :entities="feedEntities"
        :sortBy="sortBy"
        :sortOrder="sortOrder"
        :show-main-year="showMainYear"
        :show-main-publication="showMainPublication"
        :show-main-pub-type="showMainPubType"
        v-if="contentType === 'feed'"
      />

      <FeedDetailView
        :feedEntity="
          selectedFeedEntities.length === 1 ? selectedFeedEntities[0] : null
        "
        :feedEntityAddingStatus="feedEntityAddingStatus"
        v-show="selectedFeedEntities.length === 1"
        v-if="contentType === 'feed'"
        @add-clicked="addSelectedFeedEntities"
        @read-timeout="readSelectedFeedEntities(true)"
        @read-timeout-in-unread="readSelectedFeedEntities(true, true)"
      />
-->
    </div>
  </div>
</template>
