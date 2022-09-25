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
          Paperlib 2.0.2 更新内容
        </p>

        <ul class="list-disc mb-5">
          <li>现在可以配置表格视图下显示哪些列了。</li>
          <li>
            增加了元数据搜寻结果缓存，每个成功的搜寻结果（仅公共数据库返回结果）将会对其他用户共享缓存，加快热门文章搜寻的速度。
          </li>
          <li>DBLP 搜寻器增加了一个备用 API 地址。</li>
          <li>修复一个在使用 Onedrive 作为文件夹时候删除文件的 Bug。</li>
          <li>修复一个 RSS 订阅刷新时的 Bug。</li>
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
