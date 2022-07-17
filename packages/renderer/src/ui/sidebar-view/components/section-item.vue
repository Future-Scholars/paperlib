<script setup lang="ts">
// @ts-ignore
import dragDrop from "drag-drop";
import { onMounted, ref } from "vue";

import Spinner from "./spinner.vue";
import Counter from "./counter.vue";

const props = defineProps({
  name: String,
  count: Number,
  active: Boolean,
  withSpinner: Boolean,
  withCounter: Boolean,
  compact: Boolean,
});

const item = ref(null);
const emit = defineEmits(["droped", "item-droped"]);

const registerDropHandler = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  dragDrop(item.value, {
    // @ts-ignore
    onDrop: async (files, pos, fileList, directories) => {
      const filePaths: string[] = [];
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      files.forEach((file) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        filePaths.push(file.path);
      });
      emit("droped", filePaths);
    },
    // @ts-ignore
    onDropText: async (text, pos) => {
      if (text === "paperlibEvent-drag-main-item") {
        emit("item-droped");
      }
    },
  });
};

onMounted(() => {
  registerDropHandler();
});
</script>

<template>
  <div
    ref="item"
    class="w-full flex justify-between rounded-md pl-2 pr-1 cursor-pointer space-x-2"
    :class="{
      'bg-neutral-400 bg-opacity-30': active,
      'h-6': compact,
      'h-7': !compact,
    }"
    v-on:drop="dropHandler"
  >
    <slot></slot>
    <div
      class="my-auto text-xs select-none text-ellipsis overflow-hidden whitespace-nowrap grow"
    >
      {{ name }}
    </div>
    <div class="my-auto flex space-x-2">
      <Spinner class="m-auto" v-show="withSpinner" />
      <Counter class="m-auto" :value="count" v-if="withCounter" />
    </div>
  </div>
</template>
