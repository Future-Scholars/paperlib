<script setup lang="ts">
import { onMounted, ref } from "vue";

import { Feed } from "@/models/feed";
import { disposable } from "@/base/dispose";

import InputBox from "./components/input-box.vue";

// ==============================
// State
// ==============================
const editingFeedDraft = ref<Feed>(new Feed());

// ==============================
// Event Handler
// ==============================
const onCloseClicked = () => {
  PLUIAPI.uiStateService.setUIState({ feedEditViewShown: false });
};

const onSaveClicked = async () => {
  PLAPI.feedService.create([new Feed(editingFeedDraft.value)]);
  onCloseClicked();
};

disposable(
  PLUIAPI.shortcutService.updateWorkingViewScope(
    PLUIAPI.shortcutService.viewScope.OVERLAY
  )
);

disposable(
  PLUIAPI.shortcutService.register(
    "Escape",
    onCloseClicked,
    true,
    true,
    PLUIAPI.shortcutService.viewScope.GLOBAL
  )
);

onMounted(() => {
  editingFeedDraft.value.initialize(new Feed());
});
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
          :value="editingFeedDraft.name"
          @event:change="(value) => (editingFeedDraft.name = value)"
        />
        <InputBox
          placeholder="Feed URL"
          :value="editingFeedDraft.url"
          @event:change="(value) => (editingFeedDraft.url = value)"
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
