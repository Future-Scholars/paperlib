<script setup lang="ts">
import { BIconQuestionCircle, BIconSearch, BIconX } from "bootstrap-icons-vue";
import { ref, watch } from "vue";

import { MainRendererStateStore } from "@/state/renderer/appstate";
import { debounce } from "@/utils/misc";

// ================================
// State
// ================================
const viewState = MainRendererStateStore.useViewState();

// ================================
// Data
// ================================
const searchText = ref("");
const searchModeLabel: Record<string, string> = {
  general: "mainview.generalsearch",
  advanced: "mainview.advancedsearch",
  fulltext: "mainview.fulltextsearch",
};
const searchDebounce = ref(300);

const onSearchTextChanged = debounce(() => {
  viewState.searchText = `${searchText.value}`;
}, searchDebounce.value);

watch(
  () => viewState.searchText,
  (newVal) => {
    searchText.value = newVal;
  }
);

const onInput = (payload: Event) => {
  if (viewState.searchMode === "advanced") {
    return;
  }
  onSearchTextChanged();
};

const onSubmit = (payload: Event) => {
  onSearchTextChanged();
};

const onModeClicked = (payload: Event) => {
  if (viewState.searchMode === "general") {
    viewState.searchMode = "fulltext";
    searchDebounce.value = 300;
  } else if (viewState.searchMode === "fulltext") {
    viewState.searchMode = "advanced";
    searchDebounce.value = 800;
  } else if (viewState.searchMode === "advanced") {
    viewState.searchMode = "general";
    searchDebounce.value = 300;
  }
};

const onClearClicked = (payload: Event) => {
  searchText.value = "";
  onSearchTextChanged();
};
</script>

<template>
  <div
    class="flex transition ease-in-out duration-75 w-full rounded-md pl-2 space-x-2 justify-between focus-within:bg-neutral-100 focus-within:dark:bg-neutral-700 hover:bg-neutral-100 hover:dark:bg-neutral-700 group"
  >
    <BIconSearch class="flex-none my-auto inline-block text-xs" />
    <input
      class="grow py-2 my-auto nodraggable-item text-xs bg-transparent focus:outline-none peer"
      type="text"
      :placeholder="`${$t('mainview.search')}...`"
      v-model="searchText"
      @input="onInput"
      @change="onSubmit"
      @focus="viewState.inputFieldFocused = true"
      @blur="viewState.inputFieldFocused = false"
    />
    <div class="my-auto invisible peer-focus:visible">
      <BIconQuestionCircle
        class="text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 hover:dark:text-neutral-300 cursor-pointer peer"
        v-if="viewState.searchMode === 'advanced'"
      />
      <div
        class="absolute text-xxs p-4 bg-neutral-100 dark:bg-neutral-800 rounded-md shadow-lg z-50 invisible peer-hover:visible"
      >
        <p class="font-semibold">Operators:</p>
        <p class="font-mono mb-2">
          ==, &lt;, &gt;, &lt;=, &gt;=, !=, in, contains, and, or, any, all
        </p>
        <p class="font-semibold">Queryable fields:</p>
        <p class="font-mono mb-2">
          title, authors, publication, pubTime, rating, note, tags.name,
          tags.count, folders.name, folders.count
        </p>
        <p class="font-semibold">Examples:</p>
        <p class="italic">1) Query the paper whose title is 'Test title':</p>
        <p class="font-mono mb-1">&nbsp; title == 'Test title'</p>
        <p class="italic">
          2) Query the paper whose title contains 'Test title':
        </p>
        <p class="font-mono mb-1">&nbsp; title contains 'Test title'</p>
        <p class="italic">
          3) Query the paper whose publication year are 2008:
        </p>
        <p class="font-mono mb-1">&nbsp; pubTime == '2008'</p>
        <p class="italic">4) Query the paper whose rating are > 3:</p>
        <p class="font-mono">&nbsp; rating > 3</p>
        <p class="italic">
          5) Query the paper whose tags contains 'a' and 'b':
        </p>
        <p class="font-mono">
          &nbsp; any(tags.name contains 'a' and tags.name contains 'b')
        </p>
      </div>
    </div>
    <BIconX
      id="search-clear-btn"
      class="my-auto text-neutral-400 invisible dark:text-neutral-500 hover:text-neutral-800 hover:dark:text-neutral-300 cursor-pointer peer-focus:visible hover:visible group-hover:visible"
      @click="onClearClicked"
    />
    <button
      class="flex-none my-auto p-2 w-[100px] text-xxs bg-neutral-200 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-200 rounded-r-md invisible peer-focus:visible group-hover:visible hover:visible hover:bg-neutral-300 hover:dark:bg-neutral-500"
      @click="onModeClicked"
    >
      {{ $t(searchModeLabel[viewState.searchMode]) }}
    </button>
  </div>
</template>
