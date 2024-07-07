<script setup lang="ts">
import { ref } from "vue";
import DbView from "./db-view.vue";
import ExtensionView from "./extension-view.vue";
import LangView from "./lang-view.vue";

const hidable = ref(true);
const checkHidable = async () => {
  const installedExtensions =
    await PLExtAPI.extensionManagementService.installedExtensions();
  const hidable_ =
    installedExtensions["@future-scholars/paperlib-entry-scrape-extension"] !==
      undefined &&
    installedExtensions[
      "@future-scholars/paperlib-metadata-scrape-extension"
    ] !== undefined;

  hidable.value = hidable_;
  return hidable_;
};

const hide = async () => {
  const hidable = await checkHidable();
  if (!hidable) {
    return;
  }

  preferenceService.set({ showPresetting: false });
};
</script>

<template>
  <div
    id="presetting-view"
    class="fixed top-0 right-0 left-0 z-40 w-screen h-screen bg-neutral-100 dark:bg-neutral-800 overflow-scroll"
  >
    <div class="w-[600px] px-6 mx-auto py-20">
      <div class="flex flex-col space-y-5 mb-8">
        <div class="font-bold text-2xl">
          {{ $t("presetting.presetting") }}
        </div>
        <LangView id="presetting-lang-view" />

        <div class="bg-neutral-200 dark:bg-neutral-700 h-[1px]" />

        <DbView id="presetting-db-view" />

        <div class="bg-neutral-200 dark:bg-neutral-700 h-[1px]" />

        <ExtensionView id="presetting-extension-view" />
      </div>
      <span class="m-auto text-red-500" v-if="!hidable">⚠️ {{ $t("presetting.extensionscraperrequired") }}</span>
      <div
        id="whats-new-close-btn"
        class="mt-10 mx-auto flex w-60 h-10 bg-accentlight dark:bg-accentdark text-neutral-50 rounded-md shadow-md cursor-pointer"
        @click="hide"
      >
        <span class="m-auto">{{ $t("presetting.continue") }}</span>
      </div>
    </div>

    <div
      class="fixed bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white dark:from-neutral-800 pointer-events-none"
    ></div>
  </div>
</template>
