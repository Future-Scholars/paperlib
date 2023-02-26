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
import { Ref, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { PaperFolder, PaperTag } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import ListItem from "@/renderer/ui/main-view/data-view/components/list-item.vue";
import TableItem from "@/renderer/ui/main-view/data-view/components/table/table-item.vue";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import MainSection from "./components/main-section.vue";

const prefState = MainRendererStateStore.usePreferenceState();
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

const tableTitleColumns: Ref<Record<string, { name: string; width: number }>> =
  ref({});

const resetTableTitleColumns = () => {
  var newTitleColumns = {
    title: { name: i18n.t("mainview.title"), width: -1 },
    authors: { name: i18n.t("mainview.authors"), width: -1 },
  } as Record<string, { name: string; width: number }>;

  if (prefState.showMainPublication) {
    newTitleColumns["publication"] = {
      name: i18n.t("mainview.publicationtitle"),
      width: -1,
    };
  }
  if (prefState.showMainYear) {
    newTitleColumns["pubTime"] = {
      name: i18n.t("mainview.pubyear"),
      width: -1,
    };
  }
  if (prefState.showMainPubType) {
    newTitleColumns["pubType"] = {
      name: i18n.t("mainview.pubtype"),
      width: -1,
    };
  }
  if (prefState.showMainTags) {
    newTitleColumns["tags"] = {
      name: i18n.t("mainview.tags"),
      width: -1,
    };
  }
  if (prefState.showMainFolders) {
    newTitleColumns["folders"] = {
      name: i18n.t("mainview.folders"),
      width: -1,
    };
  }
  if (prefState.showMainNote) {
    newTitleColumns["note"] = {
      name: i18n.t("mainview.note"),
      width: -1,
    };
  }
  if (prefState.showMainRating) {
    newTitleColumns["rating"] = {
      name: i18n.t("mainview.rating"),
      width: -1,
    };
  }
  if (prefState.showMainFlag) {
    newTitleColumns["flag"] = { name: i18n.t("mainview.flag"), width: -1 };
  }
  if (prefState.showMainAddTime) {
    newTitleColumns["addTime"] = {
      name: i18n.t("mainview.addtime"),
      width: -1,
    };
  }

  // Calculate the width percentage of each column
  Object.keys(newTitleColumns).forEach((key) => {
    newTitleColumns[key].width = 100 / Object.keys(newTitleColumns).length;
  });

  tableTitleColumns.value = newTitleColumns;
};

const updatePref = (key: string, value: unknown) => {
  window.appInteractor.setPreference(key, value);
};

watch(
  () => [
    prefState.showMainYear,
    prefState.showMainPublication,
    prefState.showMainPubType,
    prefState.showMainTags,
    prefState.showMainFolders,
    prefState.showMainNote,
    prefState.showMainRating,
    prefState.showMainFlag,
    prefState.showMainAddTime,
  ],
  resetTableTitleColumns
);

onMounted(() => {
  resetTableTitleColumns();
});
</script>

<template>
  <div class="flex flex-col w-[600px] text-neutral-800 dark:text-neutral-300">
    <div class="text-base font-semibold mb-4">
      {{ $t("preference.mainview") + " " + $t("mainview.preview") }}
    </div>
    <ListItem
      class="bg-neutral-200 dark:bg-neutral-700 w-[600px] cursor-default"
      :item="item"
      :showPubTime="prefState.showMainYear"
      :showPublication="prefState.showMainPublication"
      :showRating="prefState.showMainRating"
      :showPubType="prefState.showMainPubType"
      :showTags="prefState.showMainTags"
      :showFolders="prefState.showMainFolders"
      :showNote="prefState.showMainNote"
      :showFlag="prefState.showMainFlag"
      :read="true"
    />

    <TableItem
      class="bg-neutral-200 dark:bg-neutral-700 w-[600px] cursor-default mt-5"
      :item="item"
      :titles="tableTitleColumns"
      :showPubTime="prefState.showMainYear"
      :showPublication="prefState.showMainPublication"
      :showRating="prefState.showMainRating"
      :showPubType="prefState.showMainPubType"
      :showTags="prefState.showMainTags"
      :showFolders="prefState.showMainFolders"
      :showNote="prefState.showMainNote"
      :showFlag="prefState.showMainFlag"
      :showAddTime="prefState.showMainAddTime"
      :read="true"
      :active="false"
      :striped="false"
    />

    <div class="flex mt-6 flex-wrap w-[600px]">
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
