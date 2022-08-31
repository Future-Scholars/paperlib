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
      class="absolute w-full h-full top-0 left-0 bg-white dark:bg-neutral-800 z-50 pt-20 pb-48 overflow-auto dark:text-neutral-200"
      v-if="show"
    >
      <div class="w-[45rem] h-screen px-3 mx-auto">
        <img class="w-20 mx-auto mb-2" src="../assets/icon.png" />
        <p class="text-center text-2xl font-bold mb-8">
          What's New in Paperlib 1.10.1
        </p>
        <p class="mt-10 mb-4"><b>Improvements and fixed Bugs</b></p>
        <ul class="list-disc mb-20">
          <li>Fixed some bugs: #134 #135.</li>
        </ul>

        <div
          class="mt-10 mx-auto flex w-60 h-10 bg-accentlight dark:bg-accentdark text-neutral-50 rounded-md shadow-md cursor-pointer"
          @click="hide"
        >
          <span class="m-auto">Close</span>
        </div>

        <div class="w-full h-20"></div>
      </div>
      <div
        class="fixed bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white dark:from-neutral-800"
      ></div>
    </div>
  </Transition>
</template>
