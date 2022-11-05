<script setup lang="ts">
import { MainRendererStateStore } from "@/state/renderer/appstate";

import DbView from "./db-view.vue";
import LangView from "./lang-view.vue";
import ScraperView from "./scraper-view.vue";

const prefState = MainRendererStateStore.usePreferenceState();

const hide = (key: string) => {
  window.appInteractor.setPreference(key, false);
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
      id="presetting-view"
      class="absolute w-full h-full top-0 left-0 flex bg-white dark:bg-neutral-800 z-50 overflow-auto dark:text-neutral-200"
      v-if="
        prefState.showPresettingLang ||
        prefState.showPresettingScraper ||
        prefState.showPresettingDB
      "
    >
      <LangView
        id="presetting-lang-view"
        v-if="prefState.showPresettingLang"
        @close="hide('showPresettingLang')"
      />
      <DbView
        id="presetting-db-view"
        v-if="!prefState.showPresettingLang && prefState.showPresettingDB"
        @close="hide('showPresettingDB')"
      />
      <ScraperView
        id="presetting-scraper-view"
        v-if="
          !prefState.showPresettingLang &&
          !prefState.showPresettingDB &&
          prefState.showPresettingScraper
        "
        @close="hide('showPresettingScraper')"
      />
    </div>
  </Transition>
</template>
