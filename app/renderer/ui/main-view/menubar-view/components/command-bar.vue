<script setup lang="ts">
import { BIconChevronRight, BIconSearch, BIconX } from "bootstrap-icons-vue";
import { Ref, computed, ref } from "vue";

import { disposable } from "@/base/dispose";
import { debounce } from "@/base/misc";
import { ICommand } from "@/renderer/services/command-service";
import { PaperFilterOptions } from "@/renderer/services/paper-service";
import { ShortcutEvent } from "@/common/utils.ts";

// ================================
// State
// ================================
const uiState = uiStateService.useState();

// ================================
// Data
// ================================
const commandText = ref("");
const commandInput = ref<HTMLInputElement | null>(null);

const onSearchTextChanged = debounce(() => {
  uiState.commandBarText = `${commandText.value}`;

  const filterOptions = new PaperFilterOptions({
    search: commandText.value,
    searchMode: uiState.commandBarSearchMode,
  });

  uiState.querySentenceCommandbar = filterOptions.toString();
}, 300);

disposable(
  uiStateService.onChanged("commandBarText", (newVal) => {
    commandText.value = newVal.value;
  })
);

const onInput = (payload: Event) => {
  if (
    !isCommand.value &&
    uiState.commandBarSearchMode !== "fulltext" &&
    uiState.commandBarSearchMode !== "advanced"
  ) {
    onSearchTextChanged();
  }
};

const onInputPressEnter = (payload: Event) => {
  if (!isCommand.value) {
    onSearchTextChanged();
  }
};

const isCommand = computed(() => {
  return commandText.value.startsWith(`\\`);
});

const commandsBuffer = ref<ICommand[]>([]);
const commands = computed(() => {
  if (!isCommand.value) {
    return [];
  }
  if (!isSelectingCommand.value) {
    commandsBuffer.value = commandService.getRegisteredCommands(
      commandText.value.split(" ")[0].substring(1).trim()
    );
    return commandsBuffer.value;
  } else {
    return commandsBuffer.value;
  }
});

const selectedCommandIndex = ref(-1);

const onClearClicked = (payload: Event) => {
  commandText.value = "";
  uiState.commandBarSearchMode = "general";
  onSearchTextChanged();
};

let arrowDownDisposeHandler: () => void;
let arrowUpDisposeHandler: () => void;
let enterDisposeHandler: () => void;
let escapeDisposeHandler: () => void;
let backDisposeHandler: () => void;

const isFocused = ref(false);
const isMouseOver = ref(false);
const isSelectingCommand = ref(false);

const onRunCommand = () => {
  if (isCommandPanelShown.value) {
    const commandComponents = commandText.value.split(" ").filter((x) => x);
    const commandStr = commandComponents[0].trim();
    const commandID = commandStr.substring(1).trim();
    const commandArgs = commandText.value
      .replace(commandComponents[0], "")
      .trimStart();

    if (commandStr === "\\") {
      commandText.value = "";
      return;
    }

    commandService.run(commandID, commandArgs);

    if (["search", "search_fulltext", "search_advanced"].includes(commandID)) {
      commandText.value = commandArgs;
      onSearchTextChanged();
    } else {
      commandInput.value?.blur();
      commandText.value = "";
    }
    selectedCommandIndex.value = -1;
  }
};

const onSelectCommand = (index: number) => {
  isSelectingCommand.value = true;
  if (isCommandPanelShown.value) {
    selectedCommandIndex.value = index;

    commandText.value = `\\${commands.value[selectedCommandIndex.value].id} `;
  }
  commandInput.value?.focus();
};

const onKeydown = (payload: KeyboardEvent) => {
  if (
    payload.key !== "ArrowDown" &&
    payload.key !== "ArrowUp" &&
    payload.key !== "Enter"
  ) {
    isSelectingCommand.value = false;
  }
  if (payload.key === "Enter") {
    onInputPressEnter(payload);
  }
};

const onFocus = async (payload: Event) => {
  arrowDownDisposeHandler = shortcutService.register(
    "ArrowDown",
    () => {
      isSelectingCommand.value = true;
      if (isCommandPanelShown.value) {
        selectedCommandIndex.value =
          (selectedCommandIndex.value + 1) % commands.value.length;

        fixScrolling(selectedCommandIndex.value);

        commandText.value = `\\${
          commands.value[selectedCommandIndex.value].id
        } `;
      }
    },
    true,
    true,
    shortcutService.viewScope.INPUT
  );

  arrowUpDisposeHandler = shortcutService.register(
    "ArrowUp",
    () => {
      isSelectingCommand.value = true;
      if (isCommandPanelShown.value) {
        if (selectedCommandIndex.value < 0) {
          selectedCommandIndex.value = commands.value.length - 1;
        } else {
          selectedCommandIndex.value =
            (selectedCommandIndex.value - 1 + commands.value.length) %
            commands.value.length;
        }

        fixScrolling(selectedCommandIndex.value);

        commandText.value = `\\${
          commands.value[selectedCommandIndex.value].id
        } `;
      }
    },
    true,
    true,
    shortcutService.viewScope.INPUT
  );

  enterDisposeHandler = shortcutService.register(
    "Enter",
    () => {
      onRunCommand();
    },
    true,
    true,
    shortcutService.viewScope.INPUT
  );

  escapeDisposeHandler = shortcutService.register(
    "Escape",
    (e: ShortcutEvent) => {
      if (e.isInput && e.target) {
        (e.target as HTMLInputElement | HTMLTextAreaElement).blur();
      }
      uiState.commandBarText = "";
      uiState.commandBarSearchMode = "general";
      uiState.querySentenceCommandbar = "";
    },
    true,
    true,
    shortcutService.viewScope.INPUT
  );

  backDisposeHandler = shortcutService.register(
    "Backspace",
    () => {
      if (commandText.value === "") {
        uiState.commandBarText = "";
        uiState.commandBarSearchMode = "general";
        uiState.querySentenceCommandbar = "";
      }
    },
    false,
    true,
    shortcutService.viewScope.INPUT
  );

  isFocused.value = true;
};

const onBlur = async (payload: Event) => {
  arrowDownDisposeHandler?.();
  arrowUpDisposeHandler?.();
  enterDisposeHandler?.();
  escapeDisposeHandler?.();
  backDisposeHandler?.();

  if (isMouseOver.value) {
    return;
  }

  isFocused.value = false;
  isSelectingCommand.value = false;
};

const isCommandPanelShown = computed(() => {
  return isFocused.value && isCommand.value && commands.value.length > 0;
});

const suggestionView: Ref<HTMLElement | null> = ref(null);
const fixScrolling = (index: number) => {
  const currentElement = suggestionView.value?.querySelector(
    `#command-item-${index}`
  ) as HTMLElement;
  currentElement.scrollIntoView({
    behavior: "smooth",
    block: "end",
  });
};

disposable(
  shortcutService.updateWorkingViewScope(shortcutService.viewScope.MAIN)
);

disposable(
  shortcutService.register("\\", () => {
    commandText.value = `\\`;
    commandInput.value?.focus();
  })
);
</script>

<template>
  <div
    class="flex h-8 transition ease-in-out duration-75 w-full rounded-tl-md rounded-tr-md justify-between focus-within:bg-neutral-100 focus-within:dark:bg-neutral-700 hover:bg-neutral-100 hover:dark:bg-neutral-700 group relative"
    :class="
      isCommandPanelShown
        ? 'shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset]'
        : 'rounded-bl-md rounded-br-md'
    "
    @mouseenter="isMouseOver = true"
    @mouseleave="isMouseOver = false"
  >
    <BIconSearch
      class="flex-none my-auto inline-block text-xs mx-2"
      v-if="!isCommand"
    />
    <BIconChevronRight class="my-auto ml-1 mr-1 text-xs" v-else />
    <div
      class="text-xxs my-auto mr-2 px-1 border-[1px] border-neutral-300 rounded"
      v-if="!isCommand && uiState.commandBarSearchMode === 'fulltext'"
    >
      FullText
    </div>
    <div
      class="text-xxs my-auto mr-2 px-1 border-[1px] border-neutral-300 rounded"
      v-if="!isCommand && uiState.commandBarSearchMode === 'advanced'"
    >
      Advanced
    </div>

    <input
      class="grow py-2 my-auto nodraggable-item text-xs bg-transparent focus:outline-none peer"
      ref="commandInput"
      type="text"
      :placeholder="`${$t('mainview.commandBarPlaceholder')}...`"
      v-model="commandText"
      @input="onInput"
      @blur="onBlur"
      @focus="onFocus"
      @keydown="onKeydown"
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
        class="w-full max-h-64 bg-neutral-100 dark:bg-neutral-700 absolute left-0 top-8 z-50 rounded-bl-md rounded-br-md p-1 border-b-[1px] border-l-[1px] border-r-[1px] shadow-md dark:border-neutral-700 overflow-auto"
        v-show="isCommandPanelShown"
        ref="suggestionView"
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
            class="flex space-x-4 h-7 rounded-md px-2 justify-between"
            :id="`command-item-${index}`"
            :class="
              selectedCommandIndex === index
                ? 'bg-neutral-200 dark:bg-neutral-800'
                : ''
            "
            @click="() => onSelectCommand(index)"
          >
            <div class="text-xs font-semibold my-auto truncate">
              \{{ item.id }}
            </div>
            <div class="text-xs my-auto text-neutral-500 truncate">
              {{ item.description }}
            </div>
          </div>
        </RecycleScroller>
      </div>
    </Transition>
  </div>
</template>
