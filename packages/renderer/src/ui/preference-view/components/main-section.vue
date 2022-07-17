<script setup lang="ts">
import { BIconCheck2, BIconX } from "bootstrap-icons-vue";

const props = defineProps({
  description: {
    type: String,
    required: true,
  },
  enable: {
    type: Boolean,
    required: true,
  },
});
</script>

<template>
  <div
    class="flex rounded-md bg-neutral-200 dark:bg-neutral-700 pr-1 space-x-1 cursor-pointer hover:bg-neutral-300 hover:dark:bg-neutral-600 h-6 mr-2 mb-1"
  >
    <div
      class="bg-neutral-300 dark:bg-neutral-600 p-1 rounded-tl-md rounded-bl-md h-6 my-auto pt-[6px]"
    >
      <slot></slot>
    </div>
    <div class="text-xs my-auto">{{ description }}</div>
    <BIconCheck2 class="my-auto" v-if="enable" />
    <BIconX class="my-auto" v-else />
  </div>
</template>
