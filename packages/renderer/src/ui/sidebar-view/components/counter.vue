<script setup lang="ts">
const props = defineProps({
  value: Number,
});
</script>

<template>
  <div
    class="px-1 min-w-[1.25rem] text-xxxs bg-neutral-400 opacity-70 rounded-lg text-center"
  >
    <span class="text-neutral-900 select-none"> {{ value }} </span>
  </div>
</template>
