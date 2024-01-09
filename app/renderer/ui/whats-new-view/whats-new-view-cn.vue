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

        <p class="text-center text-2xl font-bold mb-8">版本 2.2.9 更新内容</p>

        <ul class="list-disc mb-5">
          <li>为 3.0 版本发布做准备。</li>
        </ul>

        <p class="text-center text-2xl font-bold mb-8">
          Paperlib 3.0.0-beta.1 发布 🎉
        </p>

        <p class="mb-2">
          如果你愿意参与开发，想让 Paperlib
          变得更好，帮助缓解开发人手不足，请联系我。谢谢。
        </p>

        <p class="mb-2">
          新年快乐。 我激动的宣布，Paperlib 3.0 的第一个 beta 版本刚刚发布了。
        </p>
        <p class="mb-2">
          在过去的大半年里，Paperlib
          的所有底层代码都被重构了，以支持可扩展的插件结构。
          目前，整个开发工作已经结束，大部分的 Bug
          也已经被修复。因此我想是时候邀请大家参与测试。当然，包括令人激动的插件开发。
        </p>
        <p class="mb-2">Beta 版下载地址和插件开发文档，请前往官网查看。</p>

        <p class="mb-2">相比于 Paperlib 2.x，在 3.0.0-beta.1 中：</p>

        <ul class="list-disc mb-5">
          <li>引入了插件系统。</li>
          <li>所有的元数据搜刮器，论文下载器都被移动到了对应插件中。</li>
          <li>
            一个新的命令面板替换原来的搜索框，配合插件，完成更多高级功能。
          </li>
          <li>支持在侧边栏新建空标签和空组。</li>
          <li>调整字体大小。</li>
          <li>
            修复了一些 Bug。 欢迎任何尝鲜用户提出你发现的
            Bug，以及任何插件开发者发布您的插件。
          </li>
        </ul>

        <p class="mb-2">下载地址和插件开发文档，请前往官网查看。</p>

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
