<script setup lang="ts">
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { ref, Ref } from "vue";

import { PaperEntity } from "../../../../../preload/models/PaperEntity";
import ListItem from "./components/list-item.vue";
import TableTitle from "./components/table-title.vue";
import TableItem from "./components/table-item.vue";

const props = defineProps({
  entities: Array as () => PaperEntity[],
  sortBy: {
    type: String,
    required: true,
  },
  sortOrder: {
    type: String,
    required: true,
  },
});

const viewType = ref("list");

const selectedIndex: Ref<number[]> = ref([]);
const selectedLastSingleIndex = ref(-1);

const onItemClick = (event: MouseEvent, index: number) => {
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

window.appInteractor.registerState("selectionState.selectedIndex", (value) => {
  const newSelectedIndex = JSON.parse(value as string) as number[];
  if (newSelectedIndex.length === 0) {
    selectedIndex.value = [];
  }
});

window.appInteractor.registerState("viewState.viewType", (value) => {
  viewType.value = JSON.parse(value as string);
});
</script>

<template>
  <div class="grow pl-2">
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
        :title="item.title"
        :authors="item.authors"
        :year="item.pubTime"
        :publication="item.publication"
        :flag="item.flag"
        :active="selectedIndex.indexOf(index) >= 0"
        @click="(e: MouseEvent) => {onItemClick(e, index)}"
        v-if="viewType === 'list'"
      />
      <TableItem
        :title="item.title"
        :authors="item.authors"
        :year="item.pubTime"
        :publication="item.publication"
        :flag="item.flag"
        :active="selectedIndex.indexOf(index) >= 0"
        @click="(e: MouseEvent) => {onItemClick(e, index)}"
        :class="index % 2 === 1 ? 'bg-neutral-100' : ''"
        v-if="viewType === 'table'"
      />
    </RecycleScroller>
  </div>
</template>
