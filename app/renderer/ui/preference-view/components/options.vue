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
  selected: {
    type: String,
    required: true,
  },
  options: {
    type: Object as () => Record<string, string>,
    required: true,
  },
});

const emit = defineEmits(["update"]);
</script>

<template>
  <div class="flex justify-between">
    <div class="flex flex-col">
      <div class="text-xs font-semibold">{{ title }}</div>
      <div
        class="text-xxs text-neutral-600 dark:text-neutral-500 max-w-[400px]"
      >
        {{ info }}
      </div>
    </div>
    <div
      class="flex bg-neutral-200 dark:bg-neutral-700 rounded-md h-8"
      :class="Object.entries(options).length < 4 ? 'w-40' : 'w-48'"
    >
      <div
        class="flex h-full w-full my-auto text-center text-xs rounded-md cursor-pointer"
        :class="
          selected === optionKey
            ? 'bg-neutral-500 text-neutral-100'
            : 'hover:bg-neutral-300 hover:dark:bg-neutral-600'
        "
        v-for="[optionKey, optionLabel] of Object.entries(options)"
        @click="emit('update', optionKey)"
      >
        <span class="m-auto">{{ optionLabel }}</span>
      </div>
    </div>
  </div>
</template>
