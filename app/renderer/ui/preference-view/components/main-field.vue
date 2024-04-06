<script setup lang="ts">
import {
  BIconChevronCompactLeft,
  BIconChevronCompactRight,
} from "bootstrap-icons-vue";

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

const emit = defineEmits([
  "event:click",
  "event:pre-click",
  "event:next-click",
]);
</script>

<template>
  <div
    class="flex rounded-md justify-between cursor-pointer group select-none"
    :class="
      enable
        ? 'bg-neutral-200 dark:bg-neutral-500'
        : 'bg-neutral-300 text-neutral-400 dark:bg-neutral-700'
    "
  >
    <div
      class="flex hover:bg-neutral-300 rounded-md group-hover:visible invisible flex-none"
      @click="$emit('event:pre-click')"
    >
      <BIconChevronCompactLeft class="my-auto h-3" />
    </div>
    <div
      class="flex rounded-md px-1 space-x-1 h-6 grow"
      @click="$emit('event:click')"
    >
      <div class="text-xs m-auto truncate">{{ description }}</div>
    </div>
    <div
      class="flex hover:bg-neutral-300 rounded-md group-hover:visible invisible flex-none"
      @click="$emit('event:next-click')"
    >
      <BIconChevronCompactRight class="my-auto h-3" />
    </div>
  </div>
</template>
