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

onMounted(() => {
  checkShouldShow();
});
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
      id="whats-new-view"
      class="absolute w-full h-full top-0 left-0 bg-white dark:bg-neutral-800 z-50 py-20 overflow-auto"
      v-if="show"
    >
      <div class="w-[40rem] h-screen px-3 mx-auto">
        <img class="w-20 mx-auto mb-2" src="../assets/icon.png" />
        <p class="text-center text-2xl font-bold mb-8">
          What's New in Paperlib 1.6.0
        </p>
        <li>
          Paperlib plugin for fast BibTex copy-paste. Try it with
          <span class="font-mono text-sm bg-neutral-200 rounded-md p-1"
            >cmd/ctrl + shift + I</span
          >.
        </li>
        <img
          class="w-96 mx-auto mt-5 mb-8 rounded-md shadow-neutral-400 shadow-lg"
          src="../assets/plugin.png"
        />
        <li>
          Clickable author tag. Left click to search papers of the author. Right
          click to open Google Scholar.
        </li>
        <img
          class="mx-auto w-56 mt-5 mb-8 rounded-md shadow-lg"
          src="../assets/author.png"
        />
        <li>Add openreview.net scraper.</li>
        <li>Support new Chrome extension.</li>
        <li>
          A lot of UI improvements such as better search bar, edit and
          preference UI.
        </li>
        <li>Redeveloped with tailwindcss.</li>
        <div
          class="mt-10 mx-auto flex w-60 h-10 bg-accentlight dark:bg-accentdark text-neutral-50 rounded-md shadow-md cursor-pointer"
          @click="hide"
        >
          <span class="m-auto">Close</span>
        </div>
      </div>
      <div
        class="fixed bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white"
      ></div>
    </div>
  </Transition>
</template>
