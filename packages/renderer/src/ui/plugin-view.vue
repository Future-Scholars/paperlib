<script setup lang="ts">
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { Ref, ref } from "vue";

import PluginTableItem from "./main-view/data-view/components/plugin-table-item.vue";

import { debounce } from "../utils/debounce";
import { PaperEntity } from "../../../preload/models/PaperEntity";

const searchText = ref("");
const searchDebounce = ref(300);
const selectedIndex: Ref<number> = ref(0);

const isNotificationShown = ref(false);

const entities: Ref<PaperEntity[]> = ref([]);

const onSearchTextChanged = debounce(async () => {
  const results = await window.pluginInteractor.search(searchText.value);
  entities.value = results;
}, searchDebounce.value);

const onInput = (payload: Event) => {
  onSearchTextChanged();
};

function shortcutHandler(event: KeyboardEvent) {
  if (event.code === "ArrowDown") {
    event.preventDefault();
    selectedIndex.value = Math.min(
      entities.value.length - 1,
      selectedIndex.value + 1
    );
  } else if (event.code === "ArrowUp") {
    event.preventDefault();
    selectedIndex.value = Math.max(0, selectedIndex.value - 1);
  } else if (event.code === "Enter") {
    event.preventDefault();
    window.pluginInteractor.export(
      JSON.stringify([entities.value[selectedIndex.value]])
    );
    isNotificationShown.value = true;
    debounce(() => {
      isNotificationShown.value = false;
      window.pluginInteractor.hide();
    }, 300)();
  }
}
window.addEventListener("keydown", shortcutHandler, true);
</script>

<template>
  <div class="w-full">
    <input
      class="w-full h-12 text-sm px-3 bg-transparent focus:outline-none"
      type="text"
      autofocus
      placeholder="Search in Paperlib..."
      v-model="searchText"
      @input="onInput"
    />
    <div class="w-full p-2">
      <RecycleScroller
        class="scroller"
        :class="'max-h-[calc(100vh-4rem)]'"
        :items="entities"
        :item-size="28"
        key-field="id"
        v-slot="{ item, index }"
      >
        <PluginTableItem
          :title="item.title"
          :authors="item.authors"
          :year="item.pubTime"
          :publication="item.publication"
          :active="selectedIndex == index"
        />
      </RecycleScroller>
    </div>

    <div
      class="fixed right-2 bottom-2 rounded-md drop-shadow-lg bg-neutral-50 p-2 text-xs"
      v-show="isNotificationShown"
    >
      BibTex copied!
    </div>
  </div>
</template>
