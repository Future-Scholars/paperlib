<script setup lang="ts">
import {
  BIconArrowsAngleContract,
  BIconArrowsAngleExpand,
} from "bootstrap-icons-vue";
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
  isExpanded: {
    type: Boolean,
    required: false,
  },
});

const viewState = MainRendererStateStore.useViewState();

const isExpanded = ref(props.isExpanded);
const emit = defineEmits(["changed", "expand"]);

const value = ref(props.value);

const onInput = (payload: Event) => {
  emit("changed", value.value);
};
</script>

<template>
  <div
    class="flex flex-col rounded-md px-3 py-1 bg-neutral-200 dark:bg-neutral-700"
  >
    <div class="flex justify-between">
      <label
        :for="placeholder"
        class="text-xxs text-neutral-500 dark:text-neutral-400"
      >
        {{ placeholder }}
      </label>
      <BIconArrowsAngleContract
        class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 cursor-pointer"
        v-if="isExpanded"
        @click="
          () => {
            isExpanded = false;
            emit('expand', false);
          }
        "
      />
      <BIconArrowsAngleExpand
        class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 cursor-pointer"
        v-if="!isExpanded"
        @click="
          () => {
            isExpanded = true;
            emit('expand', true);
          }
        "
      />
    </div>
    <textarea
      class="text-xs bg-transparent focus:outline-none resize-none dark:text-neutral-300 h-full"
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
