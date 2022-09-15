<script setup lang="ts">
import { BIconArrowDown, BIconArrowUp } from "bootstrap-icons-vue";

import { MainRendererStateStore } from "@/state/renderer/appstate";

const props = defineProps({
  sortBy: {
    type: String,
    required: true,
  },
  sortOrder: {
    type: String,
    required: true,
  },
});

const prefState = MainRendererStateStore.usePreferenceState();

const onTitleClicked = (key: string) => {
  prefState.mainviewSortBy = key;
  const sortOrder = props.sortOrder === "asce" ? "desc" : "asce";
  prefState.mainviewSortOrder = sortOrder;
  window.appInteractor.setPreference("sortBy", key);
  window.appInteractor.setPreference("sortOrder", sortOrder);
};
</script>

<template>
  <div
    class="flex w-full font-semibold text-xs rounded-md select-none cursor-pointer"
  >
    <div
      class="flex h-6 px-2 truncate overflow-hidden w-[calc(45%-1rem)] my-auto rounded-md hover:bg-neutral-200 hover:dark:bg-neutral-700"
      @click="onTitleClicked('title')"
    >
      <span class="my-auto"> Title </span>
      <BIconArrowDown
        class="my-auto ml-1 text-xxs"
        v-if="sortBy == 'title' && sortOrder === 'desc'"
      />
      <BIconArrowUp
        class="my-auto ml-1 text-xxs"
        v-if="sortBy == 'title' && sortOrder === 'asce'"
      />
    </div>
    <div
      class="flex h-6 px-2 truncate overflow-hidden w-[calc(15%)] my-auto rounded-md hover:bg-neutral-200 hover:dark:bg-neutral-700"
      @click="onTitleClicked('authors')"
    >
      <span class="my-auto"> Authors </span>
      <BIconArrowDown
        class="my-auto ml-1 text-xxs"
        v-if="sortBy == 'authors' && sortOrder === 'desc'"
      />
      <BIconArrowUp
        class="my-auto ml-1 text-xxs"
        v-if="sortBy == 'authors' && sortOrder === 'asce'"
      />
    </div>
    <div
      class="flex h-6 px-2 truncate overflow-hidden w-[calc(33%-0.5rem)] my-auto rounded-md hover:bg-neutral-200 hover:dark:bg-neutral-700"
      @click="onTitleClicked('publication')"
    >
      <span class="my-auto"> Publication </span>
      <BIconArrowDown
        class="my-auto ml-1 text-xxs"
        v-if="sortBy == 'publication' && sortOrder === 'desc'"
      />
      <BIconArrowUp
        class="my-auto ml-1 text-xxs"
        v-if="sortBy == 'publication' && sortOrder === 'asce'"
      />
    </div>
    <div
      class="flex h-6 px-2 w-[calc(7%)] my-auto rounded-md hover:bg-neutral-200 hover:dark:bg-neutral-700"
      @click="onTitleClicked('pubTime')"
    >
      <span class="my-auto">Year</span>
      <BIconArrowDown
        class="my-auto text-xxs"
        v-if="sortBy == 'pubTime' && sortOrder === 'desc'"
      />
      <BIconArrowUp
        class="my-auto ml-1 text-xxs"
        v-if="sortBy == 'pubTime' && sortOrder === 'asce'"
      />
    </div>
  </div>
</template>
