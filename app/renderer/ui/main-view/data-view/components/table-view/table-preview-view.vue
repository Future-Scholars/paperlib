<script setup lang="ts">
import { PropType } from "vue";

import { PaperEntity } from "@/models/paper-entity";
import { IPaperEntityCollection } from "@/repositories/db-repository/paper-entity-repository";

import TableView from "./table-view.vue";

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
  "event:header-click",
  "event:header-width-change",
]);
</script>

<template>
  <splitpanes horizontal>
    <pane :key="1" min-size="12">
      <TableView
        id="table-data-view"
        class="w-full max-h-[calc(100vh-4rem)]"
        :entities="entities"
        :field-enable="fieldEnable"
        :field-label="fieldLabel"
        :field-width="fieldWidth"
        :selected-index="selectedIndex"
        :platform="platform"
        :categorizer-sort-by="categorizerSortBy"
        :categorizer-sort-order="categorizerSortOrder"
        :entity-sort-by="entitySortBy"
        :entity-sort-order="entitySortOrder"
        @event:click="(args) => emits('event:click', args)"
        @event:contextmenu="(args) => emits('event:contextmenu', args)"
        @event:dblclick="(args) => emits('event:dblclick', args)"
        @event:drag="(args) => emits('event:drag', args)"
        @event:header-click="(args) => emits('event:header-click', args)"
        @event:header-width-change="
          (args) => emits('event:header-width-change', args)
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
