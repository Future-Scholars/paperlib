<script setup lang="ts">
import { IPreferenceStore } from "@/services/preference-service";

import DbView from "./db-view.vue";
import LangView from "./lang-view.vue";
import ScraperView from "./scraper-view.vue";

const prefState = preferenceService.useState();

const hide = (key: keyof IPreferenceStore) => {
  preferenceService.set({ [key]: false });
};
</script>

<template>
  <div
    id="presetting-view"
    class="absolute w-full h-full top-0 left-0 flex bg-white dark:bg-neutral-800 z-50 overflow-auto dark:text-neutral-200"
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
</template>
