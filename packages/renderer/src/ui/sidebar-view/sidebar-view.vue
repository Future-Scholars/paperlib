<script setup lang="ts">
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
} from "packages/preload/models/PaperCategorizer";

const props = defineProps({
  tags: Array as () => Array<PaperTag>,
  folders: Array as () => Array<PaperFolder>,
});
</script>

<template>
  <div class="flex-none flex flex-col w-80 h-screen">
    <WindowControlBar class="flex-none" />

    <div class="w-full px-3 overflow-y-auto no-scrollbar">
      <SectionTitle class="w-full h-7" title="Library" />
      <SectionItem
        name="All Papers"
        :count="223"
        :with-counter="true"
        :with-spinner="false"
      >
        <BIconCollection class="text-sm my-auto text-blue-500" />
      </SectionItem>
      <SectionItem name="Flags" :with-counter="false" :with-spinner="false">
        <BIconFlag class="text-sm my-auto text-blue-500" />
      </SectionItem>

      <CollopseGroup title="Tags">
        <SectionItem
          :name="tag.name"
          :count="tag.count"
          :with-counter="true"
          :with-spinner="false"
          v-for="tag in tags"
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
        >
          <BIconFolder class="text-sm my-auto text-blue-500" />
        </SectionItem>
      </CollopseGroup>
    </div>
  </div>
</template>
