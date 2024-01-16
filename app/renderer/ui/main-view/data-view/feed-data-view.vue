<script setup lang="ts">
import { Ref, computed, inject, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { isEqual } from "lodash-es";

import { disposable } from "@/base/dispose";
import { IFeedEntityCollection } from "@/repositories/db-repository/feed-entity-repository";

import FeedTableView from "./components/table-view/feed-table-view.vue";

// ================================
// State
// ================================
const prefState = preferenceService.useState();
const uiState = uiStateService.useState();

const i18n = useI18n();

// ================================
// Data
// ================================
const feedEntities = inject<Ref<IFeedEntityCollection>>("feedEntities")!;
const fieldEnable = {
  pubTime: true,
  publication: true,
  pubType: true,
  addTime: true,
};
const fieldLabel = computed(() => {
  const labels = {
    title: i18n.t("mainview.title"),
    authors: i18n.t("mainview.authors"),
    publication: i18n.t("mainview.publicationtitle"),
    pubTime: i18n.t("mainview.pubyear"),
    pubType: i18n.t("mainview.pubtype"),
    addTime: i18n.t("mainview.addtime"),
  };
  return labels;
});
const fieldWidth = ref({});

const calTableFieldWidth = (reset = false) => {
  if (reset) {
    preferenceService.set({
      feedTitleWidth: -1,
      feedAuthorsWidth: -1,
      feedYearWidth: -1,
      feedPublicationWidth: -1,
      feedPubTypeWidth: -1,
      feedAddTimeWidth: -1,
    });
  }

  const keyPrefMap: Record<string, Record<string, string>> = {
    title: { widthKey: "feedTitleWidth" },
    authors: { widthKey: "feedAuthorsWidth" },
    publication: {
      widthKey: "feedPublicationWidth",
    },
    pubTime: { widthKey: "feedYearWidth" },
    pubType: { widthKey: "feedPubTypeWidth" },
    addTime: { widthKey: "feedAddTimeWidth" },
  };

  let totalWidth = 0;
  let autoWidthNumber = 0;

  const fieldWidthBuffer: Record<string, number> = {};

  for (const [key, prefKey] of Object.entries(keyPrefMap)) {
    const prefWidth = prefState[prefKey.widthKey];

    if (prefWidth !== -1) {
      fieldWidthBuffer[key] = prefWidth;
      totalWidth += prefWidth;
    } else {
      autoWidthNumber += 1;
    }
  }

  // Calculate the width percentage of each column
  const autoWidth = (100 - totalWidth) / autoWidthNumber;
  for (const [key, prefKey] of Object.entries(keyPrefMap)) {
    const prefWidth = prefState[prefKey.widthKey];

    if (prefWidth === -1) {
      fieldWidthBuffer[key] = autoWidth;
    }
  }

  let restWidth = 0;
  for (const [key, width] of Object.entries(fieldWidthBuffer)) {
    restWidth += width;
  }
  restWidth = 100 - restWidth;
  fieldWidthBuffer.title += restWidth;

  fieldWidth.value = fieldWidthBuffer;
};

// ================================
// Event Handler
// ================================
const onItemClicked = async (selectedIndex: number[]) => {
  if (isEqual(new Set(uiState.selectedIndex), new Set(selectedIndex))) {
    return;
  }

  uiState.selectedIndex = selectedIndex;
};

const onItemRightClicked = (selectedIndex: number[]) => {
  onItemClicked(selectedIndex);

  PLMainAPI.contextMenuService.showFeedDataMenu();
};

const onItemDoubleClicked = async (selectedIndex: number[]) => {
  onItemClicked(selectedIndex);

  const fileURL = feedEntities.value[selectedIndex[0]].mainURL;
  fileService.open(fileURL);
};

const onTableHeaderClicked = (key: string) => {
  if (key === "tags" || key === "folders") {
    return;
  }
  preferenceService.set({ mainviewSortBy: key });
  preferenceService.set({
    mainviewSortOrder: prefState.mainviewSortOrder === "asce" ? "desc" : "asce",
  });
};

const onTableHeaderWidthChanged = (
  changedWidths: { key: string; width: number }[]
) => {
  const keyPrefMap = {
    title: "feedTitleWidth",
    authors: "feedAuthorsWidth",
    publication: "feedPublicationWidth",
    pubTime: "feedYearWidth",
    pubType: "feedPubTypeWidth",
    addTime: "feedAddTimeWidth",
  } as Record<string, string>;
  const patch = {};
  for (const changedWidth of changedWidths) {
    patch[keyPrefMap[changedWidth.key]] = changedWidth.width;
  }
  preferenceService.set(patch);
  calTableFieldWidth();
};

disposable(
  preferenceService.onChanged(
    [
      "showMainYear",
      "showMainPublication",
      "showMainPubType",
      "showMainAddTime",
    ],
    () => calTableFieldWidth(true)
  )
);

onMounted(() => {
  calTableFieldWidth();
});
</script>

<template>
  <div id="feed-view" class="px-2">
    <FeedTableView
      id="table-feed-view"
      class="w-full max-h-[calc(100vh-4rem)]"
      :entities="feedEntities"
      :field-enable="fieldEnable"
      :field-label="fieldLabel"
      :field-width="fieldWidth"
      :selected-index="uiState.selectedIndex"
      :platform="uiState.os"
      :entity-sort-by="prefState.mainviewSortBy"
      :entity-sort-order="prefState.mainviewSortOrder"
      @event:click="onItemClicked"
      @event:contextmenu="onItemRightClicked"
      @event:dblclick="onItemDoubleClicked"
      @event:header-click="onTableHeaderClicked"
      @event:header-width-change="onTableHeaderWidthChanged"
    />
  </div>
</template>
