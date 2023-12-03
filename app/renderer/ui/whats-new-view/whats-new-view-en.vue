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
    true,
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

        <p class="text-center text-2xl font-bold mb-8">What's New in 2.2.7</p>

        <ul class="list-disc mb-5">
          <li>
            Now the sync backend supports the new `flexible` mode. (MongoDB
            Atlas will never support the previous 'partition' based sync
            anymore. This is an update for new users only.)
          </li>
          <li>Fixed a searching bug in the tag/folder view.</li>
          <li>Fixed the preference window overflow bug.</li>
          <li>Fixed a bug when dragging a PDF onto a tag/folder directly.</li>
        </ul>

        <p class="text-center text-2xl font-bold mb-8">
          Development Update of Paperlib 3.0.0
        </p>
        <p class="mb-2">
          If you wish to join me in the development of Paperlib, please contact
          me.
        </p>
        <p class="mb-2">
          In this major update, a
          <b>vscode-like extension system</b> will be introduced to Paperlib.
        </p>
        <p class="mb-2">
          I have completed the basic framework of the extension system.
          Currently, I'm verifying it by developing some demo extensions and
          writing the extension API documents. It may take a while to finish.
        </p>

        <p class="mb-2">
          If you have any ideas about some useful extension use cases, please
          feel free to tell me in the Discord channel or raise an issue in the
          Github repo. More extension use cases will help me to design a better
          extension architecture.
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
