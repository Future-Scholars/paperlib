<script setup lang="ts">
import { onMounted, ref } from "vue";

import WhatsNewHeader from "./header.vue";

const show = ref(false);

const checkShouldShow = async () => {
  show.value = await window.appInteractor.shouldShowWhatsNew();
};

const hide = () => {
  show.value = false;
  window.appInteractor.hideWhatsNew();
};

const loadHistoryReleaseNote = () => {
  var xhr = new XMLHttpRequest();
  xhr.open(
    "GET",
    "https://objectstorage.uk-london-1.oraclecloud.com/n/lrarf8ozesjn/b/bucket-20220130-2329/o/distribution%2Felectron-mac%2Fchangelog_cn.html",
    true
  );
  xhr.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      const div = document.getElementById("release-note");
      if (div) {
        div.innerHTML = this.responseText;
      }
    }
  };
  xhr.send();
};

const darkMode = ref(false);
onMounted(() => {
  loadHistoryReleaseNote();
  checkShouldShow();
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    darkMode.value = true;
  }
});
</script>

<style>
#release-note h2 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.2em;
}

#release-note ol {
  margin-bottom: 2em;
  list-style-type: circle;
}
</style>

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
      class="absolute w-full h-full top-0 left-0 bg-white dark:bg-neutral-800 z-50 overflow-auto dark:text-neutral-200"
      v-if="show"
    >
      <div class="w-[45rem] px-3 mx-auto my-20">
        <WhatsNewHeader :darkMode="darkMode" />
        <div class="h-[1px] bg-neutral-200 dark:bg-neutral-600 my-8"></div>

        <p class="text-center text-2xl font-bold mb-8">版本 2.2.6 更新内容</p>

        <ul class="list-disc mb-5">
          <li>更新 MS Word 证书。</li>
        </ul>

        <p class="text-center text-2xl font-bold mb-8">关于 Paperlib 3.0.0</p>

        <p class="mb-2">
          如果你愿意参与开发，想让 Paperlib 变得更好，帮助缓解开发人手不足，请联系我。谢谢。
        </p>

        <p class="mb-2">
          在这个大版本更新中，我们将会发布一个
          <b>类 vscode 的插件系统</b>
          。我们相信插件系统可以赋予 Paperlib
          更多可能性。同时保持软件主体干净简洁。
        </p>
        <p class="mb-2">
          仍然有许多开发工作需要做，需要对代码架构做大幅调整。但是我们会尽快发布这个版本。请期待。我们正在努力开发中。
        </p>
        <p class="mb-2">
          如果你有任何关于使用插件系统完成功能的想法，请在 Discord
          频道中告诉我们，或者在 Github 仓库中提出
          issue。更多的插件使用场景将会帮助我们设计出更好的插件系统架构。感激不尽。
        </p>

        <div
          id="whats-new-close-btn"
          class="mt-10 mx-auto flex w-60 h-10 bg-accentlight dark:bg-accentdark text-neutral-50 rounded-md shadow-md cursor-pointer"
          @click="hide"
        >
          <span class="m-auto">关闭</span>
        </div>

        <p class="text-center text-2xl font-bold mt-20 mb-8">历史版本更新</p>

        <div id="release-note" class="px-5 text-sm"></div>

        <div class="w-full h-20"></div>
      </div>

      <div
        class="fixed bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white dark:from-neutral-800"
      ></div>
    </div>
  </Transition>
</template>
