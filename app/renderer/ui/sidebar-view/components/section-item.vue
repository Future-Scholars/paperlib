<script setup lang="ts">
import { ref } from "vue";

import Spinner from "../../components/spinner.vue";
import Counter from "./counter.vue";

const props = defineProps({
  name: String,
  count: Number,
  active: Boolean,
  withSpinner: Boolean,
  withCounter: Boolean,
  compact: Boolean,
  editing: Boolean,
});

const emits = defineEmits([
  "event:drop",
  "event:item-drop",
  "event:name-change",
  "event:name-input-blur",
]);

const onDropped = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();

  const files = event.dataTransfer?.files || [];
  const text = event.dataTransfer?.getData("text") || "";

  const filePaths: string[] = [];
  (files as unknown as Array<{ path: string }>).forEach((file) => {
    filePaths.push(file.path);
  });
  if (filePaths.length > 0) {
    emits("event:drop", filePaths);
  }

  if (text) {
    emits("event:item-drop");
  }
};

const onNameChanged = (event) => {
  emits("event:name-change", event.target.value);
};

const onNameInputBlured = () => {
  emits("event:name-input-blur");
};
</script>

<template>
  <div
    class="w-full flex justify-between rounded-md pl-2 pr-1 cursor-pointer space-x-2"
    :class="{
      'bg-neutral-400 bg-opacity-30': active,
      'h-6': compact,
      'h-7': !compact,
    }"
    @dragenter.prevent
    @dragover.prevent
    @drop="onDropped"
  >
    <slot></slot>
    <div
      class="my-auto text-xs select-none text-ellipsis overflow-hidden whitespace-nowrap grow"
      v-if="!editing"
      @drop="onDropped"
    >
      {{ name }}
    </div>
    <input
      class="my-auto text-xs bg-transparent grow text-ellipsis overflow-hidden whitespace-nowrap border-2 rounded-md px-1 border-accentlight dark:border-accentdark"
      type="text"
      :value="name"
      v-if="editing"
      @change="onNameChanged"
      @blur="onNameInputBlured"
    />
    <div class="my-auto flex space-x-2">
      <Spinner class="m-auto" v-show="withSpinner" />
      <Counter class="m-auto" :value="count" v-if="withCounter" />
    </div>
  </div>
</template>
