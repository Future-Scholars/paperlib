<script setup lang="ts">
import { ref } from "vue";

import { BIconSearch, BIconQuestionCircle, BIconX } from "bootstrap-icons-vue";
import { debounce } from "../../../../utils/debounce";

const searchText = ref("");
const searchMode = ref("general");
const searchModeLabel: Record<string, string> = {
  general: "General Mode",
  advanced: "Advanced Mode",
  fulltext: "Fulltext Mode",
};
const searchDebounce = ref(300);

const onSearchTextChanged = debounce(() => {
  window.appInteractor.setState("viewState.searchText", `${searchText.value}`);
}, searchDebounce.value);

const onInput = (payload: Event) => {
  if (searchMode.value === "advanced") {
    return;
  }
  onSearchTextChanged();
};

const onSubmit = (payload: Event) => {
  if (searchMode.value !== "advanced") {
    return;
  }
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

const onClearClicked = (payload: Event) => {
  console.log("onClearClicked");
  searchText.value = "";
  onSearchTextChanged();
};

window.appInteractor.registerState("viewState.searchMode", (value) => {
  searchMode.value = value as string;
});

window.appInteractor.registerState("viewState.searchText", (value) => {
  searchText.value = value as string;
});
</script>

<template>
  <div
    class="flex transition ease-in-out duration-75 w-full rounded-md pl-2 space-x-2 justify-between focus-within:bg-neutral-100 focus-within:dark:bg-neutral-700 hover:bg-neutral-100 hover:dark:bg-neutral-700"
  >
    <BIconSearch class="flex-none my-auto inline-block text-xs" />
    <input
      class="grow py-2 my-auto nodraggable-item text-xs bg-transparent focus:outline-none peer"
      type="text"
      placeholder="Search..."
      v-model="searchText"
      @input="onInput"
      @change="onSubmit"
    />
    <div class="my-auto invisible peer-focus:visible">
      <BIconQuestionCircle
        class="text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 hover:dark:text-neutral-300 cursor-pointer peer"
        v-if="searchMode === 'advanced'"
      />
      <div
        class="absolute text-xxs p-4 bg-neutral-100 dark:bg-neutral-800 rounded-md shadow-lg z-50 invisible peer-hover:visible"
      >
        <p class="font-semibold">Operators:</p>
        <p class="font-mono mb-2">
          ==, &lt;, &gt;, &lt;=, &gt;=, !=, in, contains, and, or
        </p>
        <p class="font-semibold">Queryable fields:</p>
        <p class="font-mono mb-2">
          title, authors, publication, pubTime, rating, note
        </p>
        <p class="font-semibold">Examples:</p>
        <p class="italic">1) Query the paper whos title is 'Test title':</p>
        <p class="font-mono mb-1">&nbsp; title == 'Test title'</p>
        <p class="italic">
          2) Query the paper whos title contains 'Test title':
        </p>
        <p class="font-mono mb-1">&nbsp; title contains 'Test title'</p>
        <p class="italic">3) Query the paper whos publication year are 2008:</p>
        <p class="font-mono mb-1">&nbsp; pubTime == '2008'</p>
        <p class="italic">4) Query the paper whos rating are > 3:</p>
        <p class="font-mono">&nbsp; rating > 3</p>
      </div>
    </div>
    <BIconX
      class="my-auto text-neutral-400 invisible dark:text-neutral-500 hover:text-neutral-800 hover:dark:text-neutral-300 cursor-pointer peer-focus:visible hover:visible"
      @click="onClearClicked"
    />
    <button
      class="flex-none my-auto p-2 w-[100px] text-xxs bg-neutral-200 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-200 rounded-r-md invisible peer-focus:visible hover:visible hover:bg-neutral-300 hover:dark:bg-neutral-500"
      @click="onModeClicked"
    >
      {{ searchModeLabel[searchMode] }}
    </button>
  </div>
</template>
