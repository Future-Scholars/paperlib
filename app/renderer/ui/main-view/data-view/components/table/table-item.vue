<script setup lang="ts">
import { BIconFlagFill, BIconStarFill } from "bootstrap-icons-vue";
import { PropType } from "vue";

import { PaperEntity } from "@/models/paper-entity";

const props = defineProps({
  item: {
    type: Object as PropType<PaperEntity>,
    required: true,
  },
  titles: {
    type: Object as PropType<Record<string, { name: string; width: number }>>,
    required: true,
  },
  showPubTime: {
    type: Boolean,
    default: true,
  },
  showPublication: {
    type: Boolean,
    default: true,
  },
  showRating: {
    type: Boolean,
    default: false,
  },
  showPubType: {
    type: Boolean,
    default: false,
  },
  showTags: {
    type: Boolean,
    default: false,
  },
  showFolders: {
    type: Boolean,
    default: false,
  },
  showFlag: {
    type: Boolean,
    default: true,
  },
  showNote: {
    type: Boolean,
    default: false,
  },
  showAddTime: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
  striped: {
    type: Boolean,
    required: true,
  },
  read: {
    type: Boolean,
    default: true,
  },
});
const getPubTypeString = (pubType: any) => {
  switch (pubType) {
    case 0:
      return "Article";
    case 1:
      return "Conference";
    case 2:
      return "Others";
    case 3:
      return "Book";
    default:
      return "Others";
  }
};
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
    <div
      class="my-auto pl-2 pr-1 flex"
      :style="`width: ${titles['title']?.width || 0}%`"
    >
      <div
        class="my-auto h-1.5 w-1.5 rounded-md flex-none mr-1"
        :class="active ? 'bg-red-400' : 'bg-red-500 '"
        v-if="!read"
      />
      <div class="truncate">{{ item.title }}</div>
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${titles['authors']?.width || 0}%`"
    >
      {{ item.authors }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${titles['publication']?.width || 0}%`"
      v-if="showPublication"
    >
      {{ item.publication }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${titles['pubTime']?.width || 0}%`"
      v-if="showPubTime"
    >
      {{ item.pubTime }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${titles['pubType']?.width || 0}%`"
      v-if="showPubType"
    >
      {{ getPubTypeString(item.pubType) }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${titles['tags']?.width || 0}%`"
      v-if="showTags"
    >
      {{ item.tags.map((tag) => tag.name).join(" / ") }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${titles['folders']?.width || 0}%`"
      v-if="showFolders"
    >
      {{ item.folders.map((folder) => folder.name).join(" / ") }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${titles['note']?.width || 0}%`"
      v-if="showNote"
    >
      {{ item.note }}
    </div>

    <div
      class="flex my-auto text-xxxs truncate overflow-hidden pl-3 pr-1"
      :style="`width: ${titles['rating']?.width || 0}%`"
      v-if="showRating"
    >
      <BIconStarFill v-for="_ in item.rating" class="my-auto mr-[1px]" />
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${titles['flag']?.width || 0}%`"
      v-if="showFlag"
    >
      <BIconFlagFill
        class="my-auto text-xxs"
        :calss="active ? 'text-white' : ''"
        v-if="item.flag"
      />
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${titles['addTime']?.width || 0}%`"
      v-if="showAddTime"
    >
      {{ new Date(item.addTime).toLocaleString().slice(0, 10) }}
    </div>
  </div>
</template>
