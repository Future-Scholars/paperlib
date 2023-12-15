<script setup lang="ts">
import {
  BIconBook,
  BIconCalendar2,
  BIconCalendarDate,
  BIconCardHeading,
  BIconFlag,
  BIconFolder,
  BIconFonts,
  BIconStar,
  BIconTag,
} from "bootstrap-icons-vue";
import { ObjectId } from "bson";
import { Ref, computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { disposable } from "@/base/dispose";
import { IPreferenceStore } from "@/common/services/preference-service";
import { PaperFolder, PaperTag } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import PaperListItem from "@/renderer/ui/main-view/data-view/components/list-view/components/paper-list-item.vue";
import PaperTableItem from "@/renderer/ui/main-view/data-view/components/table-view/components/paper-table-item.vue";

import MainSection from "./components/main-section.vue";

const prefState = preferenceService.useState();
const i18n = useI18n();

const item = ref(new PaperEntity(false));
// @ts-ignore
item.value.initialize({
  id: `${new ObjectId()}`,
  _id: `${new ObjectId()}`,
  arxiv: "",
  doi: "",
  addTime: new Date(),
  title: "Deep Residual Learning for Image Recognition",
  authors: "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
  publication: "Computer Vision and Pattern Recognition (CVPR)",
  pubTime: "2016",
  pubType: 1,
  flag: true,
  rating: 5,
  tags: [new PaperTag("architecture", 1)],
  folders: [new PaperFolder("Computer-Vision", 1)],
  note: "ResNet, proposed a residual architecture to train very deep models.",
  mainURL: "",
  supURLs: [],
  codes: [],
  pages: "",
  volume: "",
  number: "",
  publisher: "",
  _partition: "",
});

const fieldEnable = computed(() => {
  return {
    pubTime: prefState.showMainYear,
    publication: prefState.showMainPublication,
    pubType: prefState.showMainPubType,
    rating: prefState.showMainRating,
    tags: prefState.showMainTags,
    folders: prefState.showMainFolders,
    flag: prefState.showMainFlag,
    note: prefState.showMainNote,
    addTime: prefState.showMainAddTime,
  };
});
const fieldWidth = ref({});

const calTableFieldWidth = (reset = false) => {
  if (reset) {
    preferenceService.set({
      mainTitleWidth: -1,
      mainAuthorsWidth: -1,
      mainPublicationWidth: -1,
      mainYearWidth: -1,
      mainPubTypeWidth: -1,
      mainTagsWidth: -1,
      mainFoldersWidth: -1,
      mainNoteWidth: -1,
      mainRatingWidth: -1,
      mainFlagWidth: -1,
      mainAddTimeWidth: -1,
    });
  }

  const keyPrefMap: Record<string, Record<string, string>> = {
    title: { widthKey: "mainTitleWidth", enableKey: "showMainTitle" },
    authors: { widthKey: "mainAuthorsWidth", enableKey: "showMainAuthors" },
    publication: {
      widthKey: "mainPublicationWidth",
      enableKey: "showMainPublication",
    },
    pubTime: { widthKey: "mainYearWidth", enableKey: "showMainYear" },
    pubType: { widthKey: "mainPubTypeWidth", enableKey: "showMainPubType" },
    tags: { widthKey: "mainTagsWidth", enableKey: "showMainTags" },
    folders: { widthKey: "mainFoldersWidth", enableKey: "showMainFolders" },
    note: { widthKey: "mainNoteWidth", enableKey: "showMainNote" },
    rating: { widthKey: "mainRatingWidth", enableKey: "showMainRating" },
    flag: { widthKey: "mainFlagWidth", enableKey: "showMainFlag" },
    addTime: { widthKey: "mainAddTimeWidth", enableKey: "showMainAddTime" },
  };
  const alwaysShowKeys = ["title", "authors"];

  let totalWidth = 0;
  let autoWidthNumber = 0;

  const fieldWidthBuffer: Record<string, number> = {};

  for (const [key, prefKey] of Object.entries(keyPrefMap)) {
    const prefWidth = prefState[prefKey.widthKey];
    const prefEnable =
      prefState[prefKey.enableKey] || alwaysShowKeys.includes(key);

    if (!prefEnable) {
      continue;
    }

    if (prefWidth !== -1) {
      fieldWidthBuffer[key] = prefWidth;
      totalWidth += prefWidth;
    } else {
      autoWidthNumber += 1;
    }
  }

  // Calculate the width percentage of each column
  const autoWidth = (100 - totalWidth) / autoWidthNumber;
  for (const [key, prefKey] of Object.entries(keyPrefMap)) {
    const prefWidth = prefState[prefKey.widthKey];
    const prefEnable =
      prefState[prefKey.enableKey] || alwaysShowKeys.includes(key);

    if (!prefEnable) {
      continue;
    }

    if (prefWidth === -1) {
      fieldWidthBuffer[key] = autoWidth;
    }
  }

  let restWidth = 0;
  for (const [key, width] of Object.entries(fieldWidthBuffer)) {
    restWidth += width;
  }
  restWidth = 100 - restWidth;
  fieldWidthBuffer.title += restWidth;

  fieldWidth.value = fieldWidthBuffer;
};

const updatePref = (key: keyof IPreferenceStore, value: unknown) => {
  preferenceService.set({ [key]: value });
};

disposable(
  preferenceService.onChanged(
    [
      "showMainYear",
      "showMainPublication",
      "showMainPubType",
      "showMainTags",
      "showMainFolders",
      "showMainNote",
      "showMainRating",
      "showMainFlag",
      "showMainAddTime",
    ],
    () => calTableFieldWidth(true)
  )
);

onMounted(() => {
  calTableFieldWidth();
});
</script>

<template>
  <div
    class="flex flex-col text-neutral-800 dark:text-neutral-300 w-[400px] md:w-[500px] lg:w-[700px]"
  >
    <div class="text-base font-semibold mb-4">
      {{ $t("preference.mainview") + " " + $t("mainview.preview") }}
    </div>
    <PaperListItem
      class="bg-neutral-200 dark:bg-neutral-700 cursor-default mb-2"
      :item="item"
      :field-enable="fieldEnable"
      :active="false"
      :categorizer-sort-by="prefState.sidebarSortBy"
      :categorizer-sort-order="prefState.sidebarSortOrder"
    />

    <PaperTableItem
      class="bg-neutral-200 dark:bg-neutral-700 cursor-default"
      :item="item"
      :field-enable="fieldEnable"
      :field-width="fieldWidth"
      :categorizer-sort-by="prefState.sidebarSortBy"
      :categorizer-sort-order="prefState.sidebarSortOrder"
      :active="false"
      :striped="false"
    />

    <div class="flex mt-6 flex-wrap">
      <MainSection
        description="Year"
        :enable="prefState.showMainYear"
        @click="updatePref('showMainYear', !prefState.showMainYear)"
      >
        <BIconCalendarDate class="my-auto text-xs" />
      </MainSection>
      <MainSection
        description="Publication"
        :enable="prefState.showMainPublication"
        @click="
          updatePref('showMainPublication', !prefState.showMainPublication)
        "
      >
        <BIconFonts class="my-auto text-xs" />
      </MainSection>
      <MainSection
        description="PubType"
        :enable="prefState.showMainPubType"
        @click="updatePref('showMainPubType', !prefState.showMainPubType)"
      >
        <BIconBook class="my-auto text-xs" />
      </MainSection>
      <MainSection
        description="Flag"
        :enable="prefState.showMainFlag"
        @click="updatePref('showMainFlag', !prefState.showMainFlag)"
      >
        <BIconFlag class="my-auto text-xs" />
      </MainSection>
      <MainSection
        description="Rating"
        :enable="prefState.showMainRating"
        @click="updatePref('showMainRating', !prefState.showMainRating)"
      >
        <BIconStar class="my-auto text-xs" />
      </MainSection>
      <MainSection
        description="Tags"
        :enable="prefState.showMainTags"
        @click="updatePref('showMainTags', !prefState.showMainTags)"
      >
        <BIconTag class="my-auto text-xs" />
      </MainSection>
      <MainSection
        description="Folders"
        :enable="prefState.showMainFolders"
        @click="updatePref('showMainFolders', !prefState.showMainFolders)"
      >
        <BIconFolder class="my-auto text-xs" />
      </MainSection>
      <MainSection
        description="Note"
        :enable="prefState.showMainNote"
        @click="updatePref('showMainNote', !prefState.showMainNote)"
      >
        <BIconCardHeading class="my-auto text-xs" />
      </MainSection>
      <MainSection
        description="Add Time"
        :enable="prefState.showMainAddTime"
        @click="updatePref('showMainAddTime', !prefState.showMainAddTime)"
      >
        <BIconCalendar2 class="my-auto text-xs" />
      </MainSection>
    </div>
  </div>
</template>
