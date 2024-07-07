<script setup lang="ts">
import {
  BIconCoin,
  BIconDiscord,
  BIconGithub,
  BIconGlobe,
} from "bootstrap-icons-vue";

defineProps({
  darkMode: Boolean,
});

const openURL = (url: string) => {
  fileService.open(url);
};
</script>

<template>
  <div class="flex flex-col">
    <img
      class="w-12 mx-auto mb-2"
      src="../../assets/logo-dark.png"
      v-if="darkMode"
    />
    <img class="w-10 mx-auto mb-2" src="../../assets/logo-light.png" v-else />

    <div class="mx-auto text-xl font-semibold mb-4">PAPERLIB</div>

    <div class="flex mx-auto space-x-5">
      <div
        class="flex flex-col space-y-1 hover:text-neutral-500 cursor-pointer"
        @click="openURL('https://github.com/Future-Scholars/paperlib')"
      >
        <BIconGithub class="mx-auto" />
        <span class="mx-auto text-xs">Github</span>
      </div>
      <div
        class="flex flex-col space-y-1 hover:text-neutral-500 cursor-pointer"
        @click="openURL('https://discord.gg/4unrSRjcM9')"
      >
        <BIconDiscord class="mx-auto" />
        <span class="mx-auto text-xs">Discord</span>
      </div>
      <div
        class="flex flex-col space-y-1 hover:text-neutral-500 cursor-pointer"
        @click="openURL('https://paperlib.app')"
      >
        <BIconGlobe class="mx-auto" />
        <span class="mx-auto text-xs">Webpage</span>
      </div>
      <div
        class="flex flex-col space-y-1 hover:text-neutral-500 cursor-pointer"
        @click="openURL('https://paperlib.app/en/donate.html')"
      >
        <BIconCoin class="mx-auto" />
        <span class="mx-auto text-xs">Donate</span>
      </div>
    </div>
  </div>
</template>
