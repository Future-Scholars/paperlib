<script setup lang="ts">
// @ts-ignore
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { onMounted, ref, Ref } from "vue";

import { FeedEntity } from "../../../../../preload/models/FeedEntity";
import ListItem from "./components/list-item.vue";
import TableTitle from "./components/table-title.vue";
import TableItem from "./components/table-item.vue";

const props = defineProps({
  entities: Array as () => FeedEntity[],
  sortBy: {
    type: String,
    required: true,
  },
  sortOrder: {
    type: String,
    required: true,
  },
  showMainYear: Boolean,
  showMainPublication: Boolean,
  showMainPubType: Boolean,
});

const viewType = ref("list");

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
  window.appInteractor.setState(
    "selectionState.selectedIndex",
    JSON.stringify(selectedIndex.value)
  );
};

const onItemRightClicked = (event: MouseEvent, index: number) => {
  if (selectedIndex.value.indexOf(index) === -1) {
    onItemClicked(event, index);
  }
  window.appInteractor.showContextMenu(
    "show-feed-data-context-menu",
    JSON.stringify(selectedIndex.value.length === 1)
  );
};

const onItemDoubleClicked = (event: MouseEvent, index: number, url: string) => {
  selectedIndex.value = [index];
  window.appInteractor.setState(
    "selectionState.selectedIndex",
    JSON.stringify(selectedIndex.value)
  );
  window.appInteractor.open(url);
};

window.appInteractor.registerState("selectionState.selectedIndex", (value) => {
  const newSelectedIndex = JSON.parse(value as string) as number[];

  if (newSelectedIndex.length === 1 && selectedIndex.value.length === 1) {
    selectedLastSingleIndex.value = newSelectedIndex[0];
  }

  selectedIndex.value = newSelectedIndex;

  if (newSelectedIndex.length === 0) {
    selectedIndex.value = [];
  }
});

window.appInteractor.registerState("viewState.viewType", (value) => {
  viewType.value = value as string;
});

onMounted(() => {});
</script>

<template>
  <div id="data-view" class="grow pl-2">
    <TableTitle
      :sortBy="sortBy"
      :sortOrder="sortOrder"
      v-if="viewType === 'table'"
    />
    <RecycleScroller
      class="scroller pr-2"
      :class="
        viewType === 'list'
          ? 'max-h-[calc(100vh-3rem)]'
          : 'max-h-[calc(100vh-5rem)]'
      "
      :items="entities"
      :item-size="viewType === 'list' ? 64 : 28"
      key-field="id"
      v-slot="{ item, index }"
    >
      <ListItem
        :id="item.id"
        :title="item.title"
        :authors="item.authors"
        :year="showMainYear ? item.pubTime : ''"
        :publication="showMainPublication ? item.publication : ''"
        :pubType="showMainPubType ? item.pubType : -1"
        :flag="false"
        :rating="0"
        :tags="[]"
        :folders="[]"
        :note="''"
        :read="item.read"
        :active="selectedIndex.indexOf(index) >= 0"
        @click="(e: MouseEvent) => {onItemClicked(e, index)}"
        v-if="viewType === 'list'"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, index)}"
        @dblclick="(e: MouseEvent) => {onItemDoubleClicked(e, index, item.mainURL)}"
      />
      <TableItem
        :id="item.id"
        :title="item.title"
        :authors="item.authors"
        :year="item.pubTime"
        :publication="item.publication"
        :flag="item.flag"
        :active="selectedIndex.indexOf(index) >= 0"
        @click="(e: MouseEvent) => {onItemClicked(e, index)}"
        :class="
          index % 2 === 1
            ? 'bg-neutral-100 dark:bg-neutral-700 dark:bg-opacity-40'
            : ''
        "
        v-if="viewType === 'table'"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, index)}"
        @dblclick="(e: MouseEvent) => {onItemDoubleClicked(e, index, item.mainURL)}"
      />
    </RecycleScroller>
  </div>
</template>
