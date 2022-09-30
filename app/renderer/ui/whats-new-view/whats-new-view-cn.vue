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

onMounted(() => {
  loadHistoryReleaseNote();
  checkShouldShow();
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
        <img class="w-20 mx-auto mb-2" src="../../assets/icon.png" />
        <p class="text-center text-2xl font-bold mb-8">
          Paperlib 2.0.3 更新内容
        </p>

        <ul class="list-disc mb-5">
          <li>为物理学和地球科学增添优化了元数据搜寻器以及预设推荐选择。</li>
          <ul class="list-disc ml-5 mb-5">
            <li>Springer Nature</li>
            <li>Elseivier Scopus</li>
            <li>NASA Astrophysics Data System</li>
            <li>SPIE: Inte. Society for Optics and Photonics</li>
          </ul>
          <li>一个新的视图，可以直接在 Paperlib 内浏览 PDF。</li>
          <img src="./1.jpg" />
          <li>优化了 Crossref 的搜寻速度。</li>
          <li>优化了 RSS 订阅的解析效果，支持更多格式。</li>
          <li>优化了 添加附件拖拽时的 UI。</li>
          <li>一次性导入大量论文时分批次进行，防止超出 API 请求速率限制。</li>
          <li>编辑界面添加了直接重新搜寻元数据的按钮。</li>
        </ul>
        <div
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
