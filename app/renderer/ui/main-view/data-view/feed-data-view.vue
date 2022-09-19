<script setup lang="ts">
import { Ref, inject, onMounted, ref, watch } from "vue";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

import RecycleScroller from "@/renderer/thirdparty/virutalscroll/src/components/RecycleScroller.vue";
import { FeedEntityResults } from "@/repositories/db-repository/feed-entity-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import ListItem from "./components/list-item.vue";
import TableItem from "./components/table-item.vue";
import TableTitle from "./components/table-title.vue";

// ================================
// State
// ================================
const selectionState = MainRendererStateStore.useSelectionState();
const prefState = MainRendererStateStore.usePreferenceState();

// ================================
// Data
// ================================
const feedEntities = inject<Ref<FeedEntityResults>>("feedEntities");

const selectedIndex: Ref<number[]> = ref([]);
const selectedLastSingleIndex = ref(-1);

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

onMounted(() => {});
</script>

<template>
  <div id="data-view" class="grow pl-2">
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

    <TableTitle
      class="mb-1"
      :sortBy="prefState.mainviewSortBy"
      :sortOrder="prefState.mainviewSortOrder"
      v-if="prefState.mainviewType === 'table'"
    />
    <RecycleScroller
      class="scroller pr-2 max-h-[calc(100vh-5rem)]"
      :items="feedEntities"
      :item-size="28"
      key-field="id"
      v-slot="{ item, index }"
      :buffer="500"
      v-if="prefState.mainviewType === 'table'"
    >
      <TableItem
        :id="item.id"
        :item="item"
        :active="selectedIndex.indexOf(index) >= 0"
        :striped="index % 2 === 0"
        :read="item.read"
        @click="(e: MouseEvent) => {onItemClicked(e, index)}"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, index)}"
        @dblclick="(e: MouseEvent) => {onItemDoubleClicked(e, index, item.mainURL)}"
      />
    </RecycleScroller>
  </div>
</template>
