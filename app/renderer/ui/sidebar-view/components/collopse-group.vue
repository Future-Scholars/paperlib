<script setup lang="ts">
import {
  BIconChevronDown,
  BIconChevronRight,
  BIconPlus,
} from "bootstrap-icons-vue";
import { ref } from "vue";

const props = defineProps({
  title: String,
  withAdd: Boolean,
});

const emits = defineEmits(["event:add-click"]);

const collopsed = ref(false);
</script>

<template>
  <div
    class="w-full h-7 flex justify-between rounded-md pl-2 pr-1 cursor-pointer group"
    @click="collopsed = !collopsed"
  >
    <div class="flex space-x-1">
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
    <BIconPlus
      class="my-auto text-neutral-400 hover:text-neutral-500 hover:dark:text-neutral-300 invisible group-hover:visible"
      v-if="withAdd"
      @click="
        (e: MouseEvent) => {
          e.stopPropagation();
          emits('event:add-click');
        }
      "
    />
  </div>

  <div class="w-full pl-1 overflow-y-auto no-scrollbar" v-if="!collopsed">
    <slot></slot>
  </div>
</template>
