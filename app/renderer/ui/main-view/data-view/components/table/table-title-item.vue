<script setup lang="ts">
import { BIconArrowDown, BIconArrowUp } from "bootstrap-icons-vue";

const props = defineProps({
  sortBy: {
    type: Boolean,
    required: true,
  },
  sortOrder: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
});

const emits = defineEmits(["title-clicked"]);
</script>

<template>
  <div
    class="flex h-6 px-2 truncate overflow-hidden my-auto hover:bg-neutral-200 hover:dark:bg-neutral-700 w-full font-semibold text-xs rounded-md select-none cursor-pointer"
    @click="emits('title-clicked')"
  >
    <span class="my-auto truncate"> {{ title }} </span>
    <BIconArrowDown
      class="my-auto ml-[2px] text-xxs min-w-[12px]"
      v-if="sortBy && sortOrder === 'desc'"
    />
    <BIconArrowUp
      class="my-auto ml-[2px] text-xxs min-w-[12px]"
      v-if="sortBy && sortOrder === 'asce'"
    />
  </div>
</template>
