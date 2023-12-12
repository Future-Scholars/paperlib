<script setup lang="ts">
import { Feed } from "@/models/feed";

import InputBox from "./components/input-box.vue";

// ==============================
// State
// ==============================
const uiState = uiStateService.useState();

const onCloseClicked = () => {
  uiState.isFeedEditViewShown = false;
};

const onSaveClicked = async () => {
  feedService.create([new Feed(false).initialize(uiState.editingFeedDraft)]);
  onCloseClicked();
};

shortcutService.register("Escape", onCloseClicked);
shortcutService.registerInInputField("Escape", onCloseClicked);
</script>

<template>
  <div
    class="fixed top-0 right-0 left-0 z-50 w-screen h-screen bg-neutral-800 dark:bg-neutral-900 bg-opacity-50 dark:bg-opacity-80"
  >
    <div class="flex flex-col justify-center items-center w-full h-full">
      <div
        class="m-auto flex flex-col justify-between p-2 border-[1px] dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 w-[500px] rounded-lg shadow-lg select-none space-y-2"
      >
        <InputBox
          placeholder="Feed Name"
          :value="uiState.editingFeedDraft.name"
          @changed="(value) => (uiState.editingFeedDraft.name = value)"
        />
        <InputBox
          placeholder="Feed URL"
          :value="uiState.editingFeedDraft.url"
          @changed="(value) => (uiState.editingFeedDraft.url = value)"
        />
        <div class="flex justify-end space-x-2 py-1">
          <div
            class="flex w-20 h-6 rounded-md bg-neutral-300 dark:bg-neutral-500 dark:text-neutral-300 hover:shadow-sm"
            @click="onCloseClicked"
          >
            <span class="m-auto text-xs">{{ $t("menu.close") }}</span>
          </div>
          <div
            class="flex w-20 h-6 rounded-md bg-accentlight dark:bg-accentdark hover:shadow-sm"
            @click="onSaveClicked"
          >
            <span class="m-auto text-xs text-white">{{ $t("menu.save") }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
