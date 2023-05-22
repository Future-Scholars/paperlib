<script setup lang="ts">
import { BIconXLg } from "bootstrap-icons-vue";

import { Categorizer } from "@/models/categorizer";
import { MainRendererStateStore } from "@/state/renderer/appstate";

const props = defineProps({
  categorizers: {
    type: Object as () => Categorizer[],
    required: true,
  },
  categorizerType: String,
});

const emits = defineEmits(["delete-categorizer"]);

// ==============================
// State
// ==============================
const viewState = MainRendererStateStore.useViewState();

const onClick = (e: MouseEvent, categorizerName: string) => {
  e.preventDefault();
  e.stopPropagation();
  viewState.searchMode = "advanced";

  const key = props.categorizerType === "PaperTag" ? "tags" : "folders";

  viewState.searchText = `${key}.name contains '${categorizerName}'`;
};

const onDeleteClick = (e: MouseEvent, categorizer: Categorizer) => {
  e.preventDefault();
  e.stopPropagation();
  emits("delete-categorizer", categorizer);
};

const colorClass = (color?: string) => {
  switch (color) {
    case "blue":
    case null:
    case undefined:
      return "bg-blue-500";
    case "red":
      return "bg-red-500";
    case "green":
      return "bg-green-500";
    case "yellow":
      return "bg-yellow-500";
    case "purple":
      return "bg-purple-500";
    case "pink":
      return "bg-pink-500";
    case "orange":
      return "bg-orange-500";
    case "cyan":
      return "bg-cyan-500";
  }
};
</script>

<template>
  <div class="flex flex-wrap space-x-2">
    <div
      class="flex cursor-pointer space-x-[2px] group"
      v-for="categorizer in categorizers"
    >
      <div
        class="w-[2px] h-[10px] my-auto"
        :class="colorClass(categorizer.color)"
      ></div>
      <div
        class="text-xxs hover:underline my-auto"
        @click="onClick($event, categorizer.name)"
      >
        {{ categorizer.name }}
      </div>
      <BIconXLg
        class="my-auto text-[0px] group-hover:text-xxs transition-all ease-in-out group-hover:opacity-100 opacity-0"
        @click="onDeleteClick($event, categorizer)"
      />
    </div>
  </div>
</template>
