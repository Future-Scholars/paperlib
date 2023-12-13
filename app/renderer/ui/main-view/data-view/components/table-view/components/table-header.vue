<script setup lang="ts">
import { PropType, ref } from "vue";

import { PaperEntity } from "@/models/paper-entity";

import TableHeaderItem from "./table-header-item.vue";

const props = defineProps({
  sortBy: {
    type: String,
    required: true,
  },
  sortOrder: {
    type: String,
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
  minWidth: {
    type: Number,
    required: false,
    default: 56,
  },
});

const emits = defineEmits(["event:click", "event:width-change"]);

const titleContainer = ref<HTMLDivElement | null>(null);

const onResizeBarMouseDown = (event: MouseEvent, index: number) => {
  const moveListener = (moveEvent: MouseEvent) =>
    onResizeBarMouseMove(event, moveEvent);
  document.addEventListener("mousemove", moveListener);
  document.addEventListener(
    "mouseup",
    () => {
      document.removeEventListener("mousemove", moveListener);
      emits("event:width-change", [
        {
          key: Object.keys(props.fieldWidth)[index - 1],
          width: resizingPrevWidth.value,
        },
        {
          key: Object.keys(props.fieldWidth)[index],
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
      :style="{ width: `${fieldWidth[key]}%` }"
      v-for="[index, [key, label]] of Object.entries(
        Object.entries(fieldLabel)
      )"
    >
      <div
        class="w-1 cursor-col-resize hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors duration-50"
        v-if="parseInt(index) > 0"
        @mousedown="(e) => onResizeBarMouseDown(e, parseInt(index))"
      ></div>
      <TableHeaderItem
        :title="label!"
        :sortBy="sortBy === key"
        :sortOrder="sortOrder"
        @event:click="() => emits('event:click', key)"
      />
    </div>
  </div>
</template>
