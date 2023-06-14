<script setup lang="ts">
import { onMounted, ref } from "vue";

import WhatsNewHeader from "./header.vue";

const hide = () => {
  window.appInteractor.hideWhatsNew();
};

const loadHistoryReleaseNote = () => {
  var xhr = new XMLHttpRequest();
  xhr.open(
    "GET",
    "https://objectstorage.uk-london-1.oraclecloud.com/n/lrarf8ozesjn/b/bucket-20220130-2329/o/distribution%2Felectron-mac%2Fchangelog_en.html",
    true
  );
  xhr.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      const div = document.getElementById("release-note");
      if (div) {
        div.innerHTML = this.responseText;
      }
    }
  };
  xhr.send();
};

const darkMode = ref(false);
onMounted(() => {
  loadHistoryReleaseNote();
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    darkMode.value = true;
  }
});
</script>

<style>
#release-note h2 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.2em;
}

#release-note ol {
  margin-bottom: 2em;
  list-style-type: circle;
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

      <p class="text-center text-2xl font-bold mb-8">What's New in 2.2.2</p>

      <ul class="list-disc mb-5">
        <li>
          New Feature: <b>Smart Filter</b>! <br />
          You can create a smart filter to do an advanced filtering. For
          example: papers with 'tag A' and 'tag B'; recently added papers;
          papers by a specific author; title contains the string 'abc' etc.
          <span class="text-red-500"
            >Please turn on the 'DEV mode' if you are using the online MongoDB
            Atlas database</span
          >. Learn more
          <a class="underline" href="https://paperlib.app/en/doc/smart-filter/"
            >here</a
          >.
          <img
            class="rounded-md drop-shadow-lg my-4"
            src="../../assets/smart-filter.png"
          />
        </li>
        <li>More colours for tags and folders.</li>
        <li>Remember the window size.</li>
        <li>Fix PDF quicklook for Windows.</li>
        <li>Fix downloader delete button display bug. Thanks @qzydustin</li>
      </ul>
      <div
        id="whats-new-close-btn"
        class="mt-10 mx-auto flex w-60 h-10 bg-accentlight dark:bg-accentdark text-neutral-50 rounded-md shadow-md cursor-pointer"
        @click="hide"
      >
        <span class="m-auto">Close</span>
      </div>

      <p class="text-center text-2xl font-bold mt-20 mb-8">
        History Release Note
      </p>

      <div id="release-note" class="px-5 text-sm"></div>

      <div class="w-full h-20"></div>
    </div>

    <div
      class="fixed bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white dark:from-neutral-800"
    ></div>
  </div>
</template>
