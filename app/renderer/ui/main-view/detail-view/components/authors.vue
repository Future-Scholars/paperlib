<script setup lang="ts">
const props = defineProps({
  authors: String,
});

// TODO: check if we really need uiState. can we get/set state with api
const uiState = PLUIAPILocal.uiStateService.useState();

const onClick = (e: MouseEvent, author: string) => {
  e.preventDefault();
  e.stopPropagation();
  uiState.querySentenceCommandbar = `authors contains '${author}'`;
  // PLUIAPILocalLocal.uiStateService.setUIState({"querySentenceCommandbar": `authors contains '${author}'`})
};

const onRightClick = (e: MouseEvent, author: string) => {
  e.preventDefault();
  e.stopPropagation();
  PLAPI.fileService.open(
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
