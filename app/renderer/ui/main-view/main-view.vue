<script setup lang="ts">
import "splitpanes/dist/splitpanes.css";
import { Ref, inject, ref, watch } from "vue";

import { disposable } from "@/base/dispose";
import { debounce } from "@/base/misc";
import { FeedEntity } from "@/models/feed-entity";
import { PaperEntity } from "@/models/paper-entity";
import { IFeedEntityResults } from "@/repositories/db-repository/feed-entity-repository";
import { IPaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";

import SidebarView from "../sidebar-view/sidebar-view.vue";
import FeedDataView from "./data-view/feed-data-view.vue";
import PaperDataView from "./data-view/paper-data-view.vue";
import FeedDetailView from "./detail-view/feed-detail-view.vue";
import PaperDetailView from "./detail-view/paper-detail-view.vue";
import WindowMenuBar from "./menubar-view/window-menu-bar.vue";

// ================================
// State
// ================================
// TODO: move all state to UI service

const uiState = uiStateService.useState();
const prefState = preferenceService.useState();

// ================================
// Data
// ================================
const selectedEntityPlaceHolder = ref(new PaperEntity(false));
const selectedFeedEntityPlaceHolder = ref(new FeedEntity(false));

// TODO: use inject or serviceState?
const paperEntities = inject<Ref<IPaperEntityResults>>("paperEntities");
const feedEntities = inject<Ref<IFeedEntityResults>>("feedEntities");

// ================================
// Event Handlers
// ================================
const onSidebarResized = (event: any) => {
  const width = event[0].size ? event[0].size : 20;
  preferenceService.set({ sidebarWidth: width });
};

const openSelectedEntities = () => {
  if (uiState.contentType === "library") {
    uiState.selectedPaperEntities.forEach((paperEntity) => {
      fileService.open(paperEntity.mainURL);
    });
  } else {
    uiState.selectedFeedEntities.forEach((entity) => {
      fileService.open(entity.mainURL);
    });
  }
};

const showInFinderSelectedEntities = () => {
  if (uiState.contentType === "library") {
    uiState.selectedPaperEntities.forEach((paperEentity) => {
      fileService.showInFinder(paperEentity.mainURL);
    });
  }
};

const previewSelectedEntities = () => {
  if (uiState.contentType === "library") {
    fileService.preview(uiState.selectedPaperEntities[0].mainURL);
  }
};

const reloadSelectedEntities = () => {
  if (uiState.contentType === "library") {
    const selectedPaperEntities: PaperEntity[] = [];
    let selectedIds: string[] = [];
    if (paperEntities) {
      for (const index of uiState.selectedIndex) {
        if (paperEntities.value.length > index) {
          selectedPaperEntities.push(
            new PaperEntity(false).initialize(paperEntities.value[index])
          );
          selectedIds.push(`${paperEntities.value[index].id}`);
        } else if (uiState.selectedIndex.length === 1) {
          uiState.selectedIndex = [];
          break;
        }
      }
      uiState.selectedIds = selectedIds;
      uiState.selectedPaperEntities = selectedPaperEntities;
    } else {
      uiState.selectedIndex = [];
    }
  } else {
    const selectedFeedEntities: FeedEntity[] = [];
    let selectedIds: string[] = [];
    if (feedEntities) {
      for (const index of uiState.selectedIndex) {
        if (feedEntities.value.length > index) {
          selectedFeedEntities.push(
            new FeedEntity(false).initialize(feedEntities.value[index])
          );
          selectedIds.push(`${feedEntities.value[index].id}`);
        } else if (uiState.selectedIndex.length === 1) {
          uiState.selectedIndex = [];
          break;
        }
      }
      uiState.selectedIds = selectedIds;
      uiState.selectedFeedEntities = selectedFeedEntities;
    } else {
      uiState.selectedIndex = [];
    }
  }
};

const clearSelected = () => {
  uiState.selectedIndex = [];
};

const scrapeSelectedEntities = () => {
  if (uiState.contentType === "library") {
    const paperEntityDrafts = uiState.selectedPaperEntities.map(
      (paperEntity) => {
        const paperEntityDraft = new PaperEntity(false).initialize(paperEntity);
        return paperEntityDraft;
      }
    );
    void paperService.scrape(paperEntityDrafts);
  }
};

const scrapeSelectedEntitiesFrom = (scraperName: string) => {
  if (uiState.contentType === "library") {
    const paperEntityDrafts = uiState.selectedPaperEntities.map(
      (paperEntity) => {
        const paperEntityDraft = new PaperEntity(false).initialize(paperEntity);
        return paperEntityDraft;
      }
    );
    void paperService.scrape(paperEntityDrafts, [scraperName]);
  }
};

const deleteSelectedEntities = () => {
  if (uiState.contentType === "library") {
    uiState.isDeleteConfirmShown = true;
  }
};

const editSelectedEntities = () => {
  if (uiState.contentType === "library") {
    const paperEntityDraft = new PaperEntity(false).initialize(
      uiState.selectedPaperEntities[0]
    );
    uiState.editingPaperEntityDraft = paperEntityDraft;
    uiState.isEditViewShown = true;
  }
};

const flagSelectedEntities = () => {
  if (uiState.contentType === "library") {
    const paperEntityDrafts = uiState.selectedPaperEntities.map(
      (paperEntity) => {
        const paperEntityDraft = new PaperEntity(false).initialize(paperEntity);
        paperEntityDraft.flag = !paperEntityDraft.flag;
        return paperEntityDraft;
      }
    );
    paperService.update(paperEntityDrafts);
  }
};

const exportSelectedEntities = (format: string) => {
  if (uiState.contentType === "library") {
    referenceService.export(uiState.selectedPaperEntities, format);
  }
};

const addSelectedFeedEntities = async () => {
  if (uiState.contentType === "feed") {
    uiState.feedEntityAddingStatus = 1;
    const feedEntityDrafts = uiState.selectedFeedEntities.map((entity) => {
      return new FeedEntity(false).initialize(entity);
    });
    await feedService.addToLib(feedEntityDrafts);
    uiState.feedEntityAddingStatus = 2;
    debounce(() => {
      uiState.feedEntityAddingStatus = 0;
    }, 1000)();
  }
};

const readSelectedFeedEntities = (read: boolean | null, clear = false) => {
  if (uiState.contentType === "feed") {
    const feedEntityDrafts = uiState.selectedFeedEntities
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
      uiState.isPreferenceViewShown = true;
      break;
  }
};

const onArrowUpPressed = () => {
  const currentIndex = uiState.selectedIndex[0] || 0;
  const newIndex = currentIndex - 1 < 0 ? 0 : currentIndex - 1;
  if (!uiState.isEditViewShown && !uiState.isPreferenceViewShown) {
    uiState.selectedIndex = [newIndex];
  }
};

const onArrowDownPressed = () => {
  const currentIndex = uiState.selectedIndex[0] || 0;
  const newIndex =
    currentIndex + 1 >
    (uiState.contentType === "library"
      ? uiState.entitiesCount
      : uiState.feedEntitiesCount) -
      1
      ? currentIndex
      : currentIndex + 1;
  if (!uiState.isEditViewShown && !uiState.isPreferenceViewShown) {
    uiState.selectedIndex = [newIndex];
  }
};

const onDetailPanelResized = (event: any) => {
  const width = event[0].size ? event[0].size : 80;
  preferenceService.set({ detailPanelWidth: width });
};

// ========================================================
// Register Context Menu

// TODO use on or onClick? consitent with other menu handlers
disposable(
  PLMainAPI.contextMenuService.on("dataContextMenuEditClicked", () => {
    editSelectedEntities();
  })
);

disposable(
  PLMainAPI.contextMenuService.on("dataContextMenuFlagClicked", () => {
    flagSelectedEntities();
  })
);

disposable(
  PLMainAPI.contextMenuService.on("dataContextMenuDeleteClicked", () => {
    deleteSelectedEntities();
  })
);

disposable(
  PLMainAPI.contextMenuService.on("dataContextMenuScrapeClicked", () => {
    scrapeSelectedEntities();
  })
);

disposable(
  PLMainAPI.contextMenuService.on(
    "dataContextMenuScrapeFromClicked",
    (scraperName: string) => {
      scrapeSelectedEntitiesFrom(scraperName);
    }
  )
);

disposable(
  PLMainAPI.contextMenuService.on("dataContextMenuOpenClicked", () => {
    openSelectedEntities();
  })
);

disposable(
  PLMainAPI.contextMenuService.on("dataContextMenuShowInFinderClicked", () => {
    showInFinderSelectedEntities();
  })
);

disposable(
  PLMainAPI.contextMenuService.on("dataContextMenuExportBibTexClicked", () => {
    exportSelectedEntities("BibTex");
  })
);

disposable(
  PLMainAPI.contextMenuService.on(
    "dataContextMenuExportBibTexKeyClicked",
    () => {
      exportSelectedEntities("BibTex-Key");
    }
  )
);

disposable(
  PLMainAPI.contextMenuService.on(
    "dataContextMenuExportPlainTextClicked",
    () => {
      exportSelectedEntities("PlainText");
    }
  )
);

disposable(
  PLMainAPI.contextMenuService.on("feedContextMenuAddToLibraryClicked", () => {
    addSelectedFeedEntities();
  })
);

disposable(
  PLMainAPI.contextMenuService.on("feedContextMenuToogleReadClicked", () => {
    readSelectedFeedEntities(null);
  })
);

// ========================================================
// Register Shortcut

disposable(
  PLMainAPI.menuService.onClick("preference", () => {
    uiState.isPreferenceViewShown = true;
  })
);

disposable(
  PLMainAPI.menuService.onClick("File-enter", () => {
    if (
      uiState.mainViewFocused &&
      !uiState.inputFieldFocused &&
      (uiState.selectedPaperEntities.length >= 1 ||
        uiState.selectedFeedEntities.length >= 1) &&
      !uiState.isDeleteConfirmShown &&
      !uiState.isEditViewShown &&
      !uiState.isPreferenceViewShown
    ) {
      openSelectedEntities();
    }
  })
);

disposable(
  PLMainAPI.menuService.onClick("View-preview", () => {
    if (
      uiState.mainViewFocused &&
      !uiState.inputFieldFocused &&
      uiState.selectedPaperEntities.length >= 1 &&
      !uiState.isDeleteConfirmShown &&
      !uiState.isEditViewShown &&
      !uiState.isPreferenceViewShown
    ) {
      previewSelectedEntities();
    }
  })
);

disposable(
  PLMainAPI.menuService.onClick("File-copyBibTex", () => {
    if (uiState.selectedPaperEntities.length >= 1) {
      exportSelectedEntities("BibTex");
    }
  })
);

disposable(
  PLMainAPI.menuService.onClick("File-copyBibTexKey", () => {
    if (uiState.selectedPaperEntities.length >= 1) {
      exportSelectedEntities("BibTex-Key");
    }
  })
);

disposable(
  PLMainAPI.menuService.onClick("Edit-edit", () => {
    if (uiState.selectedPaperEntities.length == 1) {
      editSelectedEntities();
    }
  })
);

disposable(
  PLMainAPI.menuService.onClick("Edit-flag", () => {
    if (uiState.selectedPaperEntities.length >= 1) {
      flagSelectedEntities();
    }
  })
);

disposable(
  PLMainAPI.menuService.onClick("Edit-rescrape", () => {
    if (uiState.selectedPaperEntities.length >= 1) {
      scrapeSelectedEntities();
    }
  })
);

disposable(PLMainAPI.menuService.onClick("View-previous", onArrowUpPressed));

disposable(PLMainAPI.menuService.onClick("View-next", onArrowDownPressed));

// =======================================
// Register State Changes
// =======================================
disposable(uiStateService.onChanged("selectedIndex", reloadSelectedEntities));

watch(
  () => paperEntities?.value,
  (value) => {
    reloadSelectedEntities();
  }
);

disposable(
  preferenceService.onChanged(
    ["mainviewSortBy", "mainviewSortOrder"],
    clearSelected
  )
);

disposable(
  uiStateService.onChanged(
    ["contentType", "commandBarText", "selectedCategorizer", "selectedFeed"],
    clearSelected
  )
);
</script>

<template>
  <splitpanes @resized="onSidebarResized($event)">
    <pane :key="1" min-size="12" :size="prefState.sidebarWidth">
      <SidebarView class="sidebar-windows-bg" />
    </pane>
    <pane :key="2">
      <div class="grow flex flex-col h-screen bg-white dark:bg-neutral-800">
        <WindowMenuBar
          class="flex-none"
          @click="onMenuButtonClicked"
          :disableSingleBtn="uiState.selectedIndex.length !== 1"
          :disableMultiBtn="uiState.selectedIndex.length === 0"
        />
        <div id="main-view" class="h-full w-full">
          <splitpanes @resized="onDetailPanelResized($event)">
            <pane
              :key="1"
              :size="
                uiState.selectedPaperEntities.length === 1 ||
                uiState.selectedFeedEntities.length === 1
                  ? prefState.detailPanelWidth
                  : 100
              "
            >
              <PaperDataView
                v-if="uiState.contentType === 'library'"
                class="h-full w-full"
              />

              <FeedDataView
                v-if="uiState.contentType === 'feed'"
                class="h-full w-full"
              />
            </pane>
            <pane
              :key="2"
              :size="
                uiState.selectedPaperEntities.length === 1 ||
                uiState.selectedFeedEntities.length === 1
                  ? 100 - prefState.detailPanelWidth
                  : 0
              "
            >
              <PaperDetailView
                :entity="
                  uiState.selectedPaperEntities.length === 1
                    ? uiState.selectedPaperEntities[0]
                    : selectedEntityPlaceHolder
                "
                :slot1="uiState['slotsState.paperDetailsPanelSlot1']"
                v-show="uiState.selectedPaperEntities.length === 1"
                v-if="uiState.contentType === 'library'"
              />

              <FeedDetailView
                :entity="
                  uiState.selectedFeedEntities.length === 1
                    ? uiState.selectedFeedEntities[0]
                    : selectedFeedEntityPlaceHolder
                "
                v-show="uiState.selectedFeedEntities.length === 1"
                v-if="uiState.contentType === 'feed'"
                @add-clicked="addSelectedFeedEntities"
                @read-timeout="readSelectedFeedEntities(true)"
                @read-timeout-in-unread="readSelectedFeedEntities(true, true)"
              />
            </pane>
          </splitpanes>
        </div>
      </div>
    </pane>
  </splitpanes>
</template>
