<script setup lang="ts">
const props = defineProps({
  title: String,
});
</script>

<template>
  <div class="flex px-2">
    <div class="my-auto text-xxs font-bold text-neutral-400 select-none">
      {{ title }}
    </div>
  </div>
</template>
