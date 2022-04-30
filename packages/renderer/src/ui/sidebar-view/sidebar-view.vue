<script setup lang="ts">
import { ref } from "vue";

import {
  BIconCollection,
  BIconFlag,
  BIconTag,
  BIconFolder,
} from "bootstrap-icons-vue";

import WindowControlBar from "./components/window-control-bar.vue";
import SectionTitle from "./components/section-title.vue";
import SectionItem from "./components/section-item.vue";
import CollopseGroup from "./components/collopse-group.vue";
import {
  PaperTag,
  PaperFolder,
} from "../../../../preload/models/PaperCategorizer";

const props = defineProps({
  tags: Array as () => Array<PaperTag>,
  folders: Array as () => Array<PaperFolder>,
});

const entitiesCount = ref(0);
const selectedCategorizer = ref("lib-all");
const isSpinnerShown = ref(false);

const onSelectCategorizer = (categorizer: string) => {
  window.appInteractor.setState(
    "selectionState.selectedCategorizer",
    JSON.stringify(categorizer)
  );
};

window.appInteractor.registerState(
  "viewState.processingQueueCount",
  (value) => {
    const processingQueueCount = JSON.parse(value as string) as number;
    if (processingQueueCount > 0) {
      isSpinnerShown.value = true;
    } else {
      isSpinnerShown.value = false;
    }
  }
);

window.appInteractor.registerState("viewState.entitiesCount", (value) => {
  entitiesCount.value = JSON.parse(value as string) as number;
});

window.appInteractor.registerState(
  "selectionState.selectedCategorizer",
  (value) => {
    selectedCategorizer.value = JSON.parse(value as string) as string;
  }
);
</script>

<template>
  <div class="flex-none flex flex-col w-80 h-screen">
    <WindowControlBar class="flex-none" />

    <div class="w-full px-3 overflow-y-auto no-scrollbar">
      <SectionTitle class="w-full h-7" title="Library" />
      <SectionItem
        name="All Papers"
        :count="entitiesCount"
        :with-counter="true"
        :with-spinner="isSpinnerShown"
        :active="selectedCategorizer === 'lib-all'"
        @click="onSelectCategorizer('lib-all')"
      >
        <BIconCollection class="text-sm my-auto text-blue-500" />
      </SectionItem>
      <SectionItem
        name="Flags"
        :with-counter="false"
        :with-spinner="false"
        :active="selectedCategorizer === 'lib-flaged'"
        @click="onSelectCategorizer('lib-flaged')"
      >
        <BIconFlag class="text-sm my-auto text-blue-500" />
      </SectionItem>

      <CollopseGroup title="Tags">
        <SectionItem
          :name="tag.name"
          :count="tag.count"
          :with-counter="true"
          :with-spinner="false"
          v-for="tag in tags"
          :active="selectedCategorizer === `tag-${tag.name}`"
          @click="onSelectCategorizer(`tag-${tag.name}`)"
        >
          <BIconTag class="text-sm my-auto text-blue-500" />
        </SectionItem>
      </CollopseGroup>

      <CollopseGroup title="Folders">
        <SectionItem
          :name="folder.name"
          :count="folder.count"
          :with-counter="true"
          :with-spinner="false"
          v-for="folder in folders"
          :active="selectedCategorizer === `folder-${folder.name}`"
          @click="onSelectCategorizer(`folder-${folder.name}`)"
        >
          <BIconFolder class="text-sm my-auto text-blue-500" />
        </SectionItem>
      </CollopseGroup>
    </div>
  </div>
</template>
