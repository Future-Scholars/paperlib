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
          What's New in Paperlib 1.8.2
        </p>
        <p class="mt-10"><b>New Features</b></p>
        <li>Configurable paper detail information in the mainview. #112</li>
        <p class="ml-5">
          支持在主列表展示自定义的详情信息。在这里你可以选择展示发表相关信息，标签文件夹，打分和笔记等。
        </p>
        <img
          class="mx-auto mt-5 mb-8 rounded-md shadow-lg"
          src="../assets/1.png"
        />

        <li>Directly import files or paper items to a folder or tag. #93</li>
        <p class="ml-5">
          直接拖动 PDF
          文件或者已有的论文条目到侧边栏直接添加到对应标签或文件夹。
        </p>

        <img
          class="mx-auto mt-5 mb-8 rounded-md shadow-lg"
          src="../assets/2.png"
        />

        <li>Contextmenu: Scrape by using a specific scraper. #110</li>
        <p class="ml-5">右键菜单添加了从某一特定搜刮器搜刮 metadata 的选项。</p>

        <p class="mt-10"><b>Improvements and Fixed Bugs</b></p>
        <li>
          Better experience when restoring a closed but not killed Paperlib on
          macOS #106
        </li>
        <p class="ml-5">
          在macOS上，当关闭主窗口后但未完全退出时，优化恢复之前的窗口时的速度。
        </p>
        <li>Fix some bugs in the scrapers.</li>

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
