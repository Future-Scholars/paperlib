<script setup lang="ts">
import { ref } from "vue";

import { BIconSearch } from "bootstrap-icons-vue";
import { debounce } from "../../../../utils/debounce";

const searchText = ref("");
const searchMode = ref("general");
const searchModeLabel = {
  general: "General Mode",
  advanced: "Advanced Mode",
  fulltext: "Fulltext Mode",
};
const searchDebounce = ref(300);

const onSearchTextChanged = debounce(() => {
  window.appInteractor.setState(
    "viewState.searchText",
    JSON.stringify(searchText.value)
  );
}, searchDebounce.value);

const onInput = (payload: Event) => {
  onSearchTextChanged();
};

const onModeClicked = (payload: Event) => {
  if (searchMode.value === "general") {
    window.appInteractor.setState("viewState.searchMode", "fulltext");
    searchDebounce.value = 300;
  } else if (searchMode.value === "fulltext") {
    window.appInteractor.setState("viewState.searchMode", "advanced");
    searchDebounce.value = 800;
  } else if (searchMode.value === "advanced") {
    window.appInteractor.setState("viewState.searchMode", "general");
    searchDebounce.value = 300;
  }
};

window.appInteractor.registerState("viewState.searchMode", (value) => {
  searchMode.value = value as string;
});
</script>

<template>
  <div
    class="flex transition ease-in-out duration-75 w-full rounded-md pl-2 space-x-2 justify-between focus-within:bg-neutral-100 hover:bg-neutral-100"
  >
    <BIconSearch class="flex-none my-auto inline-block text-xs" />
    <input
      class="grow py-2 my-auto nodraggable-item text-xs bg-transparent focus:outline-none peer"
      type="text"
      placeholder="Search..."
      v-model="searchText"
      @input="onInput"
    />
    <button
      class="flex-none my-auto p-2 w-[100px] text-xxs bg-neutral-200 text-neutral-500 rounded-r-md invisible peer-focus:visible hover:visible hover:bg-neutral-300"
      @click="onModeClicked"
    >
      {{ searchModeLabel[searchMode] }}
    </button>
  </div>
</template>
