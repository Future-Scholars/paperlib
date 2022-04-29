<script setup lang="ts">
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { ref, Ref } from "vue";

import { PaperEntity } from "packages/preload/models/PaperEntity";
import ListItem from "./components/list-item.vue";

const props = defineProps({
  entities: Array as () => PaperEntity[],
});

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
</script>

<template>
  <div class="grow px-2">
    <RecycleScroller
      class="scroller max-h-[calc(100vh-3rem)]"
      :items="entities"
      :item-size="64"
      key-field="id"
      v-slot="{ item, index }"
    >
      <ListItem
        :title="item.title"
        :authors="item.authors"
        :year="item.pubTime"
        :publication="item.publication"
        :active="selectedIndex.indexOf(index) >= 0"
        @click="(e: MouseEvent) => {onItemClick(e, index)}"
      />
    </RecycleScroller>
  </div>
</template>
