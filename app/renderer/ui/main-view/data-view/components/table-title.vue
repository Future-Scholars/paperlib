<script setup lang="ts">
import { BIconArrowDown, BIconArrowUp } from "bootstrap-icons-vue";
import { onBeforeMount, ref, watch } from "vue";

import { MainRendererStateStore } from "@/state/renderer/appstate";

import TableTitleItem from "./table-title-item.vue";

const props = defineProps({
  sortBy: {
    type: String,
    required: true,
  },
  sortOrder: {
    type: String,
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
});

const prefState = MainRendererStateStore.usePreferenceState();

const onTitleClicked = (key: string) => {
  prefState.mainviewSortBy = key;
  const sortOrder = props.sortOrder === "asce" ? "desc" : "asce";
  prefState.mainviewSortOrder = sortOrder;
  window.appInteractor.setPreference("sortBy", key);
  window.appInteractor.setPreference("sortOrder", sortOrder);
};

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
    class="flex w-full font-semibold text-xs rounded-md select-none cursor-pointer pr-2"
  >
    <TableTitleItem
      :style="`width: ${titleWidth}%`"
      :sort-by="sortBy == 'title'"
      :sort-order="sortOrder"
      :title="$t('mainview.title')"
      @title-clicked="onTitleClicked('title')"
    />
    <TableTitleItem
      class="w-[10%]"
      :sort-by="sortBy == 'authors'"
      :sort-order="sortOrder"
      :title="$t('mainview.authors')"
      @title-clicked="onTitleClicked('authors')"
    />
    <TableTitleItem
      :style="`width: ${pubWidth}%`"
      :sort-by="sortBy == 'publication'"
      :sort-order="sortOrder"
      :title="$t('mainview.publicationtitle')"
      @title-clicked="onTitleClicked('publication')"
      v-if="showPublication"
    />
    <TableTitleItem
      class="w-[6%]"
      :sort-by="sortBy == 'pubTime'"
      :sort-order="sortOrder"
      :title="$t('mainview.pubyear')"
      @title-clicked="onTitleClicked('pubTime')"
      v-if="showPubTime"
    />
    <TableTitleItem
      class="w-[5%]"
      :sort-by="sortBy == 'pubType'"
      :sort-order="sortOrder"
      :title="$t('mainview.pubtype')"
      @title-clicked="onTitleClicked('pubType')"
      v-if="showPubType"
    />
    <TableTitleItem
      class="w-[15%]"
      :sort-by="sortBy == 'tags'"
      :sort-order="sortOrder"
      :title="$t('mainview.tags')"
      v-if="showTags"
    />
    <TableTitleItem
      class="w-[15%]"
      :sort-by="sortBy == 'folders'"
      :sort-order="sortOrder"
      :title="$t('mainview.folders')"
      v-if="showFolders"
    />
    <TableTitleItem
      class="w-[10%]"
      :sort-by="sortBy == 'note'"
      :sort-order="sortOrder"
      :title="$t('mainview.note')"
      @title-clicked="onTitleClicked('note')"
      v-if="showNote"
    />
    <TableTitleItem
      class="w-[8%]"
      :sort-by="sortBy == 'rating'"
      :sort-order="sortOrder"
      :title="$t('mainview.rating')"
      @title-clicked="onTitleClicked('rating')"
      v-if="showRating"
    />
    <TableTitleItem
      class="w-[2%]"
      :sort-by="sortBy == 'flag'"
      :sort-order="sortOrder"
      title=""
      @title-clicked="onTitleClicked('flag')"
      v-if="showFlag"
    />
  </div>
</template>
