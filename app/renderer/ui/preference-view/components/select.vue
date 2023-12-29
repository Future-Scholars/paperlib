<script setup lang="ts">
import { ref } from "vue";

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

const selected = ref(props.selected);

const emits = defineEmits(["event:change"]);
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
    <div class="flex rounded-md h-6 my-auto">
      <select
        class="bg-gray-50 border text-xxs border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-28 h-6 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        v-model="selected"
        @change="
          (e) => {
            // @ts-ignore
            emits('event:change', e.target.value as string);
          }
        "
      >
        <option
          v-for="[optionKey, optionLabel] of Object.entries(options)"
          :value="optionKey"
        >
          {{ optionLabel }}
        </option>
      </select>
    </div>
  </div>
</template>
