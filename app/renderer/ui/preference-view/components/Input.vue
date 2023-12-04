<script setup lang="ts">
import { Switch } from "@headlessui/vue";
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
  value: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: false,
    default: "password",
  },
  placeholder: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update"]);

const value = ref(props.value);
</script>

<template>
  <div class="flex flex-col space-y-1">
    <div class="flex flex-col">
      <div class="text-xs font-semibold">{{ title }}</div>
      <div class="text-xxs text-neutral-600 dark:text-neutral-500">
        {{ info }}
      </div>
    </div>
    <input
      class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none grow"
      :type="type"
      :placeholder="placeholder"
      v-model="value"
      @input="emit('update', value)"
    />
  </div>
</template>
