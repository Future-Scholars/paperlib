<script setup lang="ts">
import { BIconArrowRight, BIconTrash } from "bootstrap-icons-vue";

const props = defineProps({
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["delete"]);
</script>

<template>
  <div class="flex space-x-1">
    <div class="p-2 w-full rounded-md text-xs my-auto truncate">
      {{ from }}
    </div>
    <BIconArrowRight class="my-auto w-6" />
    <div class="p-2 w-full rounded-md text-xs truncate">{{ to }}</div>
    <div
      class="flex h-full w-20 my-auto text-xs cursor-pointer"
      @click="emit('delete')"
    >
      <BIconTrash class="m-auto" />
    </div>
  </div>
</template>
