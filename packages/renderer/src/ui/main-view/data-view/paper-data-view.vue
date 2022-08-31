<script setup lang="ts">
// @ts-ignore
import dragDrop from "drag-drop";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { onMounted, ref, Ref } from "vue";

import { PaperEntity } from "../../../../../preload/models/PaperEntity";
import ListItem from "./components/list-item.vue";
import TableTitle from "./components/table-title.vue";
import TableItem from "./components/table-item.vue";

const props = defineProps({
  entities: Array as () => PaperEntity[],
  sortBy: {
    type: String,
    required: true,
  },
  sortOrder: {
    type: String,
    required: true,
  },
  showMainYear: Boolean,
  showMainPublication: Boolean,
  showMainPubType: Boolean,
  showMainRating: Boolean,
  showMainFlag: Boolean,
  showMainTags: Boolean,
  showMainFolders: Boolean,
  showMainNote: Boolean,
});

const viewType = ref(window.appInteractor.getState("viewState.viewType"));

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
  window.appInteractor.setState(
    "selectionState.selectedIndex",
    JSON.stringify(selectedIndex.value)
  );
};

const onItemRightClicked = (event: MouseEvent, index: number) => {
  if (selectedIndex.value.indexOf(index) === -1) {
    onItemClicked(event, index);
  }
  window.appInteractor.showContextMenu(
    "show-data-context-menu",
    JSON.stringify(selectedIndex.value.length === 1)
  );
};

const onItemDoubleClicked = (event: MouseEvent, index: number, url: string) => {
  selectedIndex.value = [index];
  window.appInteractor.setState(
    "selectionState.selectedIndex",
    JSON.stringify(selectedIndex.value)
  );
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
      await window.entityInteractor.add(filePaths);
    },
  });
};

const dragHandler = (event: DragEvent) => {
  const el = event.target as HTMLElement;
  event.dataTransfer?.setDragImage(el, 0, 0);
  event.dataTransfer?.setData("text/plain", "paperlibEvent-drag-main-item");

  window.appInteractor.setState(
    "selectionState.dragedIds",
    JSON.stringify([el.id])
  );
};

window.appInteractor.registerState("selectionState.selectedIndex", (value) => {
  const newSelectedIndex = JSON.parse(value as string) as number[];

  if (newSelectedIndex.length === 1 && selectedIndex.value.length === 1) {
    selectedLastSingleIndex.value = newSelectedIndex[0];
  }

  selectedIndex.value = newSelectedIndex;

  if (newSelectedIndex.length === 0) {
    selectedIndex.value = [];
  }
});

window.appInteractor.registerState("viewState.viewType", (value) => {
  viewType.value = value as string;
});

onMounted(() => {
  registerDropHandler();
});
</script>

<template>
  <div id="data-view" class="grow pl-2">
    <TableTitle
      :sortBy="sortBy"
      :sortOrder="sortOrder"
      v-if="viewType === 'table'"
    />
    <RecycleScroller
      class="scroller pr-2"
      :class="
        viewType === 'list'
          ? 'max-h-[calc(100vh-3rem)]'
          : 'max-h-[calc(100vh-5rem)]'
      "
      :items="entities"
      :item-size="viewType === 'list' ? 64 : 28"
      key-field="id"
      v-slot="{ item, index }"
    >
      <ListItem
        :id="item.id"
        :title="item.title"
        :authors="item.authors"
        :year="showMainYear ? item.pubTime : ''"
        :publication="showMainPublication ? item.publication : ''"
        :pubType="showMainPubType ? item.pubType : -1"
        :flag="showMainFlag ? item.flag : false"
        :rating="showMainRating ? item.rating : 0"
        :tags="showMainTags ? item.tags : []"
        :folders="showMainFolders ? item.folders : []"
        :note="showMainNote ? item.note : ''"
        :active="selectedIndex.indexOf(index) >= 0"
        :read="true"
        @click="(e: MouseEvent) => {onItemClicked(e, index)}"
        v-if="viewType === 'list'"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, index)}"
        @dblclick="(e: MouseEvent) => {onItemDoubleClicked(e, index, item.mainURL)}"
        draggable="true"
        v-on:dragstart="dragHandler"
      />
      <TableItem
        :id="item.id"
        :title="item.title"
        :authors="item.authors"
        :year="item.pubTime"
        :publication="item.publication"
        :flag="item.flag"
        :active="selectedIndex.indexOf(index) >= 0"
        :striped="index % 2 === 0"
        @click="(e: MouseEvent) => {onItemClicked(e, index)}"
        v-if="viewType === 'table'"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, index)}"
        @dblclick="(e: MouseEvent) => {onItemDoubleClicked(e, index, item.mainURL)}"
      />
    </RecycleScroller>
  </div>
</template>
