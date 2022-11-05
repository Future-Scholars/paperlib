<script setup lang="ts">
import { ref } from "vue";

import TableTitleItem from "./table-title-item.vue";

const props = defineProps({
  sortBy: {
    type: String,
    required: true,
  },
  sortOrder: {
    type: String,
    required: true,
  },
  titles: {
    type: Object as () => Record<string, { name: string; width: number }>,
    required: true,
  },
  minWidth: {
    type: Number,
    required: false,
    default: 56,
  },
});

const emits = defineEmits(["title-clicked", "title-width-changed"]);

const titleContainer = ref<HTMLDivElement | null>(null);

const onTitleClicked = (key: string) => {
  emits("title-clicked", key);
};

const onResizeBarMouseDown = (event: MouseEvent, index: number) => {
  const moveListener = (moveEvent: MouseEvent) =>
    onResizeBarMouseMove(event, moveEvent);
  document.addEventListener("mousemove", moveListener);
  document.addEventListener(
    "mouseup",
    () => {
      document.removeEventListener("mousemove", moveListener);
      emits("title-width-changed", [
        {
          key: Object.keys(props.titles)[index - 1],
          width: resizingPrevWidth.value,
        },
        {
          key: Object.keys(props.titles)[index],
          width: resizingNextWidth.value,
        },
      ]);
      resizingPrevWidth.value = -1;
      resizingNextWidth.value = -1;
    },
    { once: true }
  );
};

const resizingPrevWidth = ref(-1);
const resizingNextWidth = ref(-1);

const onResizeBarMouseMove = (event: MouseEvent, moveEvent: MouseEvent) => {
  // Get Title Container Width
  const titleContainerWidth = titleContainer.value?.clientWidth;
  // Get Pre Element
  const preElement = (event.target as HTMLElement).parentElement
    ?.previousElementSibling;
  const preElementWidth = preElement?.clientWidth;

  // Get Next Element
  const nextElement = (event.target as HTMLElement).parentElement;
  const nextElementWidth = nextElement?.clientWidth;

  const mousePosition = moveEvent.clientX;
  const newPreElementWidth = Math.min(
    Math.max(
      mousePosition - preElement?.getBoundingClientRect().left!,
      props.minWidth
    ),
    nextElementWidth! + preElementWidth! - props.minWidth
  );

  const newNextElementWidth =
    nextElementWidth! + preElementWidth! - newPreElementWidth;

  const newPreElementWidthPercent =
    (newPreElementWidth / titleContainerWidth!) * 100;
  const newNextElementWidthPercent =
    (newNextElementWidth / titleContainerWidth!) * 100;

  // Set New Width
  resizingPrevWidth.value = newPreElementWidthPercent;
  resizingNextWidth.value = newNextElementWidthPercent;
  preElement?.setAttribute("style", `width: ${newPreElementWidthPercent}%`);
  nextElement?.setAttribute("style", `width: ${newNextElementWidthPercent}%`);
};
</script>

<template>
  <div
    class="flex w-full font-semibold text-xs rounded-md select-none cursor-pointer"
    ref="titleContainer"
  >
    <div
      class="flex"
      :style="{ width: `${title.width}%` }"
      v-for="[index, [key, title]] of Object.entries(Object.entries(titles))"
    >
      <div
        class="w-1 cursor-col-resize hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors duration-50"
        v-if="parseInt(index) > 0"
        @mousedown="(e) => onResizeBarMouseDown(e, parseInt(index))"
      ></div>
      <TableTitleItem
        :title="title.name"
        :sortBy="sortBy === key"
        :sortOrder="sortOrder"
        @title-clicked="onTitleClicked(key)"
      />
    </div>
  </div>
</template>
