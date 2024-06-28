<script setup lang="ts">
import "splitpanes/dist/splitpanes.css";
import { Ref, inject, ref, onMounted, onUnmounted } from "vue";

import { disposable } from "@/base/dispose";
import { debounce } from "@/base/misc";
import { CategorizerType } from "@/models/categorizer";
import { FeedEntity } from "@/models/feed-entity";
import { OID } from "@/models/id";
import { PaperEntity } from "@/models/paper-entity";
import { IFeedEntityCollection } from "@/repositories/db-repository/feed-entity-repository";
import { IPaperEntityCollection } from "@/repositories/db-repository/paper-entity-repository";

import SidebarView from "../sidebar-view/sidebar-view.vue";
import FeedDataView from "./data-view/feed-data-view.vue";
import PaperDataView from "./data-view/paper-data-view.vue";
import FeedDetailView from "./detail-view/feed-detail-view.vue";
import PaperDetailView from "./detail-view/paper-detail-view.vue";
import WindowMenuBar from "./menubar-view/window-menu-bar.vue";
import { Process } from "@/base/process-id.ts";
import { cmdOrCtrl, ShortcutEvent } from "@/common/utils.ts";
import CandidateView from "./candidate-view/candidate-view.vue";

// ================================
// State
// ================================
const uiState = uiStateService.useState();
const uiSlotState = uiSlotService.useState();
const prefState = preferenceService.useState();
const paperState = paperService.useState();
const feedState = feedService.useState();

// ================================
// Data
// ================================
const selectedEntityPlaceHolder = ref(new PaperEntity());
const selectedFeedEntityPlaceHolder = ref(new FeedEntity());

const paperEntities = inject<Ref<IPaperEntityCollection>>("paperEntities");
const feedEntities = inject<Ref<IFeedEntityCollection>>("feedEntities");

const dataView: Ref<HTMLElement | null> = ref(null);

let disposeCallbacks: (() => void)[] = [];

//Prevent space bar from scrolling page
disposable(
  shortcutService.register(
    "Space",
    (e: ShortcutEvent) => {
      if (!e.isInput) {
        e.preventDefault?.();
      }
    },
    false,
    true,
    shortcutService.viewScope.GLOBAL
  )
);

const registerShortcutFromPreference = () => {
  disposeCallbacks.push(
    shortcutService.register(
      preferenceService.get("shortcutOpen") as string,
      () => {
        PLMainAPI.menuService.click("File-enter");
      },
      true,
      true,
      shortcutService.viewScope.MAIN
    )
  );

  disposeCallbacks.push(
    shortcutService.register(
      preferenceService.get("shortcutDelete") as string,
      () => {
        PLMainAPI.menuService.click("File-delete");
      },
      true,
      true,
      shortcutService.viewScope.MAIN
    )
  );

  disposeCallbacks.push(
    shortcutService.register(
      preferenceService.get("shortcutCopy") as string,
      () => {
        PLMainAPI.menuService.click("File-copyBibTex");
      },
      true,
      true,
      shortcutService.viewScope.MAIN
    )
  );

  disposeCallbacks.push(
    shortcutService.register(
      preferenceService.get("shortcutCopyKey") as string,
      () => {
        PLMainAPI.menuService.click("File-copyBibTexKey");
      },
      true,
      true,
      shortcutService.viewScope.MAIN
    )
  );

  disposeCallbacks.push(
    shortcutService.register(
      preferenceService.get("shortcutScrape") as string,
      () => {
        PLMainAPI.menuService.click("Edit-rescrape");
      },
      true,
      true,
      shortcutService.viewScope.MAIN
    )
  );

  disposeCallbacks.push(
    shortcutService.register(
      preferenceService.get("shortcutEdit") as string,
      () => {
        PLMainAPI.menuService.click("Edit-edit");
      },
      true,
      true,
      shortcutService.viewScope.MAIN
    )
  );

  disposeCallbacks.push(
    shortcutService.register(
      preferenceService.get("shortcutFlag") as string,
      () => {
        PLMainAPI.menuService.click("Edit-flag");
      },
      true,
      true,
      shortcutService.viewScope.MAIN
    )
  );

  disposeCallbacks.push(
    shortcutService.register(
      preferenceService.get("shortcutPreview") as string,
      () => {
        PLMainAPI.menuService.click("View-preview");
      },
      true,
      true,
      shortcutService.viewScope.MAIN
    )
  );

  disposeCallbacks.push(
    shortcutService.register(
      preferenceService.get("shortcutImportFrom") as string,
      () => {
        PLMainAPI.menuService.click("File-importFrom");
      },
      true,
      true,
      shortcutService.viewScope.MAIN
    )
  );
};

preferenceService.on(
  [
    "shortcutOpen",
    "shortcutDelete",
    "shortcutCopy",
    "shortcutCopyKey",
    "shortcutScrape",
    "shortcutEdit",
    "shortcutFlag",
    "shortcutPreview",
  ],
  () => {
    unregisterShortcutFromPreference();
    registerShortcutFromPreference();
  }
);

onMounted(() => {
  registerShortcutFromPreference();
});

onUnmounted(() => {
  unregisterShortcutFromPreference();
});

const unregisterShortcutFromPreference = () => {
  disposeCallbacks.forEach((callback) => callback());
  disposeCallbacks = [];
};

// ================================
// Event Handlers
// ================================
const onSidebarResized = (event: any) => {
  const width = event[0].size ? event[0].size : 20;
  preferenceService.set({ sidebarWidth: width });
};

const openSelectedEntities = () => {
  if (uiState.contentType === "library") {
    uiState.selectedPaperEntities.forEach(async (paperEntity) => {
      const fileURL = await fileService.access(paperEntity.mainURL, true);

      fileService.open(fileURL);
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

const selectAllEntities = () => {
  let length = 0;
  if (uiState.contentType === "library") {
    if (paperEntities) {
      length = paperEntities.value.length;
    }
  } else {
    if (feedEntities) {
      length = feedEntities.value.length;
    }
  }
  uiState.selectedIndex = Array.from({ length }).map((_, index) => index);
};

const reloadSelectedEntities = () => {
  if (uiState.contentType === "library") {
    const selectedPaperEntities: PaperEntity[] = [];
    let selectedIds: string[] = [];
    if (paperEntities) {
      for (const index of uiState.selectedIndex) {
        if (paperEntities.value.length > index) {
          selectedPaperEntities.push(
            new PaperEntity(paperEntities.value[index])
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
          selectedFeedEntities.push(new FeedEntity(feedEntities.value[index]));
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
        return new PaperEntity(paperEntity);
      }
    );
    void paperService.scrape(paperEntityDrafts);
  }
};

const scrapeSelectedEntitiesFrom = (scraperName: string) => {
  if (uiState.contentType === "library") {
    const paperEntityDrafts = uiState.selectedPaperEntities.map(
      (paperEntity) => {
        const paperEntityDraft = new PaperEntity(paperEntity);
        return paperEntityDraft;
      }
    );
    void paperService.scrape(paperEntityDrafts, [scraperName]);
  }
};

const fuzzyScrapeSelectedEntities = async () => {
  if (uiState.contentType === "library") {
    const paperEntityDrafts = uiState.selectedPaperEntities.map(
      (paperEntity) => {
        return new PaperEntity(paperEntity);
      }
    );
    const results = await scrapeService.fuzzyScrape(paperEntityDrafts);

    const newMetadataCandidates = { ...uiState.metadataCandidates, ...results };
    uiStateService.setState({
      metadataCandidates: newMetadataCandidates,
    });
  }
};

const removeSelectedEntitiesFrom = (
  categorizeType: CategorizerType,
  categorizeId: OID
) => {
  if (uiState.contentType === "library") {
    const paperEntityDrafts = uiState.selectedPaperEntities.map(
      (paperEntity) => {
        const paperEntityDraft = new PaperEntity(paperEntity);
        if (categorizeType === CategorizerType.PaperFolder) {
          paperEntityDraft.folders = paperEntityDraft.folders.filter(
            (folder) => `${folder._id}` !== categorizeId
          );
        }
        if (categorizeType === CategorizerType.PaperTag) {
          paperEntityDraft.tags = paperEntityDraft.tags.filter(
            (tag) => `${tag._id}` !== categorizeId
          );
        }
        return paperEntityDraft;
      }
    );
    void paperService.update(paperEntityDrafts, false, true);
  }
};

const deleteSelectedEntities = () => {
  if (uiState.contentType === "library") {
    uiState.deleteConfirmShown = true;
  }
};

const editSelectedEntities = () => {
  if (uiState.contentType === "library") {
    uiState.editViewShown = true;
  }
};

const flagSelectedEntities = () => {
  if (uiState.contentType === "library") {
    const paperEntityDrafts = uiState.selectedPaperEntities.map(
      (paperEntity) => {
        const paperEntityDraft = new PaperEntity(paperEntity);
        paperEntityDraft.flag = !paperEntityDraft.flag;
        return paperEntityDraft;
      }
    );
    paperService.update(paperEntityDrafts, false, true);
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
      return new FeedEntity(entity);
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
        const feedEntityDraft = new FeedEntity(feedEntity);
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

const importFilesFromPicker = async () => {
  const pickedFiles = await PLMainAPI.fileSystemService.showFilePicker([
    "multiSelections",
  ]);
  if (pickedFiles.canceled || !pickedFiles) {
    return;
  }
  const filePaths: string[] = [];
  pickedFiles.filePaths.forEach((filePath) => {
    filePaths.push(`file://${filePath}`);
  });
  await paperService.create(filePaths);
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
      uiState.preferenceViewShown = true;
      break;
  }
};

const onArrowUpPressed = () => {
  const currentIndex = uiState.selectedIndex[0] || 0;
  const newIndex = currentIndex - 1 < 0 ? 0 : currentIndex - 1;
  if (!uiState.editViewShown && !uiState.preferenceViewShown) {
    uiState.selectedIndex = [newIndex];
    fixScrolling(newIndex);
  }
};

const onArrowDownPressed = () => {
  const currentIndex = uiState.selectedIndex[0] || 0;
  const newIndex =
    currentIndex + 1 >
    (uiState.contentType === "library"
      ? paperState.count
      : feedState.entitiesCount) -
      1
      ? currentIndex
      : currentIndex + 1;
  if (!uiState.editViewShown && !uiState.preferenceViewShown) {
    uiState.selectedIndex = [newIndex];
    fixScrolling(newIndex);
  }
};

const fixScrolling = (index: number) => {
  const currentElement = dataView.value?.querySelector(
    `#item-${index}`
  ) as HTMLElement;
  currentElement.scrollIntoView({
    behavior: "smooth",
    block: "end",
  });
};

const onDetailPanelResized = (event: any) => {
  const width = Math.min(event[0].size ? event[0].size : 80, 95);

  preferenceService.set({ detailPanelWidth: width });
};

// ========================================================
// Register Context Menu

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
    (newValues: { value: { extID: string; scraperID: string } }) => {
      scrapeSelectedEntitiesFrom(
        `${newValues.value.extID}-${newValues.value.scraperID}`
      );
    }
  )
);

disposable(
  PLMainAPI.contextMenuService.on("dataContextMenuFuzzyScrapeClicked", () => {
    fuzzyScrapeSelectedEntities();
  })
);

disposable(
  PLMainAPI.contextMenuService.on(
    "dataContextMenuRemoveFromClicked",
    (newValues: { value: { type: CategorizerType; id: OID } }) => {
      removeSelectedEntitiesFrom(newValues.value.type, newValues.value.id);
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
  PLMainAPI.contextMenuService.on("dataContextMenuExportBibItemClicked", () => {
    exportSelectedEntities("BibItem");
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
  PLMainAPI.contextMenuService.on("dataContextMenuExportCSVClicked", () => {
    exportSelectedEntities("CSV");
  })
);

disposable(
  PLMainAPI.contextMenuService.on("feedContextMenuAddToLibraryClicked", () => {
    addSelectedFeedEntities();
  })
);

disposable(
  PLMainAPI.contextMenuService.on("feedContextMenuToggleReadClicked", () => {
    readSelectedFeedEntities(null);
  })
);

// ========================================================
// Register Shortcut
disposable(
  PLMainAPI.menuService.onClick("preference", () => {
    uiState.preferenceViewShown = true;
  })
);

disposable(
  PLMainAPI.menuService.onClick("File-enter", () => {
    openSelectedEntities();
  })
);

disposable(
  PLMainAPI.menuService.onClick("File-delete", () => {
    deleteSelectedEntities();
  })
);

disposable(
  PLMainAPI.menuService.onClick("View-preview", () => {
    previewSelectedEntities();
  })
);

disposable(
  shortcutService.updateWorkingViewScope(shortcutService.viewScope.MAIN)
);

disposable(
  shortcutService.register(
    `${cmdOrCtrl}+A`,
    () => {
      selectAllEntities();
    },
    true,
    true
  )
);

disposable(
  shortcutService.register(
    "Command+,",
    () => {
      PLMainAPI.menuService.click("preference");
    },
    true,
    true
  )
);

disposable(
  shortcutService.register(
    "Command+W",
    () => {
      PLMainAPI.windowProcessManagementService.hide(Process.renderer, true);
    },
    true,
    true,
    shortcutService.viewScope.GLOBAL
  )
);

disposable(
  shortcutService.register(
    "Down",
    () => {
      PLMainAPI.menuService.click("View-next");
    },
    true,
    true
  )
);

disposable(
  shortcutService.register(
    "Up",
    () => {
      PLMainAPI.menuService.click("View-previous");
    },
    true,
    true
  )
);

disposable(
  PLMainAPI.menuService.onClick("File-importFrom", () => {
    importFilesFromPicker();
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
disposable(shortcutService.register("ArrowUp", onArrowUpPressed, true));

disposable(PLMainAPI.menuService.onClick("View-next", onArrowDownPressed));
disposable(shortcutService.register("ArrowDown", onArrowDownPressed, true));

// =======================================
// Register State Changes
// =======================================
disposable(
  uiStateService.onChanged(
    ["selectedIndex", "entitiesReloaded"],
    reloadSelectedEntities
  )
);

disposable(
  preferenceService.onChanged(
    ["mainviewSortBy", "mainviewSortOrder"],
    clearSelected
  )
);

disposable(
  uiStateService.onChanged(
    [
      "contentType",
      "selectedFeed",
      "querySentencesSidebar",
      "querySentenceCommandbar",
    ],
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
          :disableSingleBtn="uiState.selectedIndex.length !== 1"
          :disableMultiBtn="uiState.selectedIndex.length === 0"
          @event:click="onMenuButtonClicked"
        />
        <div id="main-view" class="h-full w-full" ref="dataView">
          <splitpanes @resized="onDetailPanelResized($event)">
            <pane
              :key="1"
              :size="
                uiState.selectedPaperEntities.length === 1 ||
                uiState.selectedFeedEntities.length === 1 ||
                uiState.showingCandidatesId !== ''
                  ? prefState.detailPanelWidth
                  : 100
              "
            >
              <PaperDataView
                v-if="uiState.contentType === 'library'"
                class="h-full w-full"
              />
              <FeedDataView
                v-else-if="uiState.contentType === 'feed'"
                class="h-full w-full"
              />
            </pane>
            <pane
              :key="2"
              :size="
                uiState.selectedPaperEntities.length === 1 ||
                uiState.selectedFeedEntities.length === 1 ||
                uiState.showingCandidatesId !== ''
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
                :slot1="uiSlotState.paperDetailsPanelSlot1"
                :slot2="uiSlotState.paperDetailsPanelSlot2"
                :slot3="uiSlotState.paperDetailsPanelSlot3"
                v-show="
                  uiState.selectedPaperEntities.length === 1 &&
                  !uiState.showingCandidatesId
                "
                v-if="uiState.contentType === 'library'"
              />

              <CandidateView
                v-if="uiState.contentType === 'library'"
                v-show="uiState.showingCandidatesId"
                :id="uiState.showingCandidatesId"
                :candidates="
                  uiState.metadataCandidates[uiState.showingCandidatesId]
                "
              />

              <FeedDetailView
                :entity="
                  uiState.selectedFeedEntities.length === 1
                    ? uiState.selectedFeedEntities[0]
                    : selectedFeedEntityPlaceHolder
                "
                v-show="uiState.selectedFeedEntities.length === 1"
                v-if="uiState.contentType === 'feed'"
                @event:add-click="addSelectedFeedEntities"
                @event:read-timeout="readSelectedFeedEntities(true)"
                @event:read-timeout-in-unread="
                  readSelectedFeedEntities(true, true)
                "
              />
            </pane>
          </splitpanes>
        </div>
      </div>
    </pane>
  </splitpanes>
</template>
