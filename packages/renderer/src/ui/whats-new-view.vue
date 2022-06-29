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
      class="absolute w-full h-full top-0 left-0 bg-white dark:bg-neutral-800 z-50 py-20 overflow-auto dark:text-neutral-200"
      v-if="show"
    >
      <div class="w-[40rem] h-screen px-3 mx-auto">
        <img class="w-20 mx-auto mb-2" src="../assets/icon.png" />
        <p class="text-center text-2xl font-bold mb-8">
          What's New in Paperlib 1.7.7
        </p>
        <li>Chorme extension is ready.</li>
        <p class="ml-5">Chrome 插件已经审核通过可以下载了。</p>

        <p class="mt-10"><b>Fixed bugs</b></p>
        <li>
          "cmd+shift+I" A JavaScript error occurred in the main process #100
        </li>
        <p class="ml-5">BibTex快捷插入插件在特定屏幕分辨率下无法打开的问题。</p>
        <li>Long warning window when importing papers #99</li>
        <p class="ml-5">极少数论文提取过长错误标题的问题。</p>
        <li>UI length overflow in the preference panel #98</li>
        <p class="ml-5">设置界面论文库地址显示超出边界的问题。</p>
        <li>Several webdav issues.</li>
        <p class="ml-5">WebDAV 相关若干问题。</p>

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
