<script setup lang="ts">
const props = defineProps({
  placeholder: {
    type: String,
    required: true,
  },
  options: {
    type: Object as () => Record<string, any>,
    required: true,
  },
  value: {
    required: true,
  },
});

const emit = defineEmits(["event:change"]);

const onChanged = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  emit("event:change", value);
};
</script>

<template>
  <div class="flex flex-col rounded-md py-1 bg-neutral-200 dark:bg-neutral-700">
    <label
      :for="placeholder"
      class="mx-3 text-xxs text-neutral-500 dark:text-neutral-400"
    >
      {{ placeholder }}
    </label>
    <select
      :value="value"
      class="text-xs dark:text-neutral-300 mx-2 focus:outline-none bg-transparent"
      @change="onChanged"
    >
      <option v-for="[key, value] of Object.entries(options)" :value="value">
        {{ key }}
      </option>
    </select>
  </div>
</template>
