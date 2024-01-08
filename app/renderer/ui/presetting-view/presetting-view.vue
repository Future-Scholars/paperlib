<script setup lang="ts">
import DbView from "./db-view.vue";
import ExtensionView from "./extension-view.vue";
import LangView from "./lang-view.vue";

const hide = () => {
  preferenceService.set({ showPresetting: false });
};
</script>

<template>
  <div
    id="presetting-view"
    class="absolute w-full h-full top-0 left-0 flex bg-white dark:bg-neutral-800 z-50 overflow-auto dark:text-neutral-200"
  >
    <div
      class="fixed top-0 right-0 left-0 z-40 w-screen h-screen bg-neutral-100 dark:bg-neutral-800"
    >
      <div class="flex h-full m-auto justify-center space-x-10 pt-20">
        <div class="flex flex-col justify-between pb-20">
          <div />
          <div class="flex justify-end">
            <div
              class="flex w-20 h-6 rounded-md bg-neutral-300 dark:bg-neutral-600 dark:text-neutral-300 hover:shadow-sm cursor-pointer"
              @click="hide()"
            >
              <span class="m-auto text-xs">{{
                $t("presetting.continue")
              }}</span>
            </div>
          </div>
        </div>

        <div class="overflow-scroll w-[600px] px-6">
          <div class="flex flex-col space-y-5 pb-20">
            <div class="font-bold text-2xl">
              {{ $t("presetting.presetting") }}
            </div>
            <LangView id="presetting-lang-view" />

            <div class="bg-neutral-200 dark:bg-neutral-700 h-[1px]" />

            <DbView id="presetting-db-view" />

            <div class="bg-neutral-200 dark:bg-neutral-700 h-[1px]" />

            <ExtensionView id="presetting-extension-view" />
          </div>

          <div
            class="fixed bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white dark:from-neutral-800 pointer-events-none"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
