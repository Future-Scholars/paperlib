<script setup lang="ts">
import { ref } from "vue";

import { MainRendererStateStore } from "@/state/renderer/appstate";

const props = defineProps({
  placeholder: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: false,
  },
});
const emit = defineEmits(["changed"]);

const value = ref(props.value);
const viewState = MainRendererStateStore.useViewState();

const onInput = (payload: Event) => {
  emit("changed", value.value);
};
</script>

<template>
  <div
    class="flex flex-col rounded-md px-3 py-1 bg-neutral-200 dark:bg-neutral-700"
  >
    <label
      :for="placeholder"
      class="text-xxs text-neutral-500 dark:text-neutral-400"
    >
      {{ placeholder }}
    </label>
    <input
      class="text-xs bg-transparent focus:outline-none dark:text-neutral-300"
      type="text"
      placeholder=" "
      v-model="value"
      :name="placeholder"
      @input="onInput"
      @focus="viewState.inputFieldFocused = true"
      @blur="viewState.inputFieldFocused = false"
    />
  </div>
</template>
