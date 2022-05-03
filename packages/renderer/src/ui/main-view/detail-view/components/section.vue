<script setup lang="ts">
const props = defineProps({
  title: String,
});
</script>

<template>
  <div class="pt-3">
    <div class="text-xxs text-neutral-400 dark:text-neutral-500 select-none">
      {{ title }}
    </div>
    <slot></slot>
  </div>
</template>
