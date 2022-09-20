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
    "https://objectstorage.uk-london-1.oraclecloud.com/n/lrarf8ozesjn/b/bucket-20220130-2329/o/distribution%2Felectron-mac%2Fchangelog_en.html",
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
        <img class="w-20 mx-auto mb-2" src="../assets/icon.png" />
        <p class="text-center text-2xl font-bold mb-8">
          What's New in Paperlib 2.0.1
        </p>

        <ul class="list-disc mb-5">
          <li>Fixed a bug.</li>
          <li>修复一个 Bug。</li>
        </ul>

        <p class="text-center text-2xl font-bold mb-8">
          What's New in Paperlib 2.0.0
        </p>

        <ul class="list-disc mb-5">
          <li>
            Rewrite the database related code to optimise the response time. For
            example, the resorting time for 10K paper items is decreased from 3s
            to 30ms.
          </li>
          <li>
            重写数据库代码，优化响应时间。例如，对于 10K 篇文献，排序时间从 3s
            降低到 30ms。
          </li>
        </ul>
        <ul class="list-disc mb-5">
          <li>
            Cache the preview image to optimise the rendering speed of paper
            preview.
          </li>
          <li>优化预览渲染速度，缓存文献预览图。</li>
        </ul>
        <ul class="list-disc mb-5">
          <li>
            Multi language support. Currently, English and Chinese are
            supported.
          </li>
          <li>多语言支持，目前支持英文和中文。</li>
        </ul>
        <ul class="list-disc mb-5">
          <li>Redesigned the UI of Windows version.</li>
          <li>重新设计了部分 Windows 版本的 UI。</li>
        </ul>
        <ul class="list-disc mb-5">
          <li>Automatically detect and use the system proxy.</li>
          <li>
            自动检测和使用系统默认代理。中国大陆地区推荐设置代理来加速个别数据库的访问速度。我们会持续尽力优化对于无代理的大陆用户的体验。
          </li>
        </ul>
        <ul class="list-disc mb-5">
          <li>Added some guidance pages.</li>
          <li>增加了导引界面。</li>
        </ul>
        <ul class="list-disc mb-5">
          <li>
            Redesigned the metadata scrapper pipeline and setting UI. For users
            who already used a custom scraper, you may need to modify the code
            of your scraper slightly. See Github for details.
          </li>
          <li>
            重新设计了元数据搜寻器的流程以及设置界面。对于已经使用了自定义搜寻器的用户，您可能需要稍微修改一下您的自定义代码。详情请见
            Github。
          </li>
        </ul>
        <ul class="list-disc mb-5">
          <li>
            Added two new scrapers: Paperlib Query Service (the server backend
            is still in progress), Semantic Scholar. We are constantly adding
            new scrapers, please contact me directly if you would like to
            optimise Paperlib for your research topic.
          </li>
          <li>
            增加了两个新的元数据搜寻器：Paperlib Query Service
            (后端仍在设计实现中), Semantic
            Scholar。我们仍在不断添加新的搜寻器，如果你想为你的学科优化 Paperlib
            的元数据搜索能力，请直接联系我。
          </li>
        </ul>
        <ul class="list-disc mb-5">
          <li>Optimise the launching speed, memory usage.</li>
          <li>优化程序启动速度、占用内存等。</li>
        </ul>
        <ul class="list-disc mb-5">
          <li>Optimise the performance of some metadata scrapers.</li>
          <li>优化部分元数据搜寻器的性能。</li>
        </ul>
        <ul class="list-disc mb-5">
          <li>Moving files to trash instead of deleting files.</li>
          <li>删除的文件会首先移入回收站而不是直接删除。</li>
        </ul>
        <ul class="list-disc mb-5">
          <li>
            Add a progress bar to show some notifications such as downloading
            progress.
          </li>
          <li>添加了一个进度条来显示如下载的进度。</li>
        </ul>
        <ul class="list-disc mb-5">
          <li>
            Now adding a paper in a subscribed feed will not download its PDF
            file.
          </li>
          <li>
            添加一个 RSS
            订阅的论文到库的时候不会自动下载论文了，以此来提高添加速度。
          </li>
        </ul>
        <ul class="list-disc mb-5">
          <li>Fixed some bugs.</li>
          <li>修复了很多 Bug。</li>
        </ul>

        <div
          class="mt-10 mx-auto flex w-60 h-10 bg-accentlight dark:bg-accentdark text-neutral-50 rounded-md shadow-md cursor-pointer"
          @click="hide"
        >
          <span class="m-auto">Close</span>
        </div>

        <p class="text-center text-2xl font-bold mt-20 mb-8">
          History Release Note
        </p>

        <div id="release-note" class="px-5 text-sm"></div>

        <div class="w-full h-20"></div>
      </div>

      <div
        class="fixed bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white dark:from-neutral-800"
      ></div>
    </div>
  </Transition>
</template>
