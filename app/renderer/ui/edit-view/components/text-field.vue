<script setup lang="ts">
import {
  BIconArrowsAngleContract,
  BIconArrowsAngleExpand,
} from "bootstrap-icons-vue";
import { ref } from "vue";

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
  canExpand: {
    type: Boolean,
    required: true,
  },
});

const isExpanded = ref(props.isExpanded);
const emits = defineEmits(["event:change", "event:expand"]);

const onInput = (payload: Event) => {
  emits("event:change", (payload.target as HTMLTextAreaElement).value);
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
        v-if="isExpanded && canExpand"
        @click="
          () => {
            isExpanded = false;
            emits('event:expand', false);
          }
        "
      />
      <BIconArrowsAngleExpand
        class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 cursor-pointer"
        v-if="!isExpanded && canExpand"
        @click="
          () => {
            isExpanded = true;
            emits('event:expand', true);
          }
        "
      />
    </div>
    <textarea
      class="text-xs bg-transparent focus:outline-none resize-none dark:text-neutral-300 h-full"
      type="text"
      placeholder=" "
      :value="value"
      :name="placeholder"
      @input="onInput"
    />
  </div>
</template>
