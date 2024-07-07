<script setup lang="ts">
import { BIconX } from "bootstrap-icons-vue";
import { onUnmounted } from "vue";
import { ref, computed, Ref } from "vue";

const props = defineProps({
  modelValue: {
    type: Array as () => string[],
    required: true,
  },
  options: {
    type: Array as () => string[],
    required: false,
    default: () => [],
  },
  placeholder: {
    type: String,
    required: true,
  },
  invalidValues: {
    type: Array as () => string[],
    required: false,
    default: () => [],
  },
});

const emits = defineEmits(["event:add", "event:delete", "event:change"]);

const isFocused = ref(false);
const isMouseOver = ref(false);
const inputValue = ref("");
const box = ref<HTMLElement | null>(null);
const dropdown = ref<HTMLElement | null>(null);
const boxHeight = computed(() => {
  if (box.value) {
    return box.value.clientHeight;
  }
  return 0;
});
const boxWidth = computed(() => {
  if (box.value) {
    return box.value.clientWidth;
  }
  return 0;
});
const selectedIndex = ref(-1);
const filteredOptions: Ref<string[]> = ref([]);

const onInput = () => {
  if (inputValue.value === "") {
    filteredOptions.value = props.options;
  } else {
    const filtered = props.options.filter((option) =>
      option.toLowerCase().includes(inputValue.value.toLowerCase())
    );

    filteredOptions.value = filtered;
  }

  if (filteredOptions.value.length > 0) {
    selectedIndex.value = -1;
  } else {
    selectedIndex.value = -1;
  }
};

const fixScrolling = () => {
  const currentElement = dropdown.value?.children[
    selectedIndex.value
  ] as HTMLElement;
  currentElement.scrollIntoView({
    behavior: "smooth",
    block: "end",
  });
};

const add = () => {
  if (
    inputValue.value === "" ||
    props.modelValue.includes(inputValue.value) ||
    props.invalidValues.includes(inputValue.value)
  ) {
    inputValue.value = "";
    return;
  }

  emits("event:add", inputValue.value);
  emits("event:change", [...props.modelValue, inputValue.value]);

  inputValue.value = "";
  selectedIndex.value = -1;
};

const remove = (value: string) => {
  emits("event:delete", value);
  emits(
    "event:change",
    props.modelValue.filter((v) => v !== value)
  );
};

const disposeCallbacks: (() => void)[] = [];

const registerShortcut = () => {
  isFocused.value = true;
  onInput();

  disposeCallbacks.push(
    shortcutService.register(
      "Enter",
      () => {
        if (selectedIndex.value >= 0) {
          inputValue.value = filteredOptions.value[selectedIndex.value];
          add();
        } else if (inputValue.value !== "" && selectedIndex.value === -1) {
          add();
        }
      },
      true,
      true,
      shortcutService.viewScope.INPUT
    )
  );
  disposeCallbacks.push(
    shortcutService.register(
      "ArrowUp",
      () => {
        if (selectedIndex.value > 0) {
          selectedIndex.value -= 1;
        } else if (selectedIndex.value === 0) {
          selectedIndex.value = filteredOptions.value.length - 1;
        } else {
          selectedIndex.value = -1;
        }
        fixScrolling();
      },
      true,
      true,
      shortcutService.viewScope.INPUT
    )
  );
  disposeCallbacks.push(
    shortcutService.register(
      "ArrowDown",
      () => {
        if (selectedIndex.value < filteredOptions.value.length - 1) {
          selectedIndex.value += 1;
        } else if (selectedIndex.value === filteredOptions.value.length - 1) {
          selectedIndex.value = 0;
        } else {
          selectedIndex.value = -1;
        }
        fixScrolling();
      },
      true,
      true,
      shortcutService.viewScope.INPUT
    )
  );
};

const disposeShortcut = () => {
  isFocused.value = false;
  disposeCallbacks.forEach((callback) => callback());
  disposeCallbacks.length = 0;
};

onUnmounted(() => {
  disposeShortcut();
});
</script>

<template>
  <div
    ref="box"
    class="flex flex-col rounded-md py-1 bg-neutral-200 dark:bg-neutral-700 min-h-10"
  >
    <label
      :for="placeholder"
      class="mx-3 text-xxs text-neutral-500 dark:text-neutral-400"
    >
      {{ placeholder }}
    </label>
    <div class="px-2 flex flex-wrap space-y-1">
      <div
        v-for="value in modelValue"
        class="text-xxs bg-neutral-300 dark:bg-neutral-800 pl-1 py-0.5 rounded flex my-auto mr-1 mt-1"
      >
        <span class="my-auto">{{ value }} </span>
        <BIconX class="text-sm my-auto cursor-pointer" @click="remove(value)" />
      </div>
      <input
        class="border-none nodraggable-item text-xxs focus:outline-none grow h-5 py-1 bg-transparent px-1"
        placeholder="Type and press Enter to add"
        v-model="inputValue"
        @input="onInput"
        @focus="registerShortcut"
        @blur="disposeShortcut"
      />
    </div>
    <div
      class="bg-neutral-300 dark:bg-neutral-700 fixed max-h-24 rounded-md shadow-md flex flex-col p-1 overflow-y-scroll"
      :style="`width: ${boxWidth}px; margin-top: ${boxHeight + 2}px`"
      v-if="filteredOptions.length > 0 && (isFocused || isMouseOver)"
      ref="dropdown"
    >
      <div
        v-for="(option, index) in filteredOptions"
        class="text-xs px-2 rounded min-h-5 flex"
        :class="
          selectedIndex === index
            ? 'bg-accentlight dark:bg-accentdark text-neutral-100'
            : ''
        "
        @click="
          inputValue = option;
          add();
        "
        @mouseenter="
          selectedIndex = index;
          isMouseOver = true;
        "
        @mouseleave="
          selectedIndex = -1;
          isMouseOver = false;
        "
      >
        <span class="my-auto">{{ option }} </span>
      </div>
    </div>
  </div>
</template>
