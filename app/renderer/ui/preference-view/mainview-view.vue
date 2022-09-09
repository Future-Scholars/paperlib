<script setup lang="ts">
import {
  BIconBook,
  BIconCalendarDate,
  BIconCardHeading,
  BIconFlag,
  BIconFolder,
  BIconFonts,
  BIconStar,
  BIconTag,
} from "bootstrap-icons-vue";
import { ObjectId } from "bson";
import { ref } from "vue";

import { PaperFolder, PaperTag } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import ListItem from "@/renderer/ui/main-view/data-view/components/list-item.vue";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import MainSection from "./components/main-section.vue";

const prefState = MainRendererStateStore.usePreferenceState();

const item = ref(new PaperEntity(false));
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
  setValue: function (key: string, value: unknown, allowEmpty?: boolean): void {
    throw new Error("Function not implemented.");
  },
  initialize: function (entity: PaperEntity): PaperEntity {
    throw new Error("Function not implemented.");
  },
  dummyFill: function (): PaperEntity {
    throw new Error("Function not implemented.");
  },
});

const updatePref = (key: string, value: unknown) => {
  window.appInteractor.setPreference(key, value);
};
</script>

<template>
  <div class="flex flex-col w-full text-neutral-800 dark:text-neutral-300">
    <div class="text-base font-semibold mb-4">Mainview Preview</div>
    <ListItem
      class="bg-neutral-200 dark:bg-neutral-700 w-[800px] cursor-default"
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
    </div>
  </div>
</template>
