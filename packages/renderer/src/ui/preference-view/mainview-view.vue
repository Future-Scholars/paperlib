<script setup lang="ts">
import { ref } from "vue";
import {
  BIconFonts,
  BIconBook,
  BIconCalendarDate,
  BIconFlag,
  BIconStar,
  BIconTag,
  BIconFolder,
  BIconCardHeading,
} from "bootstrap-icons-vue";

import ListItem from "../main-view/data-view/components/list-item.vue";
import MainSection from "./components/main-section.vue";

import { PreferenceStore } from "../../../../preload/utils/preference";

const props = defineProps({
  preference: {
    type: Object as () => PreferenceStore,
    required: true,
  },
});

const item = ref({
  title: "Deep Residual Learning for Image Recognition",
  authors: "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
  publication: "Computer Vision and Pattern Recognition (CVPR)",
  pubTime: "2016",
  pubType: 1,
  flag: true,
  rating: 5,
  tags: [{ name: "deep-learning" }, { name: "architecture" }],
  folders: [{ name: "cvpr-ref" }],
  note: "ResNet, proposed a residual architecture to train very deep models.",
});

const onUpdate = (key: string, value: unknown) => {
  window.appInteractor.updatePreference(key, value);
};
</script>

<template>
  <div class="flex flex-col w-full text-neutral-800 dark:text-neutral-300">
    <div class="text-base font-semibold mb-4">Mainview Preview</div>
    <ListItem
      class="bg-neutral-200 dark:bg-neutral-700 w-[800px] cursor-default"
      :title="item.title"
      :authors="item.authors"
      :year="preference.showMainYear ? item.pubTime : ''"
      :publication="preference.showMainPublication ? item.publication : ''"
      :pubType="preference.showMainPubType ? item.pubType : -1"
      :flag="preference.showMainFlag ? item.flag : false"
      :rating="preference.showMainRating ? item.rating : 0"
      :tags="preference.showMainTags ? item.tags : []"
      :folders="preference.showMainFolders ? item.folders : []"
      :note="preference.showMainNote ? item.note : ''"
    />

    <div class="flex mt-6 flex-wrap">
      <MainSection
        description="Year"
        :enable="preference.showMainYear"
        @click="onUpdate('showMainYear', !preference.showMainYear)"
      >
        <BIconCalendarDate class="my-auto text-xs" />
      </MainSection>
      <MainSection
        description="Publication"
        :enable="preference.showMainPublication"
        @click="
          onUpdate('showMainPublication', !preference.showMainPublication)
        "
      >
        <BIconFonts class="my-auto text-xs" />
      </MainSection>
      <MainSection
        description="PubType"
        :enable="preference.showMainPubType"
        @click="onUpdate('showMainPubType', !preference.showMainPubType)"
      >
        <BIconBook class="my-auto text-xs" />
      </MainSection>
      <MainSection
        description="Flag"
        :enable="preference.showMainFlag"
        @click="onUpdate('showMainFlag', !preference.showMainFlag)"
      >
        <BIconFlag class="my-auto text-xs" />
      </MainSection>
      <MainSection
        description="Rating"
        :enable="preference.showMainRating"
        @click="onUpdate('showMainRating', !preference.showMainRating)"
      >
        <BIconStar class="my-auto text-xs" />
      </MainSection>
      <MainSection
        description="Tags"
        :enable="preference.showMainTags"
        @click="onUpdate('showMainTags', !preference.showMainTags)"
      >
        <BIconTag class="my-auto text-xs" />
      </MainSection>
      <MainSection
        description="Folders"
        :enable="preference.showMainFolders"
        @click="onUpdate('showMainFolders', !preference.showMainFolders)"
      >
        <BIconFolder class="my-auto text-xs" />
      </MainSection>
      <MainSection
        description="Note"
        :enable="preference.showMainNote"
        @click="onUpdate('showMainNote', !preference.showMainNote)"
      >
        <BIconCardHeading class="my-auto text-xs" />
      </MainSection>
    </div>
  </div>
</template>
