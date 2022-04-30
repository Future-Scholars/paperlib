<script setup lang="ts">
const props = defineProps({
  name: String,
  active: Boolean,
});
</script>

<template>
  <div
    class="w-full h-7 flex justify-end space-x-2 rounded-md px-2 cursor-pointer"
    :class="active ? 'bg-neutral-400 bg-opacity-30' : 'text-neutral-500'"
  >
    <span class="my-auto text-xs select-none">
      {{ name }}
    </span>
    <slot></slot>
  </div>
</template>
