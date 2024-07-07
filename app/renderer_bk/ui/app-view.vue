<script setup lang="ts">
import { Ref, computed, nextTick, onMounted, provide, ref } from "vue";

import { disposable } from "@/base/dispose";
import { removeLoading } from "@/preload/loading";
import { FeedEntityFilterOptions } from "@/renderer/services/feed-service";
import { ICategorizerCollection } from "@/repositories/db-repository/categorizer-repository";
import { IFeedEntityCollection } from "@/repositories/db-repository/feed-entity-repository";
import { IFeedCollection } from "@/repositories/db-repository/feed-repository";
import { IPaperEntityCollection } from "@/repositories/db-repository/paper-entity-repository";
import { IPaperSmartFilterCollection } from "@/repositories/db-repository/smartfilter-repository";
import { PaperEntity } from "@/models/paper-entity";
import { Process } from "@/base/process-id";
import { CategorizerType } from "@/models/categorizer";
import { PaperSmartFilterType } from "@/models/smart-filter";

import DeleteConfirmView from "./delete-confirm-view/delete-confirm-view.vue";
import DevView from "./dev-view/dev-view.vue";
import EditView from "./edit-view/edit-view.vue";
import FeedEditView from "./edit-view/feed-edit-view.vue";
import PaperSmartFilterEditView from "./edit-view/smartfilter-edit-view.vue";
import MainView from "./main-view/main-view.vue";
import PreferenceView from "./preference-view/preference-view.vue";
import PresettingView from "./presetting-view/presetting-view.vue";
import WhatsNewView from "./whats-new-view/whats-new-view.vue";
import WelcomeView from "./welcome-view/welcome-view.vue";
import OverlayNotificationView from "./overlay-notification-view/overlay-notification-view.vue";
import GuideView from "./guide-view/guide-view.vue";

// ================================
// State
// ================================

const uiState = uiStateService.useState();
const prefState = preferenceService.useState();

// ================================
// Data
// ================================
const paperEntities: Ref<IPaperEntityCollection> = ref([]);
provide(
  "paperEntities",
  computed(() => paperEntities.value) as Ref<IPaperEntityCollection>
);
const tags: Ref<ICategorizerCollection> = ref([]);
provide("tags", tags);
const folders: Ref<ICategorizerCollection> = ref([]);
provide("folders", folders);
const smartfilters: Ref<IPaperSmartFilterCollection> = ref([]);
provide("smartfilters", smartfilters);

const feeds: Ref<IFeedCollection> = ref([]);
provide("feeds", feeds);
const feedEntities: Ref<IFeedEntityCollection> = ref([]);
provide(
  "feedEntities",
  computed(() => feedEntities.value)
);

// ================================
// Data load
// ================================
const reloadPaperEntities = async () => {
  let querySentence: string;
  let fulltextQuerySetence: string | undefined = undefined;
  if (uiState.querySentenceCommandbar.includes("(fulltext contains")) {
    querySentence = uiState.querySentencesSidebar.map((x) => `(${x})`).join(" AND ");
    fulltextQuerySetence = uiState.querySentenceCommandbar;
  } else {
    querySentence = [
      uiState.querySentenceCommandbar,
      ...uiState.querySentencesSidebar,
    ]
      .filter((x) => x)
      .map((x) => `(${x})`)
      .join(" AND ");
  }

  paperEntities.value = await paperService.load(
    querySentence,
    prefState.mainviewSortBy,
    prefState.mainviewSortOrder,
    fulltextQuerySetence
  );

  uiStateService.fire({ entitiesReloaded: Date.now() });
};
disposable(
  paperService.on("updated", () => {
    reloadPaperEntities();
  })
);

const reloadTags = async () => {
  tags.value = await categorizerService.load(
    CategorizerType.PaperTag,
    prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
};
disposable(categorizerService.on("tagsUpdated", () => reloadTags()));

const reloadFolders = async () => {
  folders.value = await categorizerService.load(
    CategorizerType.PaperFolder,
    prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
};
disposable(categorizerService.on("foldersUpdated", () => reloadFolders()));

const reloadPaperSmartFilters = async () => {
  smartfilters.value = await smartFilterService.load(
    PaperSmartFilterType.smartfilter,
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
  let feedName = "";
  let unread = false;

  if (uiState.selectedFeed === "feed-all") {
    feedName = "";
  } else if (uiState.selectedFeed === "feed-unread") {
    unread = true;
    feedName = "";
  } else {
    feedName = uiState.selectedFeed.replace("feed-", "");
  }

  feedEntities.value = await feedService.loadEntities(
    new FeedEntityFilterOptions({
      search: uiState.commandBarText,
      searchMode: uiState.commandBarSearchMode as any,
      feedNames: feedName ? [feedName] : [],
      unread,
    }),
    prefState.mainviewSortBy,
    prefState.mainviewSortOrder
  );
  uiStateService.fire({ entitiesReloaded: Date.now() });
};
disposable(feedService.on("entitiesUpdated", () => reloadFeedEntities()));

const changeFontsize = (fontsize: string) => {
  const html = document.querySelector("html");
  if (html) {
    html.style.fontSize =
      { normal: 100, large: 115, larger: 120 }[fontsize] + "%";
  }
};

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
  uiStateService.onChanged(
    [
      "selectedFeed",
      "contentType",
      "querySentencesSidebar",
      "querySentenceCommandbar",
    ],
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
    fileService.initialize();
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
    PLMainAPI.windowProcessManagementService.fireServiceReady(Process.renderer);
  })
);

disposable(
  PLMainAPI.windowProcessManagementService.on(
    Process.renderer,
    (newValue: { value: string }) => {
      if (newValue.value === "blur") {
        uiState.mainViewFocused = false;
        databaseService.pauseSync();
      } else if (newValue.value === "focus") {
        uiState.mainViewFocused = true;
        databaseService.resumeSync();
      }
    }
  )
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

disposable(
  preferenceService.onChanged("fontsize", (newValue) => {
    changeFontsize(newValue.value);
  })
);

disposable(
  preferenceService.onChanged("sourceFileOperation", (newValue) => {
    fileService.initialize();
  })
);

// ================================
// Dev Functions
// ================================
const onAddDummyClicked = async () => {
  const dummpyPaperEntities: PaperEntity[] = [];

  for (
    let i = paperEntities.value.length;
    i < 100 + paperEntities.value.length;
    i++
  ) {
    const dummyPaperEntity = new PaperEntity(
      {
        title: `Dummy Paper <scp>D</scp>-${i}<sup>+T</sup> Test latex $^${i}_{a}$`,
        authors: "Dummy Author A, Dummy Author B, Dummy Author C",
        pubTime: `${Math.round(2021 + Math.random() * 10)}`,
        publication: `Publication ${Math.round(Math.random() * 10)}`,
      },
      true
    );
    dummpyPaperEntities.push(dummyPaperEntity);
  }

  await paperService.update(dummpyPaperEntities);
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

let clickTimes = 0;
let clickTimer: NodeJS.Timeout | null = null;
const onRemoveAllClicked = async () => {
  if (clickTimes < 5) {
    clickTimes++;

    if (!clickTimer) {
      clickTimer = setTimeout(() => {
        clickTimes = 0;
        clickTimer = null;
      }, 2000);
    }

    return;
  } else {
    paperService.delete(paperEntities.value.map((x) => x.id));
    clickTimes = 0;
  }
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
  console.log(tags.value);

  console.log("folders ========");
  console.log(folders.value);
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
    changeFontsize(prefState.fontsize);

    isWhatsNewShown.value =
      prefState.lastVersion !==
      (await PLMainAPI.upgradeService.currentVersion());

    await databaseService.initialize(true);
  });
});
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
      <EditView v-if="uiState.editViewShown" />
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <FeedEditView v-if="uiState.feedEditViewShown" />
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <PaperSmartFilterEditView v-if="uiState.paperSmartFilterEditViewShown" />
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <PreferenceView v-if="uiState.preferenceViewShown" />
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <DeleteConfirmView v-if="uiState.deleteConfirmShown" />
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <OverlayNotificationView v-if="uiState.overlayNoticationShown" />
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <GuideView v-if="prefState.showGuide" />
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <PresettingView v-if="prefState.showPresetting" />
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

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <WelcomeView v-if="prefState.showWelcome" />
    </Transition>
  </div>
</template>
