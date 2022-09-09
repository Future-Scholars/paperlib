<script setup lang="ts">
import { BIconCoin, BIconGithub, BIconGlobe } from "bootstrap-icons-vue";
import { ref } from "vue";

const version = ref("");
window.appInteractor.version().then((v) => {
  version.value = v;
});

const onLinkClicked = (url: string) => {
  window.appInteractor.open(url);
};
</script>

<template>
  <div class="flex flex-col w-full text-neutral-800 dark:text-neutral-300">
    <img src="../../assets/icon.png" class="w-14 mb-2" />
    <div class="text-base font-semibold mb-4">Paperlib</div>
    <div class="text-xs mb-4">
      created by Geo, a simple academic paper management tool.
    </div>
    <div class="text-xs mb-4">Version {{ version }}</div>
    <div class="flex space-x-2">
      <div
        class="flex space-x-2 text-base mb-4 bg-neutral-200 dark:bg-neutral-600 w-20 justify-center p-2 rounded-md hover:bg-neutral-300 hover:dark:bg-neutral-500 cursor-pointer"
        @click="onLinkClicked('https://github.com/GeoffreyChen777/paperlib')"
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
  </div>
</template>
