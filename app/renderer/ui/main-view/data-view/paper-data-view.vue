<script setup lang="ts">
// @ts-ignore
import dragDrop from "drag-drop";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { inject, onMounted, provide, ref, Ref, watch } from "vue";

import ListItem from "./components/list-item.vue";
import TableTitle from "./components/table-title.vue";
import TableItem from "./components/table-item.vue";

import { MainRendererStateStore } from "@/state/renderer/appstate";
import { PaperEntity } from "@/models/paper-entity";
import { PaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";

// ================================
// State
// ================================
const viewState = MainRendererStateStore.useViewState();
const selectionState = MainRendererStateStore.useSelectionState();
const dataViewState = MainRendererStateStore.useDataViewState();

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
      // TODO: uncomment this
      // await window.entityInteractor.add(filePaths);
    },
  });
};

const dragHandler = (event: DragEvent) => {
  const el = event.target as HTMLElement;
  event.dataTransfer?.setDragImage(el, 0, 0);
  event.dataTransfer?.setData("text/plain", "paperlibEvent-drag-main-item");

  // TODO: make this better.
  selectionState.dragedIds = [el.id];
};

// TODO: Why we need this?
// watch(
//   () => selectionState.selectedIndex,
//   (value) => {
//     if (newSelectedIndex.length === 1 && selectedIndex.value.length === 1) {
//       selectedLastSingleIndex.value = newSelectedIndex[0];
//     }

//     selectedIndex.value = newSelectedIndex;

//     if (newSelectedIndex.length === 0) {
//       selectedIndex.value = [];
//     }
//   }
// );

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
      v-if="viewState.viewType === 'list'"
    >
      <ListItem
        :item="item"
        :active="selectedIndex.indexOf(index) >= 0"
        :showPubTime="dataViewState.showPubTime"
        :showPublication="dataViewState.showPublication"
        :showRating="dataViewState.showRating"
        :showPubType="dataViewState.showPubType"
        :showTags="dataViewState.showTags"
        :showFolders="dataViewState.showFolders"
        :showNote="dataViewState.showNote"
        :showFlag="dataViewState.showFlag"
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
      :sortBy="viewState.sortBy"
      :sortOrder="viewState.sortOrder"
      v-if="viewState.viewType === 'table'"
    />
    <RecycleScroller
      class="scroller pr-2 max-h-[calc(100vh-5rem)]"
      :items="paperEntities"
      :item-size="28"
      key-field="id"
      v-slot="{ item, index }"
      :buffer="500"
      v-if="viewState.viewType === 'table'"
    >
      <TableItem
        :item="item"
        :active="selectedIndex.indexOf(index) >= 0"
        :striped="index % 2 === 0"
        @click="(e: MouseEvent) => {onItemClicked(e, index)}"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, index)}"
        @dblclick="(e: MouseEvent) => {onItemDoubleClicked(e, index, item.mainURL)}"
      />
    </RecycleScroller>
  </div>
</template>
