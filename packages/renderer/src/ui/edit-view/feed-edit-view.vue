<script setup lang="ts">
import { ref } from "vue";

import InputBox from "./components/input-box.vue";
import { FeedDraft } from "../../../../preload/models/FeedDraft";
import { Feed } from "../../../../preload/models/Feed";

const isFeedEditViewShown = ref(false);
const feedDraft = ref(new FeedDraft());

const keyDownListener = (e: KeyboardEvent) => {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement
  ) {
    if (e.key === "Escape") {
      onCloseClicked();
    }
    return true;
  }
  e.preventDefault();
  if (e.key === "Escape") {
    onCloseClicked();
  }
};

window.appInteractor.registerState("viewState.isFeedEditViewShown", (value) => {
  isFeedEditViewShown.value = value as boolean;
  if (isFeedEditViewShown) {
    window.addEventListener("keydown", keyDownListener, { once: true });
  }
});

window.appInteractor.registerState("sharedData.editFeedDraft", (value) => {
  feedDraft.value.initialize(JSON.parse(value as string) as Feed);
});

const onCloseClicked = () => {
  window.appInteractor.setState("viewState.isFeedEditViewShown", false);
};

const onSaveClicked = async () => {
  window.feedInteractor.update(JSON.stringify([feedDraft.value]));
  window.appInteractor.setState("viewState.isFeedEditViewShown", false);
};
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-75"
    enter-from-class="transform opacity-0"
    enter-to-class="transform opacity-100"
    leave-active-class="transition ease-in duration-75"
    leave-from-class="transform opacity-100"
    leave-to-class="transform opacity-0"
  >
    <div
      class="fixed top-0 right-0 left-0 z-50 w-screen h-screen bg-neutral-800 dark:bg-neutral-900 bg-opacity-50 dark:bg-opacity-80"
      v-if="isFeedEditViewShown"
    >
      <div class="flex flex-col justify-center items-center w-full h-full">
        <div
          class="m-auto flex flex-col justify-between p-2 border-[1px] dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 w-[500px] rounded-lg shadow-lg select-none space-y-2"
        >
          <InputBox
            placeholder="Feed Name"
            :value="feedDraft.name"
            @changed="(value) => (feedDraft.name = value)"
          />
          <InputBox
            placeholder="Feed URL"
            :value="feedDraft.url"
            @changed="(value) => (feedDraft.url = value)"
          />
          <div class="flex justify-end space-x-2">
            <div
              class="flex w-24 h-8 rounded-lg bg-neutral-300 dark:bg-neutral-500 dark:text-neutral-300 hover:shadow-sm"
              @click="onCloseClicked"
            >
              <span class="m-auto text-xs">Cancel</span>
            </div>
            <div
              class="flex w-24 h-8 rounded-lg bg-accentlight dark:bg-accentdark hover:shadow-sm"
              @click="onSaveClicked"
            >
              <span class="m-auto text-xs text-white">Save</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
