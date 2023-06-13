<script setup lang="ts">
import { Ref, inject, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { FeedEntityResults } from "@/repositories/db-repository/feed-entity-repository";
import { IPreferenceStore } from "@/services/preference-service";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import ListItem from "./components/list-item.vue";
import TableComponent from "./components/table/table-component.vue";

// ================================
// State
// ================================
const selectionState = MainRendererStateStore.useSelectionState();
const prefState = preferenceService.useState();
const i18n = useI18n();

// ================================
// Data
// ================================
const feedEntities = inject<Ref<FeedEntityResults>>("feedEntities");

const selectedIndex: Ref<number[]> = ref([]);
const selectedLastSingleIndex = ref(-1);

const tableTitleColumns: Ref<Record<string, { name: string; width: number }>> =
  ref({});

const resetTableTitleColumns = (reset = false) => {
  if (reset) {
    preferenceService.set({
      mainTitleWidth: -1,
      mainAuthorsWidth: -1,
      mainPublicationWidth: -1,
      mainYearWidth: -1,
      mainPubTypeWidth: -1,
      mainTagsWidth: -1,
      mainFoldersWidth: -1,
      mainNoteWidth: -1,
      mainRatingWidth: -1,
      mainFlagWidth: -1,
      mainAddTimeWidth: -1,
      feedTitleWidth: -1,
      feedAuthorsWidth: -1,
      feedYearWidth: -1,
      feedPublicationWidth: -1,
      feedPubTypeWidth: -1,
      feedAddTimeWidth: -1,
    });
  }

  let totalWidth =
    (prefState.feedTitleWidth === -1 ? 0 : prefState.feedTitleWidth) +
    (prefState.feedAuthorsWidth === -1 ? 0 : prefState.feedAuthorsWidth);
  let emptyWidthCount =
    (prefState.feedTitleWidth === -1 ? 1 : 0) +
    (prefState.feedAuthorsWidth === -1 ? 1 : 0);

  var newTitleColumns = {
    title: { name: i18n.t("mainview.title"), width: prefState.feedTitleWidth },
    authors: {
      name: i18n.t("mainview.authors"),
      width: prefState.feedAuthorsWidth,
    },
  } as Record<string, { name: string; width: number }>;

  if (prefState.showMainPublication) {
    newTitleColumns["publication"] = {
      name: i18n.t("mainview.publicationtitle"),
      width: prefState.feedPublicationWidth,
    };
    totalWidth +=
      prefState.feedPublicationWidth === -1
        ? 0
        : prefState.feedPublicationWidth;
    emptyWidthCount += prefState.feedPublicationWidth === -1 ? 1 : 0;
  }
  if (prefState.showMainYear) {
    newTitleColumns["pubTime"] = {
      name: i18n.t("mainview.pubyear"),
      width: prefState.feedYearWidth,
    };
    totalWidth += prefState.feedYearWidth === -1 ? 0 : prefState.feedYearWidth;
    emptyWidthCount += prefState.feedYearWidth === -1 ? 1 : 0;
  }
  if (prefState.showMainPubType) {
    newTitleColumns["pubType"] = {
      name: i18n.t("mainview.pubtype"),
      width: prefState.feedPubTypeWidth,
    };
    totalWidth +=
      prefState.feedPubTypeWidth === -1 ? 0 : prefState.feedPubTypeWidth;
    emptyWidthCount += prefState.feedPubTypeWidth === -1 ? 1 : 0;
  }
  if (prefState.showMainAddTime) {
    newTitleColumns["addTime"] = {
      name: i18n.t("mainview.addtime"),
      width: prefState.feedAddTimeWidth,
    };
    totalWidth +=
      prefState.feedAddTimeWidth === -1 ? 0 : prefState.feedAddTimeWidth;
    emptyWidthCount += prefState.feedAddTimeWidth === -1 ? 1 : 0;
  }

  // Calculate the width percentage of each column
  Object.keys(newTitleColumns).forEach((key) => {
    if (newTitleColumns[key].width === -1) {
      newTitleColumns[key].width = (100 - totalWidth) / emptyWidthCount;
    }
  });

  let remainingWidth = 0;
  Object.keys(newTitleColumns).forEach((key) => {
    remainingWidth += newTitleColumns[key].width;
  });
  remainingWidth = 100 - remainingWidth;

  if (remainingWidth !== 0) {
    newTitleColumns["title"].width += remainingWidth;
  }

  tableTitleColumns.value = newTitleColumns;
};

const onTableTitleClicked = (key: string) => {
  preferenceService.set({ mainviewSortBy: key });
  preferenceService.set({
    mainviewSortOrder: prefState.mainviewSortOrder === "asce" ? "desc" : "asce",
  });
};

const onTableTitleWidthChanged = (
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
    tableTitleColumns.value[changedWidth.key].width = changedWidth.width;
    patch[keyPrefMap[changedWidth.key]] = changedWidth.width;
  }
  preferenceService.set(patch);
};

const onItemClicked = (event: MouseEvent, index: number) => {
  if (event.shiftKey) {
    const minIndex = Math.min(selectedLastSingleIndex.value, index);
    const maxIndex = Math.max(selectedLastSingleIndex.value, index);
    selectedIndex.value = [];
    for (let i = minIndex; i <= maxIndex; i++) {
      selectedIndex.value.push(i);
    }
  } else if (
    (event.ctrlKey && appService.platform() !== "darwin") ||
    (event.metaKey && appService.platform() === "darwin")
  ) {
    if (selectedIndex.value.indexOf(index) >= 0) {
      selectedIndex.value.splice(selectedIndex.value.indexOf(index), 1);
    } else {
      selectedIndex.value.push(index);
    }
  } else {
    selectedIndex.value = [index];
    selectedLastSingleIndex.value = index;
  }
  selectionState.selectedIndex = selectedIndex.value;
};

const onItemRightClicked = (event: MouseEvent, index: number) => {
  if (selectedIndex.value.indexOf(index) === -1) {
    onItemClicked(event, index);
  }
  window.appInteractor.showContextMenu(
    "show-feed-data-context-menu",
    selectedIndex.value.length === 1
  );
};

const onItemDoubleClicked = (event: MouseEvent, index: number, url: string) => {
  selectedIndex.value = [index];
  selectionState.selectedIndex = selectedIndex.value;
  window.appInteractor.open(url);
};

watch(
  () => selectionState.selectedIndex,
  (newSelectedIndex) => {
    if (newSelectedIndex.length === 1 && selectedIndex.value.length === 1) {
      selectedLastSingleIndex.value = newSelectedIndex[0];
    }

    selectedIndex.value = newSelectedIndex;

    if (newSelectedIndex.length === 0) {
      selectedIndex.value = [];
    }
  }
);

preferenceService.onChanged(
  [
    "showMainYear",
    "showMainPublication",
    "showMainPubType",
    "showMainTags",
    "showMainFolders",
    "showMainNote",
    "showMainRating",
    "showMainFlag",
    "showMainAddTime",
  ],
  () => resetTableTitleColumns(true)
);

onMounted(() => {
  resetTableTitleColumns();
});
</script>

<template>
  <div id="feed-view" class="grow pl-2">
    <RecycleScroller
      class="scroller pr-2 max-h-[calc(100vh-3rem)]"
      :items="feedEntities"
      :item-size="64"
      key-field="id"
      v-slot="{ item, index }"
      :buffer="500"
      v-if="prefState.mainviewType === 'list'"
    >
      <ListItem
        :id="item.id"
        :item="item"
        :active="selectedIndex.indexOf(index) >= 0"
        :showPubTime="prefState.showMainYear"
        :showPublication="prefState.showMainPublication"
        :showRating="false"
        :showPubType="false"
        :showTags="false"
        :showFolders="false"
        :showNote="false"
        :showFlag="false"
        :read="item.read"
        @click="(e: MouseEvent) => {onItemClicked(e, index)}"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, index)}"
        @dblclick="(e: MouseEvent) => {onItemDoubleClicked(e, index, item.mainURL)}"
      />
    </RecycleScroller>

    <TableComponent
      :title-columns="tableTitleColumns"
      :data-rows="feedEntities || []"
      :is-feed-table="true"
      @title-clicked="onTableTitleClicked"
      @title-width-changed="onTableTitleWidthChanged"
      @row-clicked="onItemClicked"
      @row-right-clicked="onItemRightClicked"
      @row-double-clicked="onItemDoubleClicked"
    />
  </div>
</template>
