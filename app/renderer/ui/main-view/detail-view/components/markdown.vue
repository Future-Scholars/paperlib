<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { BIconArrowsExpand, BIconArrowsCollapse } from "bootstrap-icons-vue";

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
    type: Array as () => Array<string>,
    required: false,
  },
});

const renderedHTML = ref("");
const isExpanded = ref(false);
const isOverflow = ref(true);

const render = async () => {
  let rendered = false;

  if (props.content) {
    renderedHTML.value = await window.renderInteractor.renderMarkdown(
      props.content.slice(4) || ""
    );
    rendered = true;
  } else {
    for (const url of props.sups || []) {
      if (url.endsWith(".md") || url.endsWith(".markdown")) {
        const mdURL = await window.appInteractor.access(url, false);
        renderedHTML.value = await window.renderInteractor.renderMarkdownFile(
          mdURL
        );
        rendered = true;
      }
    }
  }
  if (!rendered) {
    renderedHTML.value = "";
  }

  nextTick(() => {
    isOverflow.value = renderedHTML.value.length > 0;
  });
};

const markdownArea = ref();
const checkOverflow = () => {
  const el = markdownArea.value;
  if (el) {
    const height = el.offsetHeight;
    const scrollHeight = el.scrollHeight;
    isOverflow.value = height < scrollHeight;
  }
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
        @click="
          () => {
            isExpanded = !isExpanded;
            $nextTick(() => {
              checkOverflow();
            });
          }
        "
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
      class="text-xs pr-2 overflow-hidden"
      :class="isExpanded ? '' : 'max-h-96'"
      v-html="renderedHTML"
      ref="markdownArea"
    ></div>
    <div class="text-xs" v-if="isOverflow">...</div>
  </div>
</template>
