<script setup lang="ts">
import { onMounted, ref } from "vue";

import WhatsNewHeader from "./header.vue";

const preState = preferenceService.useState();

const hide = async () => {
  preferenceService.set({
    lastVersion: await PLMainAPI.upgradeService.currentVersion(),
  });
};

const currentVersion = ref("");
const currentReleaseNoteHTML = ref("");
const loadCurrent = async () => {
  const response = await fetch(
    `https://api.paperlib.app/release-notes/json?lang=${
      (preState.language === "zh-CN" || preState.language === "zh-TW")
        ? "CN"
        : "EN"
    }&latest=1&branch=main`
  );

  const json = await response.json();
  currentVersion.value = json[0].version;

  const html = (
    await renderService.renderMarkdown(
      json[0].updates.map((update) => `- ${update}`).join("\n"),
      true
    )
  ).renderedStr;
  currentReleaseNoteHTML.value = html;
};

const historyReleaseNoteHTML = ref("");
const loadHistory = async () => {
  const response = await fetch(
    `https://api.paperlib.app/release-notes/html?lang=${
      (preState.language === "zh-CN" || preState.language === "zh-TW")
        ? "CN"
        : "EN"
    }&latest=5&branch=main`
  );

  historyReleaseNoteHTML.value = await response.text();
};

const darkMode = ref(false);
onMounted(async () => {
  darkMode.value = await PLMainAPI.windowProcessManagementService.isDarkMode();

  await loadCurrent();
  await loadHistory();
});
</script>

<style>
#release-note ul {
  list-style-type: disc;
}

#release-note img {
  border-radius: 0.5em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -2px rgb(0 0 0 / 0.5);
}

#release-note code {
  background-color: #00000074;
  color: white;
  padding: 0.1em 0.3em;
  border-radius: 0.3em;
  font-size: 0.8em;
}

#history-release-note h2 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.2em;
}

#history-release-note ol {
  margin-bottom: 2em;
  list-style-type: circle;
}

#history-release-note img {
  display: none;
}
</style>

<template>
  <div
    id="whats-new-view"
    class="absolute w-full h-full top-0 left-0 bg-white dark:bg-neutral-800 z-50 overflow-auto dark:text-neutral-200"
  >
    <div class="w-[45rem] px-3 mx-auto my-20 flex flex-col">
      <WhatsNewHeader :darkMode="darkMode" />
      <div class="h-[1px] bg-neutral-200 dark:bg-neutral-600 my-8"></div>

      <p class="text-center text-2xl font-bold mb-8">
        {{ `${$t("mainview.whatsnew")} ${currentVersion}` }}
      </p>

      <div id="release-note" class="mb-5" v-html="currentReleaseNoteHTML" />
      <div
        id="whats-new-close-btn"
        class="mt-10 mx-auto flex w-60 h-10 bg-accentlight dark:bg-accentdark text-neutral-50 rounded-md shadow-md cursor-pointer"
        @click="hide"
      >
        <span class="m-auto">Close</span>
      </div>

      <p class="text-center text-2xl font-bold mt-20 mb-8">
        {{ $t("mainview.historyreleasenote") }}
      </p>

      <div
        id="history-release-note"
        class="px-5 text-sm"
        v-html="historyReleaseNoteHTML"
      ></div>

      <div class="w-full h-20"></div>
    </div>

    <div
      class="fixed bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white dark:from-neutral-800 pointer-events-none"
    ></div>
  </div>
</template>
