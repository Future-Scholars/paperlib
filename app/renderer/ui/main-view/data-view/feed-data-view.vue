<script setup lang="ts">
import { Ref, inject, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

import RecycleScroller from "@/renderer/thirdparty/virutalscroll/src/components/RecycleScroller.vue";
import { FeedEntityResults } from "@/repositories/db-repository/feed-entity-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import ListItem from "./components/list-item.vue";
import TableComponent from "./components/table/table-component.vue";

// ================================
// State
// ================================
const selectionState = MainRendererStateStore.useSelectionState();
const prefState = MainRendererStateStore.usePreferenceState();
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
    const prefKeys = [
      "mainTitleWidth",
      "mainAuthorsWidth",
      "mainPublicationWidth",
      "mainYearWidth",
      "mainPubTypeWidth",
      "mainTagsWidth",
      "mainFoldersWidth",
      "mainNoteWidth",
      "mainRatingWidth",
      "mainFlagWidth",
      "mainAddTimeWidth",
      "feedTitleWidth",
      "feedAuthorsWidth",
      "feedYearWidth",
      "feedPublicationWidth",
      "feedPubTypeWidth",
      "feedAddTimeWidth",
    ];
    for (const key of prefKeys) {
      prefState[key] = -1;
    }
    for (const key of prefKeys) {
      window.appInteractor.setPreferenceAsync(key, -1);
    }
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
  prefState.mainviewSortBy = key;
  prefState.mainviewSortOrder =
    prefState.mainviewSortOrder === "asce" ? "desc" : "asce";
  window.appInteractor.setPreference("sortBy", key);
  window.appInteractor.setPreference("sortOrder", prefState.mainviewSortOrder);
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
  for (const changedWidth of changedWidths) {
    tableTitleColumns.value[changedWidth.key].width = changedWidth.width;
    window.appInteractor.setPreference(
      keyPrefMap[changedWidth.key],
      changedWidth.width
    );
  }
};

const onItemClicked = (event: MouseEvent, index: number) => {
  if (event.shiftKey) {
    const minIndex = Math.min(selectedLastSingleIndex.value, index);
    const maxIndex = Math.max(selectedLastSingleIndex.value, index);
    selectedIndex.value = [];
    for (let i = minIndex; i <= maxIndex; i++) {
      selectedIndex.value.push(i);
    }
  } else if (event.ctrlKey) {
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

watch(
  () => [
    prefState.showMainYear,
    prefState.showMainPublication,
    prefState.showMainPubType,
    prefState.showMainTags,
    prefState.showMainFolders,
    prefState.showMainNote,
    prefState.showMainRating,
    prefState.showMainFlag,
    prefState.showMainAddTime,
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
