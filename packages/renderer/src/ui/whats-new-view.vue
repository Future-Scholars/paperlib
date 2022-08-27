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
          What's New in Paperlib 1.10.0
        </p>
        <p class="mt-10 mb-4"><b>New Features</b></p>
        <ul class="list-disc">
          <li>1. Better reference copy-paste plugin.</li>
          <p>更好的引用快速复制粘贴插件。</p>

          <img class="rounded-md" src="../assets/1.png" />
          <p>
            Link an existing/newly-created folder in paperlib to this copy-paste
            plugin.
          </p>
          <p class="mb-4">
            现在插件可以链接 Paperlib 里的
            Folder，来帮助你组织一次写作所需的引用。当然也可是新建的。
          </p>

          <p>Press shift + enter to copy the cite key of a paper.</p>
          <p class="mb-4">按 shift + enter 可以复制文章的引用 Key。</p>

          <img class="rounded-md" src="../assets/2.png" />
          <p class="mb-4">
            在链接了文件夹之后，所有通过此插件复制引用的文都会被自动添加到这个文件夹里面。同时，一个新的快捷键
            ctrl/cmd + enter 按下之后可以复制整个文件夹里所有文章的引用。
          </p>

          <p class="mb-4">
            至此，使用此插件和 BibTex 写作将会变得非常简单，无论你是喜欢用
            overleaf，vscode，texpad，还是任何编辑器：链接一个
            Folder，写作过程中不断地查找引用，复制引用 key，最后复制全部的引用
            BibTex 到你的论文草稿里。
          </p>

          <img class="rounded-md" src="../assets/3.png" />
          <p>
            For the plaintext reference, now you can choose/import a citation
            style.
          </p>
          <p class="mb-4">
            对于纯文本引用格式，现在你可以在设置里选择你喜欢的 CSL
            格式，你也可以导入自己下载的 CSL 格式。
          </p>

          <li>2. Editable folder and tag.</li>
          <p>现在可以在侧边栏重命名 tag 和 folder 了。</p>
          <img class="rounded-md w-72 mb-4" src="../assets/4.png" />

          <li>3. Choose your prefered PDF viewer.</li>
          <p>现在可以在设置里的 General 选项卡选择你喜欢的 PDF 阅读器了。</p>
        </ul>

        <p class="mt-10 mb-4"><b>Improvements and fixed Bugs</b></p>
        <ul class="list-disc">
          <li>Fixed some shortcuts bugs of the plugin window.</li>
          <p class="mb-4">修复了插件窗口的一些快捷键的 bug。</p>
          <li>Rewrite the reference management backend.</li>
          <p class="mb-4">
            重写了整个引用格式管理的后端，为未来更多引用导出的功能做铺垫。
          </p>
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
