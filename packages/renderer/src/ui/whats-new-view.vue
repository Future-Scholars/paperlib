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
          What's New in Paperlib 1.9.4
        </p>

        <p class="mt-10"><b>News</b></p>
        <p>
          🎉 Leave your comments to Paperlib 📣 at
          https://github.com/GeoffreyChen777/paperlib/issues/119 to introduce
          Paperlib to new users.
        </p>
        <p class="mt-2">
          🎉 留下您对 Paperlib 的评价
          📣，https://github.com/GeoffreyChen777/paperlib/issues/119，开发者会将其展示在主页上以帮助将
          Paperlib 推荐给更多的新用户。
        </p>

        <p class="mt-10"><b>Improvements and fixed Bugs</b></p>
        <li>Save mainview and sorting preference. #124</li>
        <p class="ml-5">保存主视图类型和排序等设置。 #124</p>
        <li>Better code repos scraper. #125</li>
        <p class="ml-5">
          优化代码仓库抓取器。现在抓取 star 前三名的仓库并显示。 #125
        </p>
        <li>Fixed: Keyboard pressing bug in input fields #123</li>
        <p class="ml-5">修复部分输入框按键 Bug。 #123</p>

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
