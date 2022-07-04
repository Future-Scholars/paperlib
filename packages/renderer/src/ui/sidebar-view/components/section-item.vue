<script setup lang="ts">
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
</script>

<template>
  <div
    class="w-full flex justify-between rounded-md pl-2 pr-1 cursor-pointer space-x-2"
    :class="{
      'bg-neutral-400 bg-opacity-30': active,
      'h-6': compact,
      'h-7': !compact,
    }"
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
