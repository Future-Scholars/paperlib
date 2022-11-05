<script setup lang="ts">
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

import RecycleScroller from "@/renderer/thirdparty/virutalscroll/src/components/RecycleScroller.vue";
import { FeedEntityResults } from "@/repositories/db-repository/feed-entity-repository";
import { PaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import TableItem from "./table-item.vue";
import TableTitle from "./table-title.vue";

const props = defineProps({
  titleColumns: {
    type: Object as () => Record<string, { name: string; width: number }>,
    required: true,
  },
  dataRows: {
    type: Object as () => PaperEntityResults | FeedEntityResults,
    required: true,
  },
  isFeedTable: {
    type: Boolean,
    required: false,
  },
});

// ================================
// State
// ================================
const selectionState = MainRendererStateStore.useSelectionState();
const prefState = MainRendererStateStore.usePreferenceState();

// ================================
// Data
// ================================

const emits = defineEmits([
  "title-clicked",
  "title-width-changed",
  "row-dragged",
  "row-clicked",
  "row-double-clicked",
  "row-right-clicked",
]);

const onItemClicked = (event: MouseEvent, index: number) => {
  emits("row-clicked", event, index);
};

const onItemRightClicked = (event: MouseEvent, index: number) => {
  emits("row-right-clicked", event, index);
};

const onItemDoubleClicked = (event: MouseEvent, index: number, url: string) => {
  emits("row-double-clicked", event, index, url);
};

const dragHandler = (event: DragEvent) => {
  emits("row-dragged", event);
};
</script>

<template>
  <div class="h-full flex flex-col">
    <TableTitle
      class="mb-1"
      :sortBy="prefState.mainviewSortBy"
      :sortOrder="prefState.mainviewSortOrder"
      :titles="titleColumns"
      @title-clicked="(e) => emits('title-clicked', e)"
      @title-width-changed="(e) => emits('title-width-changed', e)"
      v-if="
        prefState.mainviewType === 'table' ||
        prefState.mainviewType === 'tableandpreview'
      "
    />
    <RecycleScroller
      id="table-data-view"
      class="scroller h-full"
      :items="dataRows"
      :item-size="28"
      key-field="id"
      v-slot="{ item, index }"
      :buffer="500"
    >
      <TableItem
        :id="item.id"
        :item="item"
        :titles="titleColumns"
        :active="selectionState.selectedIndex.indexOf(index) >= 0"
        :showPubTime="prefState.showMainYear"
        :showPublication="prefState.showMainPublication"
        :showRating="isFeedTable ? false : prefState.showMainRating"
        :showPubType="prefState.showMainPubType"
        :showTags="isFeedTable ? false : prefState.showMainTags"
        :showFolders="isFeedTable ? false : prefState.showMainFolders"
        :showNote="isFeedTable ? false : prefState.showMainNote"
        :showFlag="isFeedTable ? false : prefState.showMainFlag"
        :showAddTime="prefState.showMainAddTime"
        :read="isFeedTable ? item.read : true"
        :striped="index % 2 === 0"
        @click="(e: MouseEvent) => {onItemClicked(e, index)}"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, index)}"
        @dblclick="(e: MouseEvent) => {onItemDoubleClicked(e, index, item.mainURL)}"
        draggable="true"
        v-on:dragstart="dragHandler"
      />
    </RecycleScroller>
  </div>
</template>
