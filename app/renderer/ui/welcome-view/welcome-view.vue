<script setup lang="ts">
import { onMounted, ref } from "vue";

const prefState = PLMainAPI.preferenceService.useState();

const hide = async () => {
  PLMainAPI.preferenceService.set({
    showWelcome: false,
  });
};

const darkMode = ref(false);

const language = ref("en-GB");

const isShowSlogan = ref(true);

onMounted(async () => {
  darkMode.value = await PLMainAPI.windowProcessManagementService.isDarkMode();
  language.value = `${prefState.language}`;

  setTimeout(() => {
    isShowSlogan.value = false;
  }, 2500);
});
</script>

<style>
@keyframes typing {
  from {
    width: 0;
  }
}

@keyframes caret {
  50% {
    border-right-color: transparent;
  }
}

.typing-style {
  width: 24ch;
  white-space: nowrap;
  overflow: hidden;
  border-right: 0.05em solid;
  animation: typing 2s steps(15), caret 0.5s steps(1) infinite;
}
</style>

<template>
  <div
    id="welcome-view"
    class="absolute w-full h-full top-0 left-0 bg-white dark:bg-neutral-800 z-50 overflow-auto dark:text-neutral-200"
  >
    <div
      class="typing-style text-xl font-bold font-mono mx-auto my-40"
      v-if="isShowSlogan"
    >
      WELCOME TO PAPERLIB 3.0
    </div>
    <div class="w-[45rem] px-3 mx-auto my-20 flex flex-col" v-else>
      <div class="mx-auto font-semibold mb-8 space-x-2 flex">
        <span class="text-3xl my-auto">PAPERLIB</span>
        <span
          class="text-xl bg-neutral-700 text-white dark:bg-neutral-300 dark:text-neutral-800 rounded-md px-2 py-1 my-auto"
          >3.0</span
        >
      </div>
      <div class="flex space-x-2 mx-auto mb-4">
        <div class="underline cursor-pointer" @click="language = 'en-GB'">
          English
        </div>
        <div>|</div>
        <div class="underline cursor-pointer" @click="language = 'zh-CN'">
          简体中文
        </div>
      </div>
      <div class="flex flex-col" v-if="language === 'en-GB'">
        <div class="mx-auto mb-8 font-semibold">
          Welcome to the new major version --- Paperlib 3.0.
        </div>
        <div>
          In Paperlib 3.0, we bring you a new experience with many exciting new
          features:
        </div>
        <ul class="list-disc px-4 mx-1">
          <li class="font-semibold">Extension System</li>
          <li class="font-semibold">Hierarchy Folders/SmartFilters</li>
          <li class="font-semibold">Some redesigned UI</li>
          <li>and more...</li>
        </ul>
        <hr class="my-8" />
        <div class="font-bold text-xl mb-4">Extension System</div>
        <div class="mb-2">
          Paperlib 3.0 introduces a new extension system that allows you to
          extend the functionality of Paperlib. You can now install extensions
          from the Extension Marketplace, or develop and publish your own
          extension.
        </div>
        <div class="mb-2">
          <span
            >We also provide a lot of extensions created by the official team
            such as:</span
          >
          <ul class="list-disc px-4 mx-1">
            <li class="space-x-2">
              <span class="font-semibold">metadata-scrape</span>
              <span>-</span>
              <span>helps you scrape the metadata for your papers.</span>
            </li>
            <li class="space-x-2">
              <span class="font-semibold">ai-summary / ai-chat</span>
              <span>-</span>
              <span
                >uses LLM to summarise papers, tag a paper, filter your libray
                with human language, or chat with LLM about a paper.</span
              >
            </li>
            <li class="space-x-2">
              <span class="font-semibold">format-pubname</span>
              <span>-</span>
              <span>helps you to automatically format publication names.</span>
            </li>
            <li class="space-x-2">
              <span class="font-semibold">api-host</span>
              <span>-</span>
              <span
                >helps you to connect Paperlib with other Apps such as Raycast,
                Obsidian etc.</span
              >
            </li>
            <li>and more...</li>
          </ul>
        </div>
        <div class="mb-2">
          For developers, we provide a rich set of APIs to help you develop your
          own extensions. You can find more information our
          <a class="underline" href="https://paperlib.app/en/extension-doc/"
            >documentation</a
          >.
        </div>

        <hr class="my-8" />
        <div class="font-bold text-xl mb-4">
          Hierarchy Folders / SmartFilters
        </div>
        <div class="mb-2">
          Paperlib 3.0 introduces a new feature called Nested Folders /
          SmartFilters. You can now create a folder inside another folder. Also,
          the smartfilters can be organised in hierarchy.
        </div>

        <hr class="my-8" />
        <div class="font-bold text-xl mb-4">And More...</div>
        <div class="mb-2">Other updates please refer to the release notes.</div>

        <hr class="my-8" />
        <div>📣 Seeking contributors 📣</div>
        <div>
          If you are interested in contributing, please
          <a class="underline" href="https://github.com/GeoffreyChen777"
            >contact me</a
          >.
        </div>
      </div>
      <div class="flex flex-col" v-else>
        <div class="mx-auto mb-8 font-semibold">
          欢迎来到全新的版本 --- Paperlib 3.0。
        </div>
        <div>在 Paperlib 3.0 中，我们为您带来了许多令人兴奋的新功能：</div>
        <ul class="list-disc px-4 mx-1">
          <li class="font-semibold">扩展插件系统</li>
          <li class="font-semibold">层级组和层级智能过滤器</li>
          <li class="font-semibold">一些 UI 重新设计</li>
          <li>和许许多多...</li>
        </ul>
        <hr class="my-8" />
        <div class="font-bold text-xl mb-4">扩展插件系统</div>
        <div class="mb-2">
          Paperlib 3.0 引入了一个新的扩展系统，允许您扩展 Paperlib
          的功能。现在您可以从扩展市场安装扩展，或者开发并发布您自己的扩展。
        </div>
        <div class="mb-2">
          <span>我们也提供了一些由官方开发维护的扩展插件，比如：</span>
          <ul class="list-disc px-4 mx-1">
            <li class="space-x-2">
              <span class="font-semibold">metadata-scrape</span>
              <span>-</span>
              <span>帮助你搜索论文的元数据。</span>
            </li>
            <li class="space-x-2">
              <span class="font-semibold">ai-summary / ai-chat</span>
              <span>-</span>
              <span
                >使用 LLM
                总结论文，给论文自动打标签，用自然语言搜索你的论文库，和 LLM
                讨论论文等。</span
              >
            </li>
            <li class="space-x-2">
              <span class="font-semibold">format-pubname</span>
              <span>-</span>
              <span>帮助你自动格式化论文的发表信息。</span>
            </li>
            <li class="space-x-2">
              <span class="font-semibold">api-host</span>
              <span>-</span>
              <span>帮助连接其他应用程序，比如 Raycast，Obsidian 等。</span>
            </li>
            <li>等等...</li>
          </ul>
        </div>
        <div class="mb-2">
          对于开发者，我们提供了一套丰富的
          API，以帮助您开发自己的扩展。您可以在我们的<a
            class="underline"
            href="https://paperlib.app/en/extension-doc/"
            >文档</a
          >中找到更多信息。
        </div>

        <hr class="my-8" />
        <div class="font-bold text-xl mb-4">层级组和层级智能过滤器</div>
        <div class="mb-2">
          Paperlib 3.0
          引入了一个新功能，层级组和层级智能过滤器。您现在可以在另一个组中创建一个子组。此外，智能过滤器也可以以层级方式组织。
        </div>

        <hr class="my-8" />
        <div class="font-bold text-xl mb-4">更多更新...</div>
        <div class="mb-2">其他更新请参阅更新日志。</div>

        <hr class="my-8" />
        <div>📣 寻求合作开发者 📣</div>
        <div>
          如果你感兴趣参与 Paperlib 的核心开发，请
          <a class="underline" href="https://github.com/GeoffreyChen777"
            >联系我</a
          >。
        </div>
      </div>

      <div
        id="whats-new-close-btn"
        class="mt-10 mx-auto flex w-60 h-10 bg-accentlight dark:bg-accentdark text-neutral-50 rounded-md shadow-md cursor-pointer"
        @click="hide"
      >
        <span class="m-auto">Go</span>
      </div>
    </div>

    <div
      class="fixed bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white dark:from-neutral-800 pointer-events-none"
    ></div>
  </div>
</template>
