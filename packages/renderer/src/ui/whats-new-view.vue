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
          What's New in Paperlib 1.7.6
        </p>
        <p><b>New features</b></p>
        <li>Configurable hotkeys.</li>
        <p class="ml-5">自定义快捷键</p>
        <img
          class="w-96 mx-auto mt-5 mb-8 rounded-md shadow-neutral-400 shadow-lg"
          src="../assets/1.png"
        />
        <li>Arrow up and down to select the previous or next paper.</li>
        <p class="ml-5">方向键切换选择论文</p>
        <p><b>Fixed bugs</b></p>
        <li>Local to cloud migration bug.</li>
        <p class="ml-5">迁移本地数据到云端时的错误</p>
        <li>'Space' and 'Enter' key bug in the edit view.</li>
        <p class="ml-5">在编辑界面按空格回车的问题</p>

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
