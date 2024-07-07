<script setup lang="ts">
import { PropType } from "vue";

import { IPaperEntityCollection } from "@/repositories/db-repository/paper-entity-repository";
import { FieldTemplate } from "@/renderer/types/data-view";

import TableView from "./table-view.vue";
import { PaperEntity } from "@/models/paper-entity";

const props = defineProps({
  entities: {
    type: Object as PropType<IPaperEntityCollection>,
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
  displayingURL: {
    type: String,
    required: true,
  },
});

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
</script>

<template>
  <splitpanes horizontal>
    <pane :key="1" min-size="12">
      <TableView
        id="table-data-view"
        class="w-full max-h-[calc(100vh-4rem)]"
        :entities="entities"
        :candidates="candidates"
        :field-templates="fieldTemplates"
        :selected-index="selectedIndex"
        :platform="platform"
        :entity-sort-by="entitySortBy"
        :entity-sort-order="entitySortOrder"
        :item-size="itemSize"
        @event:click="(args) => emits('event:click', args)"
        @event:contextmenu="(args) => emits('event:contextmenu', args)"
        @event:dblclick="(args) => emits('event:dblclick', args)"
        @event:drag="(args) => emits('event:drag', args)"
        @event:drag-file="(args) => emits('event:drag-file', args)"
        @event:header-click="(args) => emits('event:header-click', args)"
        @event:header-width-change="
          (args) => emits('event:header-width-change', args)
        "
        @event:click-candidate-btn="
          (args) => emits('event:click-candidate-btn', args)
        "
      />
    </pane>
    <pane
      id="table-reader-data-view"
      :key="1"
      min-size="12"
      v-if="displayingURL"
    >
      <div class="w-full h-full">
        <iframe class="w-full h-full rounded-lg" :src="displayingURL" />
      </div>
    </pane>
  </splitpanes>
</template>
