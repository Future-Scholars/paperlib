<script setup lang="ts">
import { PropType } from "vue";

import { getPubTypeString } from "@/base/string";
import { FeedEntity } from "@/models/feed-entity";

const props = defineProps({
  item: {
    type: Object as PropType<FeedEntity>,
    required: true,
  },
  fieldEnable: {
    type: Object as PropType<Partial<Record<keyof FeedEntity, boolean>>>,
    required: true,
    default: {
      pubTime: true,
      publication: true,
      pubType: false,
      addTime: false,
    },
  },
  fieldWidth: {
    type: Object as PropType<Partial<Record<keyof FeedEntity, number>>>,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  striped: {
    type: Boolean,
    required: true,
  },
});
</script>

<template>
  <div
    class="flex w-full h-7 py-1 text-xs rounded-md select-none cursor-pointer"
    :class="
      (striped && !active
        ? 'bg-neutral-100 dark:bg-neutral-700 dark:bg-opacity-40'
        : '') +
      (active
        ? 'bg-accentlight dark:bg-accentdark dark:bg-opacity-100 text-white'
        : '')
    "
  >
    <div class="my-auto pl-2 pr-1 flex" :style="`width: ${fieldWidth.title}%`">
      <div
        class="my-auto h-1.5 w-1.5 rounded-md flex-none mr-1"
        :class="active ? 'bg-red-400' : 'bg-red-500 '"
        v-if="!item.read"
      />
      <div class="truncate"><span v-html="item.title"></span></div>
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${fieldWidth.authors}%`"
    >
      {{ item.authors }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${fieldWidth.publication}%`"
      v-if="fieldEnable.publication"
    >
      {{ item.publication }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${fieldWidth.pubTime}%`"
      v-if="fieldEnable.pubTime"
    >
      {{ item.pubTime }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${fieldWidth.pubType}%`"
      v-if="fieldEnable.pubType"
    >
      {{ getPubTypeString(item.pubType) }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${fieldWidth.addTime}%`"
      v-if="fieldEnable.addTime"
    >
      {{ new Date(item.addTime).toLocaleString().slice(0, 10) }}
    </div>
  </div>
</template>
