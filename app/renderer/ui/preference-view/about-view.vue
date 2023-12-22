<script setup lang="ts">
import { BIconCoin, BIconGithub, BIconGlobe } from "bootstrap-icons-vue";
import { onMounted, ref } from "vue";

import Toggle from "./components/toggle.vue";

const uiState = uiStateService.useState();

const version = ref("");

const onLinkClicked = (url: string) => {
  fileService.open(url);
};

const darkMode = ref(false);
onMounted(async () => {
  darkMode.value = await PLMainAPI.windowProcessManagementService.isDarkMode();
  version.value = await PLMainAPI.upgradeService.currentVersion();
});
</script>

<template>
  <div
    class="flex flex-col text-neutral-800 dark:text-neutral-300 w-[400px] md:w-[500px] lg:w-[700px]"
  >
    <img
      src="../../assets/logo-dark.png"
      class="w-8 mb-2 ml-1"
      v-if="darkMode"
    />
    <img src="../../assets/logo-light.png" class="w-8 mb-2 ml-1" v-else />
    <div class="text-base font-semibold mb-4">Paperlib</div>
    <div class="text-xs mb-4">
      created by Future Scholars, a simple academic paper management tool.
    </div>
    <div class="text-xs mb-4">Version {{ version }}</div>
    <div class="flex space-x-2">
      <div
        class="flex space-x-2 text-base mb-4 bg-neutral-200 dark:bg-neutral-600 w-20 justify-center p-2 rounded-md hover:bg-neutral-300 hover:dark:bg-neutral-500 cursor-pointer"
        @click="onLinkClicked('https://github.com/Future-Scholars/paperlib')"
      >
        <BIconGithub class="my-auto" />
        <span class="my-auto text-xs">Github</span>
      </div>
      <div
        class="flex space-x-2 text-base mb-4 bg-neutral-200 dark:bg-neutral-600 w-30 justify-center p-2 rounded-md hover:bg-neutral-300 hover:dark:bg-neutral-500 cursor-pointer"
        @click="onLinkClicked('https://paperlib.app/en/')"
      >
        <BIconGlobe class="my-auto" />
        <span class="my-auto text-xs">Home Page</span>
      </div>
      <div
        class="flex space-x-2 text-base mb-4 bg-neutral-200 dark:bg-neutral-600 w-30 justify-center p-2 rounded-md hover:bg-neutral-300 hover:dark:bg-neutral-500 cursor-pointer"
        @click="onLinkClicked('https://paperlib.app/en/#donate')"
      >
        <BIconCoin class="my-auto" />
        <span class="my-auto text-xs">Donate</span>
      </div>
    </div>

    <Toggle
      class="mb-5"
      title="Turn on the Development Mode"
      info="This is for developers only."
      :enable="uiState.isDevMode"
      @update="(value) => (uiState.isDevMode = value)"
    />
  </div>
</template>
