<script setup lang="ts">
import { BIconFlagFill } from "bootstrap-icons-vue";
import { PropType } from "vue";

import { PaperEntity } from "@/models/paper-entity";

const props = defineProps({
  item: {
    type: Object as PropType<PaperEntity>,
    required: true,
  },
  active: Boolean,
  striped: Boolean,
  read: {
    type: Boolean,
    default: true,
  },
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
      class="my-auto h-1.5 w-1.5 rounded-md"
      :class="active ? 'bg-red-400' : 'bg-red-500 '"
      v-if="!read"
    />
    <div
      class="truncate overflow-hidden w-[45%] m-auto"
      :class="active ? 'text-white' : ''"
    >
      {{ item.title }}
    </div>
    <div
      class="truncate overflow-hidden w-[15%] m-auto"
      :class="active ? 'text-white' : ''"
    >
      {{ item.authors }}
    </div>
    <div
      class="truncate overflow-hidden w-[33%] m-auto"
      :class="active ? 'text-white' : ''"
    >
      {{ item.publication }}
    </div>
    <div class="w-[5%] m-auto" :class="active ? 'text-white' : ''">
      {{ item.pubTime }}
    </div>
    <div class="flex w-[2%] m-auto">
      <BIconFlagFill
        class="m-auto text-xxs"
        :calss="active ? 'text-white' : ''"
        v-if="item.flag"
      />
    </div>
  </div>
</template>
