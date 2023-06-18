<script setup lang="ts">
import { BIconArrowsCollapse, BIconArrowsExpand } from "bootstrap-icons-vue";
import { nextTick, onMounted, ref, watch } from "vue";

const props = defineProps({
  title: {
    type: String,
    reqiored: true,
  },
  content: {
    type: String,
    required: false,
  },
  sups: {
    type: Object as () => Array<string>,
    required: false,
  },
});

const renderedHTML = ref("");
const isExpanded = ref(false);
const isOverflow = ref(true);

const render = async (renderFull = false) => {
  let rendered = false;

  if (props.content) {
    const { renderedStr, overflow } =
      await window.renderInteractor.renderMarkdown(
        props.content.slice(4) || "",
        renderFull
      );
    renderedHTML.value = renderedStr;
    rendered = true;
    isOverflow.value = overflow;
  } else {
    for (const url of props.sups || []) {
      if (url.endsWith(".md") || url.endsWith(".markdown")) {
        const mdURL = await fileService.access(url, true);
        const { renderedStr, overflow } =
          await window.renderInteractor.renderMarkdownFile(mdURL, renderFull);
        renderedHTML.value = renderedStr;
        rendered = true;
        isOverflow.value = overflow;
      }
    }
  }
  if (!rendered) {
    renderedHTML.value = "";
    isOverflow.value = false;
  }
};

const markdownArea = ref();

const onExpandClicked = async () => {
  await render(!isExpanded.value);
  isExpanded.value = !isExpanded.value;
};

onMounted(() => {
  render();
});

watch(props, (props, prevProps) => {
  render();
});
</script>

<template>
  <div class="flex flex-col group" v-if="renderedHTML">
    <div class="flex justify-between mt-2">
      <div
        class="text-xxs text-neutral-400 dark:text-neutral-500 select-none my-auto"
      >
        {{ title }}
      </div>

      <div
        class="invisible group-hover:visible hover:bg-neutral-300 hover:dark:bg-neutral-700 hover:drop-shadow-sm rounded-md p-1 cursor-pointer my-auto"
        @click="onExpandClicked"
      >
        <BIconArrowsExpand
          class="text-xxs text-neutral-400 dark:text-neutral-500"
          v-if="!isExpanded"
        />
        <BIconArrowsCollapse
          class="text-xxs text-neutral-400 dark:text-neutral-500"
          v-if="isExpanded"
        />
      </div>
    </div>
    <div
      id="detail-markdown-preview"
      class="text-xs pr-2 overflow-hidden break-words"
      :class="isExpanded ? '' : 'max-h-96'"
      v-html="renderedHTML"
      ref="markdownArea"
    ></div>
    <div class="text-xs" v-if="isOverflow">...</div>
  </div>
</template>
