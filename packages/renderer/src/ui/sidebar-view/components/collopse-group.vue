<script setup lang="ts">
import { BIconChevronDown, BIconChevronRight } from "bootstrap-icons-vue";
import { ref } from "vue";

const props = defineProps({
  title: String,
});

const collopsed = ref(false);
</script>

<template>
  <div
    class="w-full h-7 flex space-x-1 rounded-md pl-2 pr-1 cursor-pointer"
    @click="collopsed = !collopsed"
  >
    <BIconChevronDown
      class="my-auto text-xs text-neutral-400"
      v-if="!collopsed"
    />
    <BIconChevronRight
      class="my-auto text-xs text-neutral-400"
      v-if="collopsed"
    />
    <div class="my-auto text-xxs font-bold text-neutral-400 select-none">
      {{ title }}
    </div>
  </div>

  <div class="w-full pl-1 overflow-y-auto no-scrollbar" v-if="!collopsed">
    <slot></slot>
  </div>
</template>
