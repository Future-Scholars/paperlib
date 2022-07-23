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
          What's New in Paperlib 1.9.0
        </p>
        <p class="mt-10"><b>New Features</b></p>
        <li>RSS subscription. #50</li>
        <p class="ml-5">支持从 arXiv 等处 RSS 订阅论文。使用方法见下图。</p>
        <p class="ml-5 text-red-500">
          ⚠️ If you are using the Atlas database sync, please make sure you have
          turned on the dev mode of your cloud database to upload the modified
          table scheme.
        </p>
        <p class="ml-5 text-red-500">
          ⚠️ 如果您使用 Atlas 云同步数据库功能，请确保在使用此功能前打开数据库
          scheme 的 dev mode
          保证数据库表结构的修改能够上传到云端。本地数据库无需操作。详情参阅如何使用云同步的教程。
        </p>
        <img
          class="mx-auto mt-5 mb-8 rounded-md shadow-lg"
          src="../assets/1.jpg"
        />

        <li>Support markdown notes #94</li>
        <p class="ml-5">
          支持 markdown 格式的笔记。只需在编辑的时候输入 &lt;md&gt; 作为开头。
        </p>

        <img
          class="mx-auto mt-5 mb-8 rounded-md shadow-lg"
          src="../assets/2.jpg"
        />

        <li>A new notification center.</li>
        <p class="ml-5">
          添加了一个通知中心。在这里显示 Paperlib 的一些处理信息以及报错。
        </p>

        <img
          class="mx-auto mt-5 mb-8 rounded-md shadow-lg w-96"
          src="../assets/3.jpg"
        />

        <p class="mt-10"><b>Improvements and Fixed Bugs</b></p>
        <li>More editable information #113</li>
        <p class="ml-5">更多的可编辑信息。</p>
        <li>Fix some bugs.</li>

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
