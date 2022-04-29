<script setup lang="ts">
const props = defineProps({
  sups: Array as () => Array<string>,
});

const getExtension = (sup: string) => {
  if (sup.startsWith("http")) {
    return "HTTP";
  } else {
    const ext = sup.split(".").pop();
    return ext?.toUpperCase ?? "SUP";
  }
};

const onClick = (url: string) => {
  window.appInteractor.open(url);
};
</script>

<template>
  <div class="flex flex-wrap mt-1 text-xs space-x-1">
    <div
      class="flex space-x-1 bg-neutral-200 rounded-md p-1 hover:bg-neutral-300 hover:shadow-sm select-none cursor-pointer"
      v-for="sup in sups"
      @click="onClick(sup)"
    >
      <div class="text-xxs my-auto">
        {{ getExtension(sup) }}
      </div>
    </div>
  </div>
</template>
