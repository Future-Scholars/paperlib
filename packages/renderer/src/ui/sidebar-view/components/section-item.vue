<script setup lang="ts">
import Spinner from "./spinner.vue";
import Counter from "./counter.vue";

const props = defineProps({
  name: String,
  count: Number,
  active: Boolean,
  withSpinner: Boolean,
  withCounter: Boolean,
});
</script>

<template>
  <div
    class="w-full h-7 flex justify-between rounded-md pl-2 pr-1 cursor-pointer"
    :class="active ? 'bg-neutral-400 bg-opacity-30' : ''"
  >
    <div class="my-auto flex space-x-2">
      <slot></slot>
      <span class="my-auto text-xs select-none">
        {{ name }}
      </span>
    </div>
    <div class="my-auto flex space-x-2">
      <Spinner class="m-auto" v-show="withSpinner" />
      <Counter class="m-auto" :value="count" v-if="withCounter" />
    </div>
  </div>
</template>
