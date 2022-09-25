<script setup lang="ts">
import { BIconFlagFill, BIconStarFill } from "bootstrap-icons-vue";
import { PropType, onBeforeMount, ref, watch } from "vue";

import { PaperEntity } from "@/models/paper-entity";

const props = defineProps({
  item: {
    type: Object as PropType<PaperEntity>,
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
  active: Boolean,
  striped: Boolean,
  read: {
    type: Boolean,
    default: true,
  },
});

const titleWidth = ref(0);
const pubWidth = ref(0);

const getColumnWidth = () => {
  let oneWidthColumn = 1;
  if (props.showPubTime) oneWidthColumn += 0.6;
  if (props.showRating) oneWidthColumn += 0.8;
  if (props.showPubType) oneWidthColumn += 0.5;
  if (props.showTags) oneWidthColumn += 1.5;
  if (props.showFolders) oneWidthColumn += 1.5;
  if (props.showFlag) oneWidthColumn += 0.3;
  if (props.showNote) oneWidthColumn += 1;

  const otherColumnWidth = 10 - oneWidthColumn;
  const width = otherColumnWidth / 2;
  titleWidth.value = width * 10;
  pubWidth.value = width * 10;
};

const getPubTypeString = (pubType: any) => {
  switch (pubType) {
    case 0:
      return "art.";
    case 1:
      return "conf.";
    case 2:
      return "oth.";
    case 3:
      return "book";
    default:
      return "oth.";
  }
};

watch(
  () => [
    props.showPubTime,
    props.showRating,
    props.showPubType,
    props.showTags,
    props.showFolders,
    props.showFlag,
    props.showNote,
  ],
  getColumnWidth
);

onBeforeMount(() => {
  getColumnWidth();
});
</script>

<template>
  <div
    class="flex w-full h-7 py-1 px-2 text-xs rounded-md select-none cursor-pointer"
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
      class="truncate overflow-hidden my-auto px-1"
      :class="active ? `text-white` : ``"
      :style="`width: ${titleWidth}%`"
    >
      {{ item.title }}
    </div>

    <div
      class="truncate overflow-hidden w-[10%] my-auto px-1"
      :class="active ? 'text-white' : ''"
    >
      {{ item.authors }}
    </div>

    <div
      class="truncate overflow-hidden my-auto px-1"
      :class="active ? `text-white ` : ``"
      :style="`width: ${pubWidth}%`"
      v-if="showPublication"
    >
      {{ item.publication }}
    </div>

    <div
      class="w-[6%] my-auto px-1 truncate"
      :class="active ? 'text-white' : ''"
      v-if="showPubTime"
    >
      {{ item.pubTime }}
    </div>

    <div class="flex my-auto w-[5%] px-1 truncate" v-if="showPubType">
      {{ getPubTypeString(item.pubType) }}
    </div>

    <div class="flex space-x-1 my-auto w-[15%] px-1" v-if="showTags">
      <span class="truncate">
        {{ item.tags.map((tag) => tag.name).join(" / ") }}
      </span>
    </div>

    <div class="flex space-x-1 my-auto w-[15%] px-1" v-if="showFolders">
      <span class="truncate">
        {{ item.folders.map((folder) => folder.name).join(" / ") }}
      </span>
    </div>

    <div
      class="my-auto truncate w-[10%] px-1"
      :class="active ? 'text-white' : ''"
      v-if="showNote"
    >
      {{ item.note }}
    </div>

    <div class="flex my-auto text-xxxs min-w-[8%] px-1" v-if="showRating">
      <BIconStarFill v-for="_ in item.rating" class="my-auto mr-[1px]" />
    </div>

    <div class="flex min-w-[2%] my-auto px-1" v-if="showFlag">
      <BIconFlagFill
        class="my-auto text-xxs"
        :calss="active ? 'text-white' : ''"
        v-if="item.flag"
      />
    </div>
  </div>
</template>
