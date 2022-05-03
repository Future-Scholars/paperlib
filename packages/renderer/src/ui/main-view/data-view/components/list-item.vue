<script setup lang="ts">
import { BIconFlagFill } from "bootstrap-icons-vue";

const props = defineProps({
  title: String,
  authors: String,
  year: String,
  publication: String,
  flag: Boolean,
  active: Boolean,
});
</script>

<template>
  <div
    class="flex flex-col h-[4rem] w-full p-2 rounded-md select-none cursor-pointer"
    :class="active ? 'bg-accentlight dark:bg-accentdark' : ''"
  >
    <div
      class="text-[0.84rem] leading-[1.1rem] font-semibold truncate overflow-hidden"
      :class="active ? 'text-white' : ''"
    >
      {{ title }}
    </div>
    <div
      class="text-[0.7rem] leading-[0.9rem] truncate overflow-hidden"
      :class="active ? 'text-white' : ''"
    >
      {{ authors }}
    </div>
    <div
      class="text-[0.7rem] leading-[0.9rem] text-neutral-400 flex space-x-2"
      :class="active ? 'text-neutral-300' : ''"
    >
      <div>{{ year }}</div>
      <div>|</div>
      <div class="italic truncate overflow-hidden max-w-[80%]">
        {{ publication }}
      </div>
      <div v-if="flag">|</div>
      <div class="flex" v-if="flag">
        <BIconFlagFill class="m-auto text-xxs" />
      </div>
    </div>
  </div>
</template>
