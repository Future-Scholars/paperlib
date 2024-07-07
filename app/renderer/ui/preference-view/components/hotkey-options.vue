<script setup lang="ts">
import { ref, watch } from "vue";
import { BIconX } from "bootstrap-icons-vue";

import { formatShortcut } from "@/base/shortcut";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  choosedKey: {
    type: String,
    required: true,
  },
});

const emits = defineEmits(["event:change"]);

const curValue = ref(props.choosedKey || "");
const recordKeys = ref<string[]>([]);

const getRecordingValue = () => {
  return recordKeys.value
    .map((item) => {
      if (item.length === 1) {
        return item.toUpperCase();
      }
      return item;
    })
    .join("+");
};

const onKeydown = (event: KeyboardEvent) => {
  event.preventDefault();
  event.stopPropagation();
  recordKeys.value = formatShortcut(event);
  curValue.value = getRecordingValue();
  return false;
};

const onKeyup = (event: KeyboardEvent) => {
  if (recordKeys.value.length >= 1 && recordKeys.value.length <= 3) {
    emits("event:change", getRecordingValue());
  }
  event.preventDefault();
  event.stopPropagation();
  curValue.value = props.choosedKey;
  recordKeys.value = [];
  return false;
};

const onFocus = () => {
  PLMainAPI.menuService.disableGlobalShortcuts();
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("keyup", onKeyup);
};

const onBlur = () => {
  PLMainAPI.menuService.enableGlobalShortcuts();
  document.removeEventListener("keydown", onKeydown);
  document.removeEventListener("keyup", onKeyup);
};

const onInput = (event) => {
  if (event.target) {
    event.target.value = curValue.value;
  }
};

const onClearClicked = () => {
  emits("event:change", "");
};

watch(
  () => props.choosedKey,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      curValue.value = newValue;
    }
  }
);
</script>

<template>
  <div class="flex justify-between">
    <div class="flex flex-col my-auto">
      <div class="text-xs font-semibold">{{ title }}</div>
    </div>
    <div class="flex space-x-2 relative">
      <input
        :placeholder="$t('preference.hotkeysInputTip')"
        :spellcheck="false"
        class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none grow min-w-64 peer text-center font-mono focus:bg-neutral-300 focus:dark:bg-neutral-600"
        :value="curValue"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />
      <BIconX
        id="search-clear-btn"
        class="text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 hover:dark:text-neutral-300 cursor-pointer opacity-0 peer-focus:opacity-100 hover:opacity-100 group-hover:opacity-100 transition ease-in-out duration-75 absolute right-2 top-1/2 -translate-y-1/2"
        @click="onClearClicked"
      />
    </div>
  </div>
</template>
