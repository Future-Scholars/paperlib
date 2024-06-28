<script setup lang="ts">
import { PropType, ref } from "vue";

import { OID } from "@/models/id";
import { IFeedEntityCollection } from "@/repositories/db-repository/feed-entity-repository";
import { IPaperEntityCollection } from "@/repositories/db-repository/paper-entity-repository";
import { FieldTemplate } from "@/renderer/types/data-view";

import TableItem from "./components/table-item.vue";
import TableHeader from "./components/table-header.vue";
import { PaperEntity } from "@/models/paper-entity";

const props = defineProps({
  entities: {
    type: Object as PropType<IPaperEntityCollection | IFeedEntityCollection>,
    required: true,
  },
  candidates: {
    type: Object as PropType<Record<string, PaperEntity[]>>,
    required: true,
  },
  fieldTemplates: {
    type: Object as PropType<Map<string, FieldTemplate>>,
    required: true,
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
  itemSize: {
    type: Number,
    default: 28,
  },
  selectedIndex: {
    type: Array<number>,
    required: true,
  },
});

// ================
// State
const lastSelectedSingleIndex = ref<number>(-1);
const uiState = uiStateService.useState();

// =================
// Event handlers
const emits = defineEmits([
  "event:click",
  "event:dblclick",
  "event:contextmenu",
  "event:drag",
  "event:drag-file",
  "event:header-click",
  "event:header-width-change",
  "event:click-candidate-btn",
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

const onItemDraged = (event: DragEvent, index: number, id: OID) => {
  event.dataTransfer?.setData(
    "application/json",
    JSON.stringify({
      type: "PaperEntity",
      value: id,
    })
  );

  let selectedIndex = props.selectedIndex;
  if (props.selectedIndex.indexOf(index) === -1) {
    selectedIndex = calSelectedIndex(event, index);
  }

  if (event.altKey || event.metaKey) {
    event.preventDefault();
    event.stopPropagation();
    emits("event:drag-file", selectedIndex);

    return;
  }

  const el = event.target as HTMLElement;
  event.dataTransfer?.setDragImage(el, 0, 0);
  emits("event:drag", selectedIndex);
};
</script>

<template>
  <div class="flex flex-col">
    <TableHeader
      class="mb-1"
      :sort-by="entitySortBy"
      :sort-order="entitySortOrder"
      :field-templates="fieldTemplates"
      @event:click="(key: string) => emits('event:header-click', key)"
      @event:width-change="(payloads: Record<string, number>) => emits('event:header-width-change', payloads)"
    />
    <RecycleScroller
      class="scroller h-full table-body"
      :items="entities"
      :item-size="itemSize"
      key-field="id"
      v-slot="{ item, index }"
      :buffer="300"
    >
      <TableItem
        :id="`item-${index}`"
        :item="item"
        :field-templates="fieldTemplates"
        :active="selectedIndex.indexOf(index) >= 0"
        :striped="index % 2 === 0"
        :read="item.read !== undefined ? item.read : true"
        :query-highlight="
          uiState.commandBarSearchMode === 'general' &&
          !uiState.commandBarText.startsWith('\\')
            ? uiState.commandBarText
            : ''
        "
        :show-candidate-btn="candidates[item.id]?.length > 0"
        @click="(e: MouseEvent) => {onItemClicked(e, index)}"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, index)}"
        @dblclick="(e: MouseEvent) => {onItemDoubleClicked(e, index)}"
        draggable="true"
        @dragstart="(event) => onItemDraged(event, index, item.id)"
        @event:click-candidate-btn="emits('event:click-candidate-btn', item.id)"
      />
    </RecycleScroller>
  </div>
</template>
