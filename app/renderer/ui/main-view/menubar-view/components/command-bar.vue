<script setup lang="ts">
import {
  BIconQuestionCircle,
  BIconSearch,
  BIconX,
  BIconChevronRight,
} from "bootstrap-icons-vue";
import { computed, ref, watch } from "vue";

import { debounce } from "@/base/misc";
import { MainRendererStateStore } from "@/state/renderer/appstate";

// ================================
// State
// ================================
const viewState = MainRendererStateStore.useViewState();

// ================================
// Data
// ================================
const commandText = ref("");

const onSearchTextChanged = debounce(() => {
  viewState.searchText = `${commandText.value}`;
}, 300);

watch(
  () => viewState.searchText,
  (newVal) => {
    commandText.value = newVal;
  }
);

const onInput = (payload: Event) => {
  if (!isCommand.value) {
    onSearchTextChanged();
  }
};

const isCommand = computed(() => {
  return commandText.value.startsWith(`\\`);
});

const commands = computed(() => {
  if (!isCommand.value) {
    return [];
  }
  return commandService.getRegisteredCommands(
    commandText.value.split(" ")[0].substring(1).trim()
  );
});

const selectedCommandIndex = ref(0);

const onClearClicked = (payload: Event) => {
  commandText.value = "";
  onSearchTextChanged();
};

let arrowDownDisposeHandler: () => void;
let arrowUpDisposeHandler: () => void;
let enterDisposeHandler: () => void;

const isFocused = ref(false);

const onFocus = (payload: Event) => {
  arrowDownDisposeHandler = shortcutService.register("ArrowDown", () => {
    if (isCommandPanelShown.value) {
      selectedCommandIndex.value =
        (selectedCommandIndex.value + 1) % commands.value.length;
    }
  });

  arrowUpDisposeHandler = shortcutService.register("ArrowUp", () => {
    if (isCommandPanelShown.value) {
      selectedCommandIndex.value =
        (selectedCommandIndex.value - 1 + commands.value.length) %
        commands.value.length;
    }
  });

  enterDisposeHandler = shortcutService.register("Enter", (e: Event) => {
    if (isCommandPanelShown.value) {
      const commandComponents = commandText.value.split(" ").filter((x) => x);
      const commandArgs = commandText.value
        .replace(commandComponents[0], "")
        .trimStart();

      if (commands.value[selectedCommandIndex.value].handler.length === 0) {
        commands.value[selectedCommandIndex.value].handler();
        //@ts-ignore
        e.target?.blur();
      } else {
        if (commandArgs) {
          commands.value[selectedCommandIndex.value].handler(commandArgs);
          //@ts-ignore
          e.target?.blur();
        } else {
          commandText.value = `\\${
            commands.value[selectedCommandIndex.value].id
          } `;
        }
      }
    }
  });

  isFocused.value = true;
};

const onBlur = (payload: Event) => {
  arrowDownDisposeHandler?.();
  arrowUpDisposeHandler?.();
  enterDisposeHandler?.();
  isFocused.value = false;
};

const isCommandPanelShown = computed(() => {
  return isFocused.value && isCommand.value && commands.value.length > 0;
});
</script>

<template>
  <div
    class="flex h-8 transition ease-in-out duration-75 w-full rounded-tl-md rounded-tr-md justify-between focus-within:bg-neutral-100 focus-within:dark:bg-neutral-700 hover:bg-neutral-100 hover:dark:bg-neutral-700 group relative"
    :class="
      isCommandPanelShown
        ? 'shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset]'
        : 'rounded-bl-md rounded-br-md'
    "
  >
    <BIconSearch
      class="flex-none my-auto inline-block text-xs mx-2"
      v-if="!isCommand"
    />
    <BIconChevronRight class="my-auto ml-1 mr-1 text-xs" v-else />

    <input
      class="grow py-2 my-auto nodraggable-item text-xs bg-transparent focus:outline-none peer"
      type="text"
      :placeholder="`${$t('mainview.commandBarPlaceholder')}...`"
      v-model="commandText"
      @input="onInput"
      @blur="onBlur"
      @focus="onFocus"
    />
    <BIconX
      id="search-clear-btn"
      class="my-auto mx-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 hover:dark:text-neutral-300 cursor-pointer opacity-0 peer-focus:opacity-100 hover:opacity-100 group-hover:opacity-100 transition ease-in-out duration-75"
      @click="onClearClicked"
    />
    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <div
        class="w-full max-h-64 bg-neutral-100 absolute left-0 top-8 z-50 rounded-bl-md rounded-br-md p-2 border-b-[1px] border-l-[1px] border-r-[1px]"
        v-show="isCommandPanelShown"
      >
        <RecycleScroller
          id="command-list-scroll"
          class="scroller h-full"
          :items="commands"
          :item-size="30"
          key-field="id"
          v-slot="{ item, index }"
          :buffer="500"
        >
          <div
            class="flex space-x-4 h-7 rounded-md px-2"
            :class="
              selectedCommandIndex === index
                ? 'bg-neutral-200 dark:bg-neutral-700'
                : ''
            "
          >
            <div class="text-xs font-semibold my-auto px-1 py-[1px] rounded-sm">
              \{{ item.id }}
            </div>
            <div class="text-xs my-auto text-neutral-500">
              {{ item.description }}
            </div>
          </div>
        </RecycleScroller>
      </div>
    </Transition>
  </div>
</template>
@/base/misc
