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
import NotificationBar from "./components/notification-bar.vue";

const props = defineProps({
  tags: Array as () => Array<PaperTag>,
  folders: Array as () => Array<PaperFolder>,
  showSidebarCount: Boolean,
  compact: Boolean,
});

const entitiesCount = ref(0);
const selectedCategorizer = ref("lib-all");
const isSpinnerShown = ref(false);

const onSelectCategorizer = (categorizer: string) => {
  window.appInteractor.setState(
    "selectionState.selectedCategorizer",
    categorizer
  );
};

const deleteCategorizer = (categorizer: string) => {
  if (categorizer.startsWith("tag-")) {
    window.entityInteractor.deleteCategorizer(
      categorizer.replaceAll("tag-", ""),
      "PaperTag"
    );
  } else {
    window.entityInteractor.deleteCategorizer(
      categorizer.replaceAll("folder-", ""),
      "PaperFolder"
    );
  }
};

const colorizeCategorizer = (categorizer: string, color: string) => {
  if (categorizer.startsWith("tag-")) {
    window.entityInteractor.colorizeCategorizers(
      categorizer.replaceAll("tag-", ""),
      "PaperTag",
      color
    );
  } else {
    window.entityInteractor.colorizeCategorizers(
      categorizer.replaceAll("folder-", ""),
      "PaperFolder",
      color
    );
  }
};

const onItemRightClicked = (event: MouseEvent, categorizer: string) => {
  window.appInteractor.showContextMenu(
    "show-sidebar-context-menu",
    categorizer
  );
};

window.appInteractor.registerMainSignal(
  "sidebar-context-menu-delete",
  (args) => {
    deleteCategorizer(args);
  }
);

window.appInteractor.registerMainSignal(
  "sidebar-context-menu-color",
  (args) => {
    colorizeCategorizer(args[0], args[1]);
  }
);

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
    selectedCategorizer.value = value as string;
  }
);
</script>

<template>
  <div class="flex-none flex flex-col w-full h-screen justify-between">
    <div>
      <WindowControlBar class="flex-none" />

      <div
        class="w-full h-[calc(100vh-5rem)] px-3 overflow-y-auto no-scrollbar"
      >
        <SectionTitle class="w-full h-7" title="Library" />
        <SectionItem
          name="All Papers"
          :count="entitiesCount"
          :with-counter="showSidebarCount"
          :with-spinner="isSpinnerShown"
          :compact="compact"
          :active="selectedCategorizer === 'lib-all'"
          @click="onSelectCategorizer('lib-all')"
        >
          <BIconCollection class="text-sm my-auto text-blue-500 min-w-[1em]" />
        </SectionItem>
        <SectionItem
          name="Flags"
          :with-counter="false"
          :with-spinner="false"
          :compact="compact"
          :active="selectedCategorizer === 'lib-flaged'"
          @click="onSelectCategorizer('lib-flaged')"
        >
          <BIconFlag class="text-sm my-auto text-blue-500 min-w-[1em]" />
        </SectionItem>

        <CollopseGroup title="Tags">
          <SectionItem
            :name="tag.name"
            :count="tag.count"
            :with-counter="showSidebarCount"
            :with-spinner="false"
            :compact="compact"
            v-for="tag in tags"
            :active="selectedCategorizer === `tag-${tag.name}`"
            @click="onSelectCategorizer(`tag-${tag.name}`)"
            @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, `tag-${tag.name}`)}"
          >
            <BIconTag
              class="text-sm my-auto min-w-[1em]"
              :class="{
                'text-blue-500': tag.color === 'blue' || tag.color === null,
                'text-red-500': tag.color === 'red',
                'text-green-500': tag.color === 'green',
                'text-yellow-500': tag.color === 'yellow',
              }"
            />
          </SectionItem>
        </CollopseGroup>

        <CollopseGroup title="Folders">
          <SectionItem
            :name="folder.name"
            :count="folder.count"
            :with-counter="showSidebarCount"
            :with-spinner="false"
            :compact="compact"
            v-for="folder in folders"
            :active="selectedCategorizer === `folder-${folder.name}`"
            @click="onSelectCategorizer(`folder-${folder.name}`)"
            @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, `folder-${folder.name}`)}"
          >
            <BIconFolder
              class="text-sm my-auto min-w-[1em]"
              :class="{
                'text-blue-500':
                  folder.color === 'blue' || folder.color === null,
                'text-red-500': folder.color === 'red',
                'text-green-500': folder.color === 'green',
                'text-yellow-500': folder.color === 'yellow',
              }"
            />
          </SectionItem>
        </CollopseGroup>
      </div>
    </div>
    <NotificationBar class="flex-none" />
  </div>
</template>
