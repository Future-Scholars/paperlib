<script setup lang="ts">
import { onMounted, ref } from "vue";

const show = ref(true);

const checkShouldShow = async () => {
  // show.value = await window.appInteractor.shouldShowWhatsNew();
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
          What's New in Paperlib 1.9.6
        </p>

        <p class="mt-10 font-bold">New Features</p>
        <div class="flex justify-between space-x-5">
          <div class="pt-10">
            <ul class="list-disc">
              <li>Render LaTex in the details panel.</li>
              <p class="mb-4">详情界面的标题和摘要支持渲染 LaTex。</p>

              <li>
                Support locating PDF from arXiv, unpaywall, and xxx-hub. #122
                Please manually input the URL of the xxx-hub in the preference
                window.
              </li>
              <p class="mb-4">
                对于没有链接 PDF 的论文条目，可以从 arXiv，unpaywall，和某 hub
                查找下载 PDF。为规避可能的法律风险，请在设置里自行手动输入那个
                hub 的网址。
              </p>

              <li>Import papers from a BibTex file.</li>
              <p>支持拖入 BibTex 文件导入论文。</p>
            </ul>
          </div>
          <img class="rounded-md shadow-lg w-72" src="../assets/1.png" />
        </div>

        <p class="mt-10 mb-4"><b>Improvements and fixed Bugs</b></p>
        <ul class="list-disc">
          <li>
            For those who have cloud sync set up, now it is possible to use
            Paperlib without network connection.
          </li>
          <p class="mb-4">
            对于设置了云同步的用户，现在可以在无网络环境使用
            Paperlib。做出的更改会在恢复网络之后进行同步。
          </p>

          <li>Fixed some bugs in custom scrapers.</li>
        </ul>

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
