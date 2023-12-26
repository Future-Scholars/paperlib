<script setup lang="ts">
import { PropType, ref } from "vue";

import { PaperEntity } from "@/models/paper-entity";
import { IPaperEntityCollection } from "@/repositories/db-repository/paper-entity-repository";

import PaperTableItem from "./components/paper-table-item.vue";
import TableHeader from "./components/table-header.vue";

const props = defineProps({
  entities: {
    type: Object as PropType<IPaperEntityCollection>,
    required: true,
  },
  fieldEnable: {
    type: Object as PropType<Partial<Record<keyof PaperEntity, boolean>>>,
    required: true,
  },
  fieldLabel: {
    type: Object as PropType<Partial<Record<keyof PaperEntity, string>>>,
    required: true,
  },
  fieldWidth: {
    type: Object as PropType<Partial<Record<keyof PaperEntity, number>>>,
    required: true,
  },
  categorizerSortBy: {
    type: String,
    default: "name",
  },
  categorizerSortOrder: {
    type: String,
    default: "asce",
  },
  entitySortBy: {
    type: String,
    default: "addTime",
  },
  entitySortOrder: {
    type: String,
    default: "desc",
  },
  platform: {
    type: String,
    required: true,
  },
  selectedIndex: {
    type: Array<number>,
    required: true,
  },
});

// ================
// State
const lastSelectedSingleIndex = ref<number>(-1);

// =================
// Event handlers
const emits = defineEmits([
  "event:click",
  "event:dblclick",
  "event:contextmenu",
  "event:drag",
  "event:header-click",
  "event:header-width-change",
]);

const calSelectedIndex = (event: MouseEvent, index: number) => {
  let selectedIndexBuffer = JSON.parse(JSON.stringify(props.selectedIndex));
  if (event.shiftKey) {
    const minIndex = Math.min(lastSelectedSingleIndex.value, index);
    const maxIndex = Math.max(lastSelectedSingleIndex.value, index);
    selectedIndexBuffer = [];
    for (let i = minIndex; i <= maxIndex; i++) {
      selectedIndexBuffer.push(i);
    }
  } else if (
    (event.ctrlKey && props.platform !== "darwin") ||
    (event.metaKey && props.platform === "darwin")
  ) {
    if (selectedIndexBuffer.indexOf(index) >= 0) {
      selectedIndexBuffer.splice(selectedIndexBuffer.indexOf(index), 1);
    } else {
      selectedIndexBuffer.push(index);
    }
  } else {
    selectedIndexBuffer = [index];
    lastSelectedSingleIndex.value = index;
  }

  return selectedIndexBuffer;
};

const onItemClicked = (event: MouseEvent, index: number) => {
  const selectedIndex = calSelectedIndex(event, index);
  emits("event:click", selectedIndex);
};

const onItemRightClicked = (event: MouseEvent, index: number) => {
  let selectedIndex = props.selectedIndex;
  if (props.selectedIndex.indexOf(index) === -1) {
    selectedIndex = calSelectedIndex(event, index);
  }
  emits("event:contextmenu", selectedIndex);
};

const onItemDoubleClicked = (event: MouseEvent, index: number) => {
  const selectedIndex = calSelectedIndex(event, index);
  emits("event:dblclick", selectedIndex);
};

const onItemDraged = (event: DragEvent, index: number) => {
  const el = event.target as HTMLElement;
  event.dataTransfer?.setDragImage(el, 0, 0);
  event.dataTransfer?.setData("text/plain", "paperlibEvent-drag-main-item");

  let selectedIndex = props.selectedIndex;
  if (props.selectedIndex.indexOf(index) === -1) {
    selectedIndex = calSelectedIndex(event, index);
  }
  emits("event:drag", selectedIndex);
};
</script>

<template>
  <div class="flex flex-col">
    <TableHeader
      class="mb-1"
      :sort-by="entitySortBy"
      :sort-order="entitySortOrder"
      :field-label="fieldLabel"
      :field-width="fieldWidth"
      @event:click="(key: string) => emits('event:header-click', key)"
      @event:width-change="(payloads: {'key': string, 'width': number}[]) => emits('event:header-width-change', payloads)"
    />
    <RecycleScroller
      class="scroller h-full table-body"
      :items="entities"
      :item-size="28"
      key-field="id"
      v-slot="{ item, index }"
      :buffer="300"
    >
      <PaperTableItem
        :id="item.id"
        :item="item"
        :field-enable="fieldEnable"
        :field-width="fieldWidth"
        :categorizer-sort-by="categorizerSortBy"
        :categorizer-sort-order="categorizerSortOrder"
        :active="selectedIndex.indexOf(index) >= 0"
        :striped="index % 2 === 0"
        @click="(e: MouseEvent) => {onItemClicked(e, index)}"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, index)}"
        @dblclick="(e: MouseEvent) => {onItemDoubleClicked(e, index)}"
        draggable="true"
        @dragstart="onItemDraged"
      />
    </RecycleScroller>
  </div>
</template>
