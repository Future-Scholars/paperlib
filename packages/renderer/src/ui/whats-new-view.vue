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
      <div class="w-[40rem] h-screen px-3 mx-auto">
        <img class="w-20 mx-auto mb-2" src="../assets/icon.png" />
        <p class="text-center text-2xl font-bold mb-8">
          What's New in Paperlib 1.7.8
        </p>
        <p class="mt-10"><b>News</b></p>
        <li>
          <b
            >Apple Silicon (M1/M2) BETA is ready. Download it from Paperlib
            webpage.</b
          >
        </li>
        <p class="ml-5">
          Apple Silicon (M1/M2) Beta
          测试版本可以下载了，不再需要转译运行，如果您想要尝试，请前往
          https://paperlib.app/en/download/ 下载对应版本。如果遇到任何 Bug
          请前往 Github 上提 Issue。
        </p>

        <p class="mt-10"><b>New Features</b></p>
        <li>Custom file renaming format #102</li>
        <p class="ml-5">设置中可设置自定义导入文件重命名格式。</p>
        <img
          class="mx-auto mt-5 mb-8 rounded-md shadow-lg"
          src="../assets/1.png"
        />

        <li>Adjustable left panel width. #103</li>
        <p class="ml-5">可以拖拽调整左侧边栏的宽度。</p>
        <img
          class="mx-auto w-96 mt-5 mb-8 rounded-md shadow-lg"
          src="../assets/2.png"
        />

        <div
          class="mt-10 mx-auto flex w-60 h-10 bg-accentlight dark:bg-accentdark text-neutral-50 rounded-md shadow-md cursor-pointer"
          @click="hide"
        >
          <span class="m-auto">Close</span>
        </div>
      </div>
      <div
        class="fixed bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white dark:from-neutral-800"
      ></div>
    </div>
  </Transition>
</template>
