<script setup lang="ts">
const props = defineProps({
  title: String,
  authors: String,
  year: String,
  publication: String,
  active: Boolean,
});
</script>

<template>
  <div
    class="flex w-full h-7 py-1 px-2 space-x-4 text-xs rounded-md select-none cursor-pointer"
    :class="active ? 'bg-accentlight dark:bg-accentdark' : ''"
  >
    <div
      class="truncate overflow-hidden w-[47%] m-auto font-medium"
      :class="active ? 'text-white' : ''"
    >
      {{ title }}
    </div>
    <div
      class="truncate overflow-hidden w-[15%] m-auto"
      :class="active ? 'text-white' : ''"
    >
      {{ authors }}
    </div>
    <div
      class="truncate overflow-hidden w-[33%] m-auto italic"
      :class="active ? 'text-white' : ''"
    >
      {{ publication }}
    </div>
    <div class="w-[5%] m-auto" :class="active ? 'text-white' : ''">
      {{ year }}
    </div>
  </div>
</template>
