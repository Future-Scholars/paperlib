<script setup lang="ts">
// @ts-ignore
import dragDrop from "drag-drop";
import { Ref, inject, onMounted, ref, watch } from "vue";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

import RecycleScroller from "@/renderer/thirdparty/virutalscroll/src/components/RecycleScroller.vue";
import { PaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import ListItem from "./components/list-item.vue";
import TableItem from "./components/table-item.vue";
import TableTitle from "./components/table-title.vue";

// ================================
// State
// ================================
const selectionState = MainRendererStateStore.useSelectionState();
const prefState = MainRendererStateStore.usePreferenceState();

// ================================
// Data
// ================================
const paperEntities = inject<Ref<PaperEntityResults>>("paperEntities");

const selectedIndex: Ref<number[]> = ref([]);
const selectedLastSingleIndex = ref(-1);

const onItemClicked = (event: MouseEvent, index: number) => {
  if (event.shiftKey) {
    const minIndex = Math.min(selectedLastSingleIndex.value, index);
    const maxIndex = Math.max(selectedLastSingleIndex.value, index);
    selectedIndex.value = [];
    for (let i = minIndex; i <= maxIndex; i++) {
      selectedIndex.value.push(i);
    }
  } else if (event.ctrlKey) {
    if (selectedIndex.value.indexOf(index) >= 0) {
      selectedIndex.value.splice(selectedIndex.value.indexOf(index), 1);
    } else {
      selectedIndex.value.push(index);
    }
  } else {
    selectedIndex.value = [index];
    selectedLastSingleIndex.value = index;
  }
  selectionState.selectedIndex = selectedIndex.value;
};

const onItemRightClicked = (event: MouseEvent, index: number) => {
  if (selectedIndex.value.indexOf(index) === -1) {
    onItemClicked(event, index);
  }
  window.appInteractor.showContextMenu(
    "show-data-context-menu",
    selectedIndex.value.length === 1
  );
};

const onItemDoubleClicked = (event: MouseEvent, index: number, url: string) => {
  selectedIndex.value = [index];
  selectionState.selectedIndex = selectedIndex.value;
  window.appInteractor.open(url);
};

const registerDropHandler = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  dragDrop("#data-view", {
    // @ts-ignore
    onDrop: async (files, pos, fileList, directories) => {
      const filePaths: string[] = [];
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      files.forEach((file) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        filePaths.push(`file://${file.path as string}`);
      });
      await window.entityInteractor.create(filePaths);
    },
  });
};

const dragHandler = (event: DragEvent) => {
  const el = event.target as HTMLElement;
  event.dataTransfer?.setDragImage(el, 0, 0);
  event.dataTransfer?.setData("text/plain", "paperlibEvent-drag-main-item");

  selectionState.dragedIds = [el.id];
};

const showingUrl = ref("");
const accessMainFile = async (index: number) => {
  const paperEntity = paperEntities?.value[index];
  if (paperEntity) {
    const url = await window.appInteractor.access(paperEntity!.mainURL, false);
    showingUrl.value = `./viewer/viewer.html?file=${url}`;
  } else {
    showingUrl.value = "";
  }
};

watch(
  () => selectionState.selectedIndex,
  (newSelectedIndex) => {
    if (newSelectedIndex.length === 1 && selectedIndex.value.length === 1) {
      selectedLastSingleIndex.value = newSelectedIndex[0];
    }

    selectedIndex.value = newSelectedIndex;

    if (newSelectedIndex.length === 0) {
      selectedIndex.value = [];
    }

    if (prefState.mainviewType === "tableandpreview") {
      accessMainFile(newSelectedIndex[0]);
    }
  }
);

watch(
  () => prefState.mainviewType,
  (newMainviewType) => {
    if (newMainviewType === "tableandpreview") {
      if (selectionState.selectedIndex.length === 1) {
        accessMainFile(selectionState.selectedIndex[0]);
      }
    }
  }
);

onMounted(() => {
  registerDropHandler();
});
</script>

<template>
  <div id="data-view" class="grow pl-2">
    <RecycleScroller
      class="scroller pr-2 max-h-[calc(100vh-3rem)]"
      :items="paperEntities"
      :item-size="64"
      key-field="id"
      v-slot="{ item, index }"
      :buffer="500"
      v-if="prefState.mainviewType === 'list'"
    >
      <ListItem
        :id="item.id"
        :item="item"
        :active="selectedIndex.indexOf(index) >= 0"
        :showPubTime="prefState.showMainYear"
        :showPublication="prefState.showMainPublication"
        :showRating="prefState.showMainRating"
        :showPubType="prefState.showMainPubType"
        :showTags="prefState.showMainTags"
        :showFolders="prefState.showMainFolders"
        :showNote="prefState.showMainNote"
        :showFlag="prefState.showMainFlag"
        :read="true"
        @click="(e: MouseEvent) => {onItemClicked(e, index)}"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, index)}"
        @dblclick="(e: MouseEvent) => {onItemDoubleClicked(e, index, item.mainURL)}"
        draggable="true"
        v-on:dragstart="dragHandler"
      />
    </RecycleScroller>

    <TableTitle
      class="mb-1"
      :sortBy="prefState.mainviewSortBy"
      :sortOrder="prefState.mainviewSortOrder"
      :showPubTime="prefState.showMainYear"
      :showPublication="prefState.showMainPublication"
      :showRating="prefState.showMainRating"
      :showPubType="prefState.showMainPubType"
      :showTags="prefState.showMainTags"
      :showFolders="prefState.showMainFolders"
      :showNote="prefState.showMainNote"
      :showFlag="prefState.showMainFlag"
      v-if="
        prefState.mainviewType === 'table' ||
        prefState.mainviewType === 'tableandpreview'
      "
    />

    <splitpanes horizontal class="max-h-[calc(100vh-5rem)]">
      <pane :key="1" min-size="12">
        <RecycleScroller
          class="scroller pr-2 h-full pb-4"
          :items="paperEntities"
          :item-size="28"
          key-field="id"
          v-slot="{ item, index }"
          :buffer="500"
          v-if="
            prefState.mainviewType === 'table' ||
            prefState.mainviewType === 'tableandpreview'
          "
        >
          <TableItem
            :id="item.id"
            :item="item"
            :active="selectedIndex.indexOf(index) >= 0"
            :showPubTime="prefState.showMainYear"
            :showPublication="prefState.showMainPublication"
            :showRating="prefState.showMainRating"
            :showPubType="prefState.showMainPubType"
            :showTags="prefState.showMainTags"
            :showFolders="prefState.showMainFolders"
            :showNote="prefState.showMainNote"
            :showFlag="prefState.showMainFlag"
            :read="true"
            :striped="index % 2 === 0"
            @click="(e: MouseEvent) => {onItemClicked(e, index)}"
            @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, index)}"
            @dblclick="(e: MouseEvent) => {onItemDoubleClicked(e, index, item.mainURL)}"
            draggable="true"
            v-on:dragstart="dragHandler"
          />
        </RecycleScroller>
      </pane>
      <pane
        :key="1"
        min-size="12"
        v-if="
          prefState.mainviewType === 'tableandpreview' &&
          selectedIndex.length === 1
        "
      >
        <div class="w-full h-full pr-2">
          <iframe class="w-full h-full rounded-lg" :src="showingUrl" />
        </div>
      </pane>
    </splitpanes>
  </div>
</template>
