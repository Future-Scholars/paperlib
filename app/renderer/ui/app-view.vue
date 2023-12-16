<script setup lang="ts">
import { Ref, computed, nextTick, onMounted, provide, ref } from "vue";

import { disposable } from "@/base/dispose";
import { removeLoading } from "@/preload/loading";
import { ICategorizerResults } from "@/repositories/db-repository/categorizer-repository";
import { IFeedEntityResults } from "@/repositories/db-repository/feed-entity-repository";
import { IFeedResults } from "@/repositories/db-repository/feed-repository";
import { IPaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import { IPaperSmartFilterResults } from "@/repositories/db-repository/smartfilter-repository";

import DeleteConfirmView from "./delete-confirm-view/delete-confirm-view.vue";
import DevView from "./dev-view/dev-view.vue";
import EditView from "./edit-view/edit-view.vue";
import FeedEditView from "./edit-view/feed-edit-view.vue";
import PaperSmartFilterEditView from "./edit-view/smartfilter-edit-view.vue";
import MainView from "./main-view/main-view.vue";
import PreferenceView from "./preference-view/preference-view.vue";
import PresettingView from "./presetting-view/presetting-view.vue";
import WhatsNewView from "./whats-new-view/whats-new-view.vue";

// ================================
// State
// ================================

const uiState = uiStateService.useState();
const prefState = preferenceService.useState();

// ================================
// Data
// ================================
const paperEntities: Ref<IPaperEntityResults> = ref([]);
provide(
  "paperEntities",
  computed(() => paperEntities.value) as Ref<IPaperEntityResults> // TODO: ?
);
const tags: Ref<ICategorizerResults> = ref([]);
provide("tags", tags);
const folders: Ref<ICategorizerResults> = ref([]);
provide("folders", folders);
const smartfilters: Ref<IPaperSmartFilterResults> = ref([]);
provide("smartfilters", smartfilters);
const feeds: Ref<IFeedResults> = ref([]);
provide("feeds", feeds);
const feedEntities: Ref<IFeedEntityResults> = ref([]);
provide(
  "feedEntities",
  computed(() => feedEntities.value)
);

// ================================
// Data load
// ================================
const reloadPaperEntities = async () => {
  let flaged = false;

  let tag = "";
  let folder = "";

  // TODO: should we clear the search text when switching categorizer?
  if (uiState.selectedCategorizer.startsWith("tag-")) {
    tag = uiState.selectedCategorizer.replace("tag-", "");
    // viewState.searchText = "";
    // viewState.searchMode = "general";
  } else if (uiState.selectedCategorizer.startsWith("folder-")) {
    folder = uiState.selectedCategorizer.replace("folder-", "");
    // viewState.searchText = "";
    // viewState.searchMode = "general";
  } else if (uiState.selectedCategorizer === "lib-flaged") {
    flaged = true;
    // viewState.searchText = "";
    // viewState.searchMode = "general";
  }
  paperEntities.value = await paperService.load(
    paperService.constructFilter({
      search: uiState.commandBarText,
      searchMode: uiState.commandBarMode,
      flaged,
      tag: tag,
      folder: folder,
    }),
    prefState.mainviewSortBy,
    prefState.mainviewSortOrder
  );
};
disposable(
  paperService.on("updated", () => {
    reloadPaperEntities();
  })
);
disposable(
  paperService.on("count", (value) => {
    uiState.entitiesCount = value.value;
  })
);

const reloadTags = async () => {
  tags.value = await categorizerService.load(
    "PaperTag",
    prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
};
disposable(categorizerService.on("tagsUpdated", () => reloadTags()));

const reloadFolders = async () => {
  folders.value = await categorizerService.load(
    "PaperFolder",
    prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
};
disposable(categorizerService.on("foldersUpdated", () => reloadFolders()));

const reloadPaperSmartFilters = async () => {
  smartfilters.value = await smartFilterService.load(
    "PaperPaperSmartFilter",
    prefState.sidebarSortBy === "count" ? "name" : prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
};
disposable(smartFilterService.on("updated", () => reloadPaperSmartFilters()));

const reloadFeeds = async () => {
  const results = await feedService.load(
    prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
  feeds.value = results;
};
disposable(feedService.on("updated", () => reloadFeeds()));

const reloadFeedEntities = async () => {
  let feed = "";
  let unread = false;

  if (uiState.selectedFeed === "feed-all") {
    feed = "";
  } else if (uiState.selectedFeed === "feed-unread") {
    unread = true;
    feed = "";
  } else {
    feed = uiState.selectedFeed.replace("feed-", "");
  }

  // TODO: fix any here
  feedEntities.value = await feedService.loadEntities(
    feedService.constructFilter({
      search: uiState.commandBarText,
      searchMode: uiState.commandBarMode as any,
      feedName: feed,
      unread,
    }),
    prefState.mainviewSortBy,
    prefState.mainviewSortOrder
  );
};
disposable(feedService.on("entitiesUpdated", () => reloadFeedEntities()));

// ================================
// Register State
// ================================
disposable(
  preferenceService.onChanged(
    ["mainviewSortBy", "mainviewSortOrder"],
    (value) => {
      if (uiState.contentType === "library") {
        reloadPaperEntities();
      } else if (uiState.contentType === "feed") {
        reloadFeedEntities();
      }
    }
  )
);
disposable(
  preferenceService.onChanged(
    ["sidebarSortBy", "sidebarSortOrder"],
    (value) => {
      reloadTags();
      reloadFolders();
      reloadPaperSmartFilters();
    }
  )
);

disposable(
  uiStateService.onChanged(["selectedCategorizer", "selectedFeed"], (value) => {
    if (uiState.contentType === "library") {
      reloadPaperEntities();
    } else if (uiState.contentType === "feed") {
      reloadFeedEntities();
    }
  })
);

disposable(
  uiStateService.onChanged(["contentType", "commandBarText"], (value) => {
    if (uiState.contentType === "library") {
      reloadPaperEntities();
    } else if (uiState.contentType === "feed") {
      reloadFeedEntities();
    }
  })
);

disposable(
  preferenceService.onChanged("appLibFolder", async (value) => {
    await databaseService.initialize();
  })
);

var initStartTime = Date.now();
disposable(
  databaseService.on("dbInitializing", async () => {
    initStartTime = Date.now();

    uiStateService.resetStates();

    paperEntities.value = [];
    tags.value = [];
    folders.value = [];
    feeds.value = [];
    feedEntities.value = [];
  })
);
disposable(
  databaseService.on("dbInitialized", async () => {
    await reloadPaperEntities();
    await reloadTags();
    await reloadFolders();
    await reloadPaperSmartFilters();
    removeLoading();
    reloadFeedEntities();
    reloadFeeds();
    var endTime = Date.now();
    logService.info(
      `Database initialized in ${endTime - initStartTime}ms`,
      "",
      false,
      "UI"
    );

    // Notify the main process that the app is ready,
    //   so that the main process can initialize the extension process
    // TODO: check if there is a way to do this without providing the processID manually.
    PLMainAPI.windowProcessManagementService.fireServiceReady(
      "rendererProcess"
    );
  })
);

// TODO: Check all event disposable
disposable(
  PLMainAPI.windowProcessManagementService.on("blur", () => {
    uiState.mainViewFocused = false;
    databaseService.pauseSync();
  })
);

disposable(
  PLMainAPI.windowProcessManagementService.on("focus", () => {
    uiState.mainViewFocused = true;
    databaseService.resumeSync();
  })
);

disposable(
  PLMainAPI.upgradeService.on("downloading", (newValue: { value: number }) => {
    logService.progress(
      "Downloading Update...",
      newValue.value,
      true,
      "Version"
    );
  })
);

// ================================
// Dev Functions
// ================================
const onAddDummyClicked = async () => {
  paperService.addDummyData();
};
const onAddFromFileClicked = async () => {
  await paperService.create([`${process.cwd()}/tests/pdfs/cs/1.pdf`]);
};
const onAddFromFilesClicked = async () => {
  await paperService.create([
    `${process.cwd()}/tests/pdfs/cs/1.pdf`,
    `${process.cwd()}/tests/pdfs/cs/2.pdf`,
  ]);
};
const onRemoveAllClicked = async () => {
  paperService.removeAll();
};
const onReloadAllClicked = async () => {
  await reloadPaperEntities();
  await reloadTags();
  await reloadFolders();
  await reloadPaperSmartFilters();
};
const onPrintClicked = () => {
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
const onNotifyInfoClicked = () => {
  const randomString = Math.random().toString(36).slice(-8);
  logService.info(randomString, "additional info", true, "DEVLOG");
};
const onNotifyWarnClicked = () => {
  const randomString = Math.random().toString(36).slice(-8);
  logService.warn(randomString, "additional info", true, "DEVLOG");
};
const onNotifyErrorClicked = () => {
  const randomString = Math.random().toString(36).slice(-8);
  logService.error(randomString, "additional info", true, "DEVLOG");
};
const onNotifyProgressClicked = () => {
  const randomNumber = Math.floor(Math.random() * 100);
  logService.progress("Progress...", randomNumber, true, "DEVLOG");
};

const isWhatsNewShown = ref(false);

disposable(
  preferenceService.onChanged(["lastVersion"], async () => {
    isWhatsNewShown.value =
      prefState.lastVersion !==
      (await PLMainAPI.upgradeService.currentVersion());
  })
);

// ================================
// Mount Hook
// ================================
onMounted(async () => {
  nextTick(async () => {
    isWhatsNewShown.value =
      prefState.lastVersion !==
      (await PLMainAPI.upgradeService.currentVersion());

    await databaseService.initialize(true);
  });
});

// TODO: check all vue files' ending
</script>

<template>
  <div class="flex text-neutral-700 dark:text-neutral-200">
    <DevView
      @event:add-dummy="onAddDummyClicked"
      @event:add-from-file="onAddFromFileClicked"
      @event:add-from-files="onAddFromFilesClicked"
      @event:remove-all="onRemoveAllClicked"
      @event:reload-all="onReloadAllClicked"
      @event:print="onPrintClicked"
      @event:notify-info="onNotifyInfoClicked"
      @event:notify-warn="onNotifyWarnClicked"
      @event:notify-error="onNotifyErrorClicked"
      @event:notify-progress="onNotifyProgressClicked"
      v-if="uiState.isDevMode"
    />

    <MainView />

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <EditView v-if="uiState.isEditViewShown" />
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <FeedEditView v-if="uiState.isFeedEditViewShown" />
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <PaperSmartFilterEditView
        v-if="uiState.isPaperSmartFilterEditViewShown"
      />
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <PreferenceView v-if="uiState.isPreferenceViewShown" />
    </Transition>

    <DeleteConfirmView />

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <PresettingView
        v-if="
          prefState.showPresettingLang ||
          prefState.showPresettingScraper ||
          prefState.showPresettingDB
        "
      />
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <WhatsNewView v-if="isWhatsNewShown" />
    </Transition>
  </div>
</template>
