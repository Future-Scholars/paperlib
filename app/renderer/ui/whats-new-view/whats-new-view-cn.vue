<script setup lang="ts">
import { onMounted, ref } from "vue";

import WhatsNewHeader from "./header.vue";

const hide = async () => {
  preferenceService.set({
    lastVersion: await PLMainAPI.upgradeService.currentVersion(),
  });
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
onMounted(async () => {
  loadHistoryReleaseNote();
  darkMode.value = await PLMainAPI.windowProcessManagementService.isDarkMode();
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
  <div
    id="whats-new-view"
    class="absolute w-full h-full top-0 left-0 bg-white dark:bg-neutral-800 z-50 overflow-auto dark:text-neutral-200"
  >
    <div class="w-[45rem] px-3 mx-auto my-20">
      <WhatsNewHeader :darkMode="darkMode" />
      <div class="h-[1px] bg-neutral-200 dark:bg-neutral-600 my-8"></div>

      <p class="text-center text-2xl font-bold mb-8">版本 2.2.2 更新内容</p>

      <ul class="list-disc mb-5">
        <li>
          新功能: <b>Smart Filter</b>! <br />
          你可以创建一个 smart filter 来进行高级过滤。例如： 同时具有 'tag A' 和
          'tag B'
          的论文；最近添加的论文；某个作者发表的论文；标题里有某个关键字的论文等等。
          <span class="text-red-500"
            >请打开 'DEV mode' 如果你使用在线 MongoDB Atlas 数据库</span
          >。 详情请见
          <a class="underline" href="https://paperlib.app/cn/doc/smart-filter/"
            >文档</a
          >。
          <img
            class="rounded-md drop-shadow-lg my-4"
            src="../../assets/smart-filter.png"
          />
        </li>
        <li>标签/文件夹支持更多的颜色。</li>
        <li>记住上次关闭时的窗口尺寸。</li>
        <li>修复 Windows 的快速预览。</li>
        <li>修复下载器设置的按钮文字。Thanks @qzydustin</li>
      </ul>

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
</template>
