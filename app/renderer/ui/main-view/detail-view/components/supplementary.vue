<script setup lang="ts">
const props = defineProps({
  sups: Object as () => Array<string>,
});

const getExtension = (sup: string) => {
  if (sup.startsWith("http")) {
    return "HTTP";
  } else {
    const ext = sup.split(".").pop();
    return ext?.toUpperCase() ?? "SUP";
  }
};

const onClick = (url: string) => {
  fileService.open(url);
};

const onRightClicked = (event: MouseEvent, url: string) => {
  window.appInteractor.showContextMenu("show-sup-context-menu", url);
};
</script>

<template>
  <div class="flex flex-wrap mt-1 text-xs space-x-1">
    <div
      class="flex space-x-1 bg-neutral-200 dark:bg-neutral-700 rounded-md p-1 hover:bg-neutral-300 hover:shadow-sm hover:dark:bg-neutral-600 select-none cursor-pointer"
      v-for="sup in sups"
      @click="onClick(sup)"
      @contextmenu="(e: MouseEvent) => onRightClicked(e, sup)"
    >
      <div class="text-xxs my-auto">
        {{ getExtension(sup) }}
      </div>
    </div>
  </div>
</template>
