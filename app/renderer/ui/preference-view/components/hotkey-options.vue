<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { BIconX } from "bootstrap-icons-vue";

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

const recordingValue = computed(() => {
  return recordKeys.value
    .map((item) => {
      if (item.length === 1) {
        return item.toUpperCase();
      }
      return item;
    })
    .join("+");
});

const onKeydown = (event: KeyboardEvent) => {
  if (!recordKeys.value.includes(event.key)) {
    recordKeys.value.push(event.key);
    curValue.value = recordingValue.value;
  }
};

const onKeyup = () => {
  if (recordKeys.value.length === 3) {
    curValue.value = recordingValue.value;
    emits("event:change", recordingValue.value);
  } else {
    curValue.value = props.choosedKey;
  }
  recordKeys.value = [];
};

const onFocus = () => {
  PLMainAPI.menuService.disableAll();
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("keyup", onKeyup);
};

const onBlur = () => {
  PLMainAPI.menuService.enableAll();
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

watch(props, (newProps, oldProps) => {
  if (newProps.choosedKey !== oldProps.choosedKey) {
    curValue.value = newProps.choosedKey;
  }
});
</script>

<template>
  <div class="flex justify-between">
    <div class="flex flex-col my-auto">
      <div class="text-xs font-semibold">{{ title }}</div>
    </div>
    <div class="flex space-x-2 relative">
      <input
        :spellcheck="false"
        class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none grow min-w-64 peer"
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
