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
          What's New in Paperlib 1.9.5
        </p>

        <p class="mt-10"><b>Tips&#128161;</b></p>
        <p>
          Use the custom scraper to automatically tag your newly imported
          papers.
        </p>
        <p>利用自定义搜刮器来实现给新导入论文自动添加标签的功能。</p>
        <p>
          https://github.com/GeoffreyChen777/paperlib/wiki/Custom-Scraper#use-custom-scraper-to-implement-auto-tagger
        </p>

        <p class="mt-10"><b>Improvements and fixed Bugs</b></p>
        <li>Now you can remove a tag/folder in the details panel.</li>
        <p class="ml-5">可以在详情界面删除标签/文件夹了。</p>
        <img
          class="mx-auto mt-5 mb-8 rounded-md shadow-lg w-96"
          src="../assets/1.png"
        />
        <li>
          Copy plain text or BibTex using the plugin with two modes. Press Tab
          or click it to switch between two modes
        </li>
        <p class="ml-5">
          快速复制插件支持两种模式，按下 Tab 键或者点击来切换。
        </p>
        <img class="mx-auto mt-5" src="../assets/2.png" />
        <img class="mx-auto mb-8" src="../assets/3.png" />
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
