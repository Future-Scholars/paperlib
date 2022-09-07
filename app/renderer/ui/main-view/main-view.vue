<script setup lang="ts">
import { ref, Ref, inject, watch } from "vue";

import { PaperEntity } from "@/models/paper-entity";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { PaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";

// import {
//   PaperEntity,
//   PaperEntityPlaceholder,
// } from "../../../../preload/models/PaperEntity";
// import { FeedEntity } from "../../../../preload/models/FeedEntity";
// import { PaperEntityDraft } from "../../../../preload/models/PaperEntityDraft";
// import { FeedEntityDraft } from "../../../../preload/models/FeedEntityDraft";

import WindowMenuBar from "./menubar-view/window-menu-bar.vue";
import PaperDataView from "./data-view/paper-data-view.vue";
import PaperDetailView from "./detail-view/paper-detail-view.vue";
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

// ================================
// Data
// ================================
const selectedEntityPlaceHolder = ref(new PaperEntity(false));
const paperEntities = inject<Ref<PaperEntityResults>>("paperEntities");

const selectedPaperEntities = ref<Array<PaperEntity>>([]);
// const selectedIndex: Ref<number[]> = ref([]);
// const selectedFeedEntities: Ref<FeedEntity[]> = ref([]);

// const feedEntityAddingStatus = ref(0); // 0: not adding, 1: adding, 2: added

// ================================
// Event Handlers
// ================================
// const openSelectedEntities = () => {
//   if (contentType.value === "library") {
//     selectedEntities.value.forEach((entity) => {
//       window.appInteractor.open(entity.mainURL);
//     });
//   } else {
//     selectedFeedEntities.value.forEach((entity) => {
//       window.appInteractor.open(entity.mainURL);
//     });
//   }
// };

// const showInFinderSelectedEntities = () => {
//   if (contentType.value === "library") {
//     selectedEntities.value.forEach((entity) => {
//       window.appInteractor.showInFinder(entity.mainURL);
//     });
//   }
// };

// const previewSelectedEntities = () => {
//   if (contentType.value === "library") {
//     window.appInteractor.preview(selectedEntities.value[0].mainURL);
//   }
// };

// const reloadSelectedEntities = () => {
//   let selectedIds;
//   if (viewState.contentType === "library") {
//     selectedPaperEntities.value = [];
//     selectionState.selectedIds.forEach((index) => {
//       selectedEntities.value.push(props.entities![index]);
//     });
//     selectedIds = selectedEntities.value.map((entity) => entity.id);
//   } else {
//     feedEntityAddingStatus.value = 0;
//     selectedFeedEntities.value = [];
//     selectedIndex.value.forEach((index) => {
//       selectedFeedEntities.value.push(props.feedEntities![index]);
//     });
//     selectedIds = selectedFeedEntities.value.map((entity) => entity.id);
//   }
//   window.appInteractor.setState(
//     "selectionState.selectedIds",
//     JSON.stringify(selectedIds)
//   );
// };

const clearSelected = () => {
  selectionState.selectedIndex = [];
};

// const scrapeSelectedEntities = () => {
//   if (contentType.value === "library") {
//     const entityDrafts = selectedEntities.value.map((entity) => {
//       const entityDraft = new PaperEntityDraft();
//       entityDraft.initialize(entity);
//       return entityDraft;
//     });
//     void window.entityInteractor.scrape(JSON.stringify(entityDrafts));
//   }
// };

// const scrapeSelectedEntitiesFrom = (scraperName: string) => {
//   if (contentType.value === "library") {
//     const entityDrafts = selectedEntities.value.map((entity) => {
//       const entityDraft = new PaperEntityDraft();
//       entityDraft.initialize(entity);
//       return entityDraft;
//     });
//     void window.entityInteractor.scrapeFrom(
//       JSON.stringify(entityDrafts),
//       scraperName
//     );
//   }
// };

// const deleteSelectedEntities = () => {
//   if (contentType.value === "library") {
//     emits("delete");
//   }
// };

// const editSelectedEntities = () => {
//   if (contentType.value === "library") {
//     const entityDraft = new PaperEntityDraft();
//     entityDraft.initialize(selectedEntities.value[0]);
//     window.appInteractor.setState(
//       "sharedData.editEntityDraft",
//       JSON.stringify(entityDraft)
//     );
//     window.appInteractor.setState("viewState.isEditViewShown", true);
//   }
// };

// const flagSelectedEntities = () => {
//   if (contentType.value === "library") {
//     const entityDrafts = selectedEntities.value.map((entity) => {
//       const entityDraft = new PaperEntityDraft();
//       entityDraft.initialize(entity);
//       entityDraft.flag = !entityDraft.flag;
//       return entityDraft;
//     });
//     void window.entityInteractor.update(JSON.stringify(entityDrafts));
//   }
// };

// const exportSelectedEntities = (format: string) => {
//   if (contentType.value === "library") {
//     window.entityInteractor.export(
//       JSON.stringify(selectedEntities.value),
//       format
//     );
//   }
// };

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
    //     case "rescrape":
    //       scrapeSelectedEntities();
    //       break;
    //     case "delete":
    //       deleteSelectedEntities();
    //       break;
    //     case "edit":
    //       editSelectedEntities();
    //       break;
    //     case "flag":
    //       flagSelectedEntities();
    //       break;
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

// // ========================================================
// // Register Context Menu

// window.appInteractor.registerMainSignal("data-context-menu-edit", () => {
//   editSelectedEntities();
// });

// window.appInteractor.registerMainSignal("data-context-menu-flag", () => {
//   flagSelectedEntities();
// });

// window.appInteractor.registerMainSignal("data-context-menu-delete", () => {
//   deleteSelectedEntities();
// });

// window.appInteractor.registerMainSignal("data-context-menu-scrape", () => {
//   scrapeSelectedEntities();
// });

// window.appInteractor.registerMainSignal(
//   "data-context-menu-scrape-from",
//   (args) => {
//     scrapeSelectedEntitiesFrom(args[0]);
//   }
// );

// window.appInteractor.registerMainSignal("data-context-menu-open", () => {
//   openSelectedEntities();
// });

// window.appInteractor.registerMainSignal(
//   "data-context-menu-showinfinder",
//   () => {
//     showInFinderSelectedEntities();
//   }
// );

// window.appInteractor.registerMainSignal(
//   "data-context-menu-export-bibtex",
//   () => {
//     exportSelectedEntities("BibTex");
//   }
// );

// window.appInteractor.registerMainSignal(
//   "data-context-menu-export-bibtex-key",
//   () => {
//     exportSelectedEntities("BibTex-Key");
//   }
// );

// window.appInteractor.registerMainSignal(
//   "data-context-menu-export-plain",
//   () => {
//     exportSelectedEntities("PlainText");
//   }
// );

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

// window.appInteractor.registerMainSignal("shortcut-Enter", () => {
//   if (
//     !searchInputFocus.value &&
//     (selectedEntities.value.length >= 1 ||
//       selectedFeedEntities.value.length >= 1) &&
//     !window.appInteractor.getState("viewState.isModalShown") &&
//     !window.appInteractor.getState("viewState.isEditViewShown") &&
//     !window.appInteractor.getState("viewState.isPreferenceViewShown")
//   ) {
//     openSelectedEntities();
//   }
// });

// window.appInteractor.registerMainSignal("shortcut-Space", () => {
//   if (
//     !searchInputFocus.value &&
//     selectedEntities.value.length >= 1 &&
//     !window.appInteractor.getState("viewState.isModalShown") &&
//     !window.appInteractor.getState("viewState.isEditViewShown") &&
//     !window.appInteractor.getState("viewState.isPreferenceViewShown")
//   ) {
//     previewSelectedEntities();
//   }
// });
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

    //     if (event.code === "Space" && selectedEntities.value.length >= 1) {
    //       previewSelectedEntities();
    //     }
  }
}
window.addEventListener("keydown", preventSpaceArrowScrollEvent, true);

// =======================================
// Register State Change
// =======================================

// window.appInteractor.registerMainSignal("shortcut-cmd-shift-c", () => {
//   if (selectedEntities.value.length >= 1) {
//     exportSelectedEntities("BibTex");
//   }
// });

// window.appInteractor.registerMainSignal("shortcut-cmd-shift-k", () => {
//   if (selectedEntities.value.length >= 1) {
//     exportSelectedEntities("BibTex-Key");
//   }
// }),
//   window.appInteractor.registerMainSignal("shortcut-cmd-e", () => {
//     if (selectedEntities.value.length == 1) {
//       editSelectedEntities();
//     }
//   });

// window.appInteractor.registerMainSignal("shortcut-cmd-f", () => {
//   if (selectedEntities.value.length >= 1) {
//     flagSelectedEntities();
//   }
// });

// window.appInteractor.registerMainSignal("shortcut-cmd-r", () => {
//   if (selectedEntities.value.length >= 1) {
//     scrapeSelectedEntities();
//   }
// });

window.appInteractor.registerMainSignal("shortcut-arrow-up", onArrowUpPressed);

window.appInteractor.registerMainSignal(
  "shortcut-arrow-down",
  onArrowDownPressed
);

watch(
  () => selectionState.selectedIndex,
  (value) => {
    if (viewState.contentType === "library") {
      selectedPaperEntities.value = [];
      if (paperEntities) {
        for (const index of value) {
          selectedPaperEntities.value.push(paperEntities.value[index]);
        }
      }
    } else {
      // TODO: Feed
    }
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

// TODO: check if stil needed
// window.appInteractor.registerState("selectionState.selectedIndex", (value) => {
//   selectedIndex.value = JSON.parse(value as string) as number[];
//   reloadSelectedEntities();
// });

// window.appInteractor.registerState("dbState.entitiesUpdated", (value) => {
//   reloadSelectedEntities();
// });

// window.appInteractor.registerState("dbState.feedEntitiesUpdated", (value) => {
//   reloadSelectedEntities();
// });
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
