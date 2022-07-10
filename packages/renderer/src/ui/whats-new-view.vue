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
          What's New in Paperlib 1.8.1
        </p>
        <p class="mt-10"><b>News</b></p>
        <li>
          <b>FireFox add-on is ready.</b>
        </li>
        <p class="ml-5">FireFox 插件可以下载了。</p>
        <p class="mt-10"><b>Thanks</b></p>
        <li>The first donation from @ji***qing</li>
        <li>supports from my friends @xh**05, and @1412**de, and @lqx**ok</li>
        <li>suggestions from all users.</li>

        <p class="mt-10"><b>New Features</b></p>
        <li>Setup your custom scraper #44, scrapers' priority.</li>
        <p class="ml-5">
          设置自定义的 metadata 搜刮器。现有搜刮器也可设置优先级。使用指南请参考
          https://github.com/GeoffreyChen777/paperlib/wiki
        </p>
        <img
          class="mx-auto mt-5 mb-8 rounded-md shadow-lg"
          src="../assets/1.png"
        />

        <li>Dialog window hotkey #108</li>
        <p class="ml-5">一些对话框可以使用 Esc 和回车快捷键了。</p>

        <p class="mt-10"><b>Fixed Bugs</b></p>
        <li>DOI scraper / Google Scholar importer error #106</li>
        <p class="ml-5">
          一些 PDF 提取 DOI 不完整和 Google Scholar 插件的错误已修复。
        </p>
        <li>
          The what's new window cannot be closed after updating on small screen.
          #109
        </li>
        <p class="ml-5">在小屏幕上无法点击到更新详情关闭按钮。</p>

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
