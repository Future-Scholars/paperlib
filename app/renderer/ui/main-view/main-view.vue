<script setup lang="ts">
import { Ref, inject, ref, watch } from "vue";

import { disposable } from "@/base/dispose";
import { debounce } from "@/base/misc";
import { FeedEntity } from "@/models/feed-entity";
import { PaperEntity } from "@/models/paper-entity";
import { IFeedEntityResults } from "@/repositories/db-repository/feed-entity-repository";
import { IPaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
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
const prefState = preferenceService.useState();

// ================================
// Data
// ================================
const selectedEntityPlaceHolder = ref(new PaperEntity(false));
const selectedFeedEntityPlaceHolder = ref(new FeedEntity(false));

const paperEntities = inject<Ref<IPaperEntityResults>>("paperEntities");
const feedEntities = inject<Ref<IFeedEntityResults>>("feedEntities");

const selectedPaperEntities = ref<Array<PaperEntity>>([]);
const selectedFeedEntities = ref<Array<FeedEntity>>([]);

// ================================
// Event Handlers
// ================================
const openSelectedEntities = () => {
  if (viewState.contentType === "library") {
    selectedPaperEntities.value.forEach((paperEntity) => {
      fileService.open(paperEntity.mainURL);
    });
  } else {
    selectedFeedEntities.value.forEach((entity) => {
      fileService.open(entity.mainURL);
    });
  }
};

const showInFinderSelectedEntities = () => {
  if (viewState.contentType === "library") {
    selectedPaperEntities.value.forEach((paperEentity) => {
      fileService.showInFinder(paperEentity.mainURL);
    });
  }
};

const previewSelectedEntities = () => {
  if (viewState.contentType === "library") {
    fileService.preview(selectedPaperEntities.value[0].mainURL);
  }
};

const reloadSelectedEntities = () => {
  if (viewState.contentType === "library") {
    selectedPaperEntities.value = [];
    let tempSelectedPaperEntities: PaperEntity[] = [];
    let tempSelectedIds: string[] = [];
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
      if (tempSelectedPaperEntities.length > 0) {
        bufferService.set({
          editingPaperEntityDraft: new PaperEntity(false).initialize(
            tempSelectedPaperEntities[0]
          ),
        });
      }
    }
  } else {
    selectedFeedEntities.value = [];
    let tempSelectedFeedEntities: FeedEntity[] = [];
    let tempSelectedIds: string[] = [];
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
  selectionState.selectedIds = [];
  selectedFeedEntities.value = [];
  selectedPaperEntities.value = [];
};

const scrapeSelectedEntities = () => {
  if (viewState.contentType === "library") {
    const paperEntityDrafts = selectedPaperEntities.value.map((paperEntity) => {
      const paperEntityDraft = new PaperEntity(false).initialize(paperEntity);
      return paperEntityDraft;
    });
    void paperService.scrape(paperEntityDrafts);
  }
};

const scrapeSelectedEntitiesFrom = (scraperName: string) => {
  if (viewState.contentType === "library") {
    const paperEntityDrafts = selectedPaperEntities.value.map((paperEntity) => {
      const paperEntityDraft = new PaperEntity(false).initialize(paperEntity);
      return paperEntityDraft;
    });
    void paperService.scrape(paperEntityDrafts, [scraperName]);
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
    paperService.update(paperEntityDrafts);
  }
};

const exportSelectedEntities = (format: string) => {
  if (viewState.contentType === "library") {
    referenceService.export(selectedPaperEntities.value, format);
  }
};

const addSelectedFeedEntities = async () => {
  if (viewState.contentType === "feed") {
    viewState.feedEntityAddingStatus = 1;
    const feedEntityDrafts = selectedFeedEntities.value.map((entity) => {
      return new FeedEntity(false).initialize(entity);
    });
    await feedService.addToLib(feedEntityDrafts);
    viewState.feedEntityAddingStatus = 2;
    debounce(() => {
      viewState.feedEntityAddingStatus = 0;
    }, 1000)();
  }
};

const readSelectedFeedEntities = (read: boolean | null, clear = false) => {
  if (viewState.contentType === "feed") {
    const feedEntityDrafts = selectedFeedEntities.value
      .map((feedEntity) => {
        const feedEntityDraft = new FeedEntity(false).initialize(feedEntity);
        if (feedEntityDraft.read !== read) {
          feedEntityDraft.read = !feedEntityDraft.read;
          return feedEntityDraft;
        } else {
          return null;
        }
      })
      .filter((feedEntityDraft) => feedEntityDraft !== null) as FeedEntity[];
    if (clear) {
      clearSelected();
    }
    void feedService.updateEntities(feedEntityDrafts);
  }
};

const switchViewType = (viewType: string) => {
  preferenceService.set({ mainviewType: viewType });
};

const switchSortBy = (key: string) => {
  preferenceService.set({ mainviewSortBy: key });
};

const switchSortOrder = (order: "asce" | "desc") => {
  preferenceService.set({ mainviewSortOrder: order });
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
    case "tableandpreview-view":
      switchViewType("tableandpreview");
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
      switchSortOrder(command.replaceAll("sort-order-", "") as "asce" | "desc");
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

const onDetailPanelResized = (event: any) => {
  const width = event[0].size ? event[0].size : 80;
  preferenceService.set({ detailPanelWidth: width });
};

// ========================================================
// Register Context Menu

PLMainAPI.contextMenuService.on("dataContextMenuEditClicked", () => {
  editSelectedEntities();
});

PLMainAPI.contextMenuService.on("dataContextMenuFlagClicked", () => {
  flagSelectedEntities();
});

PLMainAPI.contextMenuService.on("dataContextMenuDeleteClicked", () => {
  deleteSelectedEntities();
});

PLMainAPI.contextMenuService.on("dataContextMenuScrapeClicked", () => {
  scrapeSelectedEntities();
});

PLMainAPI.contextMenuService.on(
  "dataContextMenuScrapeFromClicked",
  (scraperName: string) => {
    scrapeSelectedEntitiesFrom(scraperName);
  }
);

PLMainAPI.contextMenuService.on("dataContextMenuOpenClicked", () => {
  openSelectedEntities();
});

PLMainAPI.contextMenuService.on("dataContextMenuShowInFinderClicked", () => {
  showInFinderSelectedEntities();
});

PLMainAPI.contextMenuService.on("dataContextMenuExportBibTexClicked", () => {
  exportSelectedEntities("BibTex");
});

PLMainAPI.contextMenuService.on("dataContextMenuExportBibTexKeyClicked", () => {
  exportSelectedEntities("BibTex-Key");
});

PLMainAPI.contextMenuService.on("dataContextMenuExportPlainTextClicked", () => {
  exportSelectedEntities("PlainText");
});

PLMainAPI.contextMenuService.on("feedContextMenuAddToLibraryClicked", () => {
  addSelectedFeedEntities();
});

PLMainAPI.contextMenuService.on("feedContextMenuToogleReadClicked", () => {
  readSelectedFeedEntities(null);
});

// ========================================================
// Register Shortcut

PLMainAPI.menuService.onClick("preference", () => {
  viewState.isPreferenceViewShown = true;
});

PLMainAPI.menuService.onClick("File-enter", () => {
  if (
    viewState.mainViewFocused &&
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

PLMainAPI.menuService.onClick("View-preview", () => {
  if (
    viewState.mainViewFocused &&
    !viewState.inputFieldFocused &&
    selectedPaperEntities.value.length >= 1 &&
    !viewState.isDeleteConfirmShown &&
    !viewState.isEditViewShown &&
    !viewState.isPreferenceViewShown
  ) {
    previewSelectedEntities();
  }
});

PLMainAPI.menuService.onClick("File-copyBibTex", () => {
  if (selectedPaperEntities.value.length >= 1) {
    exportSelectedEntities("BibTex");
  }
});

PLMainAPI.menuService.onClick("File-copyBibTexKey", () => {
  if (selectedPaperEntities.value.length >= 1) {
    exportSelectedEntities("BibTex-Key");
  }
});

PLMainAPI.menuService.onClick("Edit-edit", () => {
  if (selectedPaperEntities.value.length == 1) {
    editSelectedEntities();
  }
});

PLMainAPI.menuService.onClick("Edit-flag", () => {
  if (selectedPaperEntities.value.length >= 1) {
    flagSelectedEntities();
  }
});

PLMainAPI.menuService.onClick("Edit-rescrape", () => {
  if (selectedPaperEntities.value.length >= 1) {
    scrapeSelectedEntities();
  }
});

window.appInteractor.registerMainSignal("shortcut-arrow-up", onArrowUpPressed);

window.appInteractor.registerMainSignal(
  "shortcut-arrow-down",
  onArrowDownPressed
);

function preventSpaceArrowScrollEvent(event: KeyboardEvent) {
  if (!viewState.mainViewFocused) {
    return true;
  }
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

disposable(
  preferenceService.onChanged(
    ["mainviewSortBy", "mainviewSortOrder"],
    (value) => {
      clearSelected();
    }
  )
);

watch(
  () =>
    viewState.contentType +
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
    <div id="main-view" class="h-full w-full">
      <splitpanes @resized="onDetailPanelResized($event)">
        <pane
          :key="1"
          :size="
            selectedPaperEntities.length === 1 ||
            selectedFeedEntities.length === 1
              ? prefState.detailPanelWidth
              : 100
          "
        >
          <PaperDataView
            v-if="viewState.contentType === 'library'"
            class="h-full w-full"
          />

          <FeedDataView
            v-if="viewState.contentType === 'feed'"
            class="h-full w-full"
          />
        </pane>
        <pane
          :key="2"
          :size="
            selectedPaperEntities.length === 1 ||
            selectedFeedEntities.length === 1
              ? 100 - prefState.detailPanelWidth
              : 0
          "
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

          <FeedDetailView
            :entity="
              selectedFeedEntities.length === 1
                ? selectedFeedEntities[0]
                : selectedFeedEntityPlaceHolder
            "
            v-show="selectionState.selectedIndex.length === 1"
            v-if="viewState.contentType === 'feed'"
            @add-clicked="addSelectedFeedEntities"
            @read-timeout="readSelectedFeedEntities(true)"
            @read-timeout-in-unread="readSelectedFeedEntities(true, true)"
          />
        </pane>
      </splitpanes>
    </div>
  </div>
</template>
@/base/misc
