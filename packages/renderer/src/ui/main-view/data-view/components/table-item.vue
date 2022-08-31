<script setup lang="ts">
import { BIconFlagFill } from "bootstrap-icons-vue";

const props = defineProps({
  title: String,
  authors: String,
  year: String,
  publication: String,
  flag: Boolean,
  active: Boolean,
  striped: Boolean,
});
</script>

<template>
  <div
    class="flex w-full h-7 py-1 px-2 space-x-2 text-xs rounded-md select-none cursor-pointer"
    :class="
      (striped && !active
        ? 'bg-neutral-100 dark:bg-neutral-700 dark:bg-opacity-40'
        : '') +
      (active ? 'bg-accentlight dark:bg-accentdark dark:bg-opacity-100' : '')
    "
  >
    <div
      class="truncate overflow-hidden w-[45%] m-auto"
      :class="active ? 'text-white' : ''"
    >
      {{ title }}
    </div>
    <div
      class="truncate overflow-hidden w-[15%] m-auto"
      :class="active ? 'text-white' : ''"
    >
      {{ authors }}
    </div>
    <div
      class="truncate overflow-hidden w-[33%] m-auto"
      :class="active ? 'text-white' : ''"
    >
      {{ publication }}
    </div>
    <div class="w-[5%] m-auto" :class="active ? 'text-white' : ''">
      {{ year }}
    </div>
    <div class="flex w-[2%] m-auto">
      <BIconFlagFill
        class="m-auto text-xxs"
        :calss="active ? 'text-white' : ''"
        v-if="flag"
      />
    </div>
  </div>
</template>
