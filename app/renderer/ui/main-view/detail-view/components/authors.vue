<script setup lang="ts">
import { MainRendererStateStore } from "@/state/renderer/appstate";

const props = defineProps({
  authors: String,
});

const viewState = MainRendererStateStore.useViewState();

const onClick = (e: MouseEvent, author: string) => {
  e.preventDefault();
  e.stopPropagation();
  viewState.searchMode = "advanced";
  viewState.searchText = `authors contains '${author}'`;
};

const onRightClick = (e: MouseEvent, author: string) => {
  e.preventDefault();
  e.stopPropagation();
  fileService.open(
    `https://scholar.google.com/scholar?q=${author.replaceAll(" ", "+")}`
  );
};
</script>

<template>
  <div class="flex flex-wrap">
    <div
      class="flex cursor-pointer"
      v-for="author in authors?.split(',').map((author) => author.trim())"
    >
      <div
        class="text-xxs hover:underline"
        @click="onClick($event, author)"
        @contextmenu="(e: MouseEvent) => onRightClick(e, author)"
      >
        {{ author }}
      </div>
      <div class="text-xxs" v-if="!authors?.endsWith(author)">,&nbsp;</div>
    </div>
  </div>
</template>
