<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  info: {
    type: String,
    required: true,
  },
  label: {
    type: String,
  },
});

const emits = defineEmits(["event:change"]);
</script>

<template>
  <div class="flex justify-between">
    <div class="flex flex-col max-w-[90%]">
      <div class="text-xs font-semibold">{{ title }}</div>
      <div class="text-xxs text-neutral-600 dark:text-neutral-500">
        {{ info }}
      </div>
    </div>
    <div>
      <slot></slot>
    </div>
    <div
      class="flex w-20 h-6 rounded-md bg-neutral-300 dark:bg-neutral-600 dark:text-neutral-300 hover:shadow-sm cursor-pointer"
      @click="emits('event:change')"
    >
      <span class="m-auto text-xs">{{ label || $t("menu.ok") }}</span>
    </div>
  </div>
</template>
