<script setup lang="ts">
import { onMounted, ref } from "vue";

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

const openIntro = () => {
  window.appInteractor.open("https://paperlib.app/en/blog/word-addin/");
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
      <div class="w-[45rem] px-3 mx-auto my-20">
        <img
          class="w-12 mx-auto mb-6"
          src="../../assets/logo-dark.png"
          v-if="darkMode"
        />
        <img
          class="w-10 mx-auto mb-6"
          src="../../assets/logo-light.png"
          v-else
        />
        <p class="text-center text-2xl font-bold mb-8">
          What's New in Paperlib 2.1.2
        </p>

        <ul class="list-disc mb-5">
          <li>Browser extension now supports CNKI (中国知网).</li>
          <li>
            If DBLP returns metadata with a doi, then use this DOI first to get
            metadata.
          </li>
          <li>Fixed an animation bug of the search bar.</li>
          <li>
            Fixed a bug occured when clicking a URL link in the PDF reader view.
          </li>
        </ul>
        <img
          class="w-[400px] mx-auto shadow-lg"
          src="../../assets/whatsnew-1.png"
        />
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
