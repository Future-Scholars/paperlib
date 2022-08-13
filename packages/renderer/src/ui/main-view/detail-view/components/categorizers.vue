<script setup lang="ts">
import { PropType } from "vue";
import { PaperCategorizer } from "../../../../../../preload/models/PaperCategorizer";
import { BIconXLg } from "bootstrap-icons-vue";

const props = defineProps({
  categorizers: {
    type: Array as PropType<PaperCategorizer[]>,
    required: true,
  },
  categorizerType: String,
});

const emits = defineEmits(["delete-categorizer"]);

const onClick = (e: MouseEvent, categorizer: string) => {
  e.preventDefault();
  e.stopPropagation();
  window.appInteractor.setState("viewState.searchMode", "advanced");

  const key = props.categorizerType === "PaperTag" ? "tags" : "folders";

  window.appInteractor.setState(
    "viewState.searchText",
    `${key}.name contains '${categorizer}'`
  );
};

const onDeleteClick = (e: MouseEvent, categorizer: string) => {
  e.preventDefault();
  e.stopPropagation();
  emits("delete-categorizer", categorizer);
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
        :class="{
          'bg-blue-500':
            categorizer.color === 'blue' || categorizer.color === null,
          'bg-red-500': categorizer.color === 'red',
          'bg-green-500': categorizer.color === 'green',
          'bg-yellow-500': categorizer.color === 'yellow',
        }"
      ></div>
      <div
        class="text-xxs hover:underline my-auto"
        @click="onClick($event, categorizer.name.trim())"
      >
        {{ categorizer.name.trim() }}
      </div>
      <BIconXLg
        class="my-auto text-[0px] group-hover:text-xxs transition-all ease-in-out group-hover:opacity-100 opacity-0"
        @click="onDeleteClick($event, categorizer.name.trim())"
      />
    </div>
  </div>
</template>
