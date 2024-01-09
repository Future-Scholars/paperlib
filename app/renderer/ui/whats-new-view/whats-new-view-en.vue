<script setup lang="ts">
import { onMounted, ref } from "vue";

import WhatsNewHeader from "./header.vue";

const show = ref(false);

const checkShouldShow = async () => {
  show.value = await window.appInteractor.shouldShowWhatsNew();
};

const hide = () => {
  show.value = false;
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
  checkShouldShow();
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
  <Transition
    enter-active-class="transition ease-out duration-75"
    enter-from-class="transform opacity-0"
    enter-to-class="transform opacity-100"
    leave-active-class="transition ease-in duration-75"
    leave-from-class="transform opacity-100"
    leave-to-class="transform opacity-0"
  >
    <div
      id="whats-new-view"
      class="absolute w-full h-full top-0 left-0 bg-white dark:bg-neutral-800 z-50 overflow-auto dark:text-neutral-200"
      v-if="show"
    >
      <div class="w-[45rem] px-3 mx-auto my-20 flex flex-col">
        <WhatsNewHeader :darkMode="darkMode" />
        <div class="h-[1px] bg-neutral-200 dark:bg-neutral-600 my-8"></div>

        <p class="text-center text-2xl font-bold mb-8">What's New in 2.2.9</p>

        <ul class="list-disc mb-5">
          <li>Prepare for version 3.0.0 releasing.</li>
        </ul>

        <p class="text-center text-2xl font-bold mb-8">
          Paperlib 3.0.0-beta.1 Released 🎉
        </p>
        <p class="mb-2">
          If you wish to join me in the development of Paperlib, please contact
          me.
        </p>
        <p class="mb-2">
          Happy New Year. I’m excited to announce that the first beta version of
          Paperlib 3.0 has just been released.
        </p>
        <p class="mb-2">
          Over the past few months, all the source code of Paperlib has been
          refactored to support an extensible structure. Currently, the entire
          development work has been completed, and most of the bugs have been
          fixed. Therefore, I would like to invite you to participate in
          testing, including the exciting development of extensions.
        </p>

        <p class="mb-2">
          Download links of the Beta version and the documentation of extension
          development, please visit the official website.
        </p>

        <p class="mb-2">
          <b>Compared to Paperlib 2.x, in 3.0.0-beta.1, we have:</b>
        </p>

        <ul class="list-disc mb-5">
          <li>Introduced the extension system.</li>
          <li>
            Moved all metadata scrapers and paper downloaders to corresponding
            extensions.
          </li>
          <li>
            Replaced the original search box with a new command panel, working
            with extensions to achieve more advanced functionality.
          </li>
          <li>
            Support for creating new empty tags and folders in the sidebar.
          </li>
          <li>Configuable UI font size.</li>
          <li>
            Fixed some bugs. Welcome any users to report bugs you find, and any
            extension developers to publish your extensions.
          </li>
        </ul>

        <p class="mb-2">
          Download links of the Beta version and the documentation of extension
          development, please visit the official website.
        </p>

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
  </Transition>
</template>
