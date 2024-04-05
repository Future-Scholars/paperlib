<script setup lang="ts">
import { defineProps } from "vue";
import { BIconCodeSlash, BIconGithub, BIconLink } from "bootstrap-icons-vue";
const props = defineProps({
  codes: Object as () => Array<string>,
  arxiv: String,
  doi: String,
});

const isCodeOfficial = (codeJSONstr: string) => {
  const code = JSON.parse(codeJSONstr) as {
    url: string;
    isOfficial: boolean;
  };
  const official = code.isOfficial ? "codeofficial" : "codecommunity";
  return official;
};

const onLinkClick = (url: string) => {
  fileService.open(url);
};

const onCodeClick = (codeJSONstr: string) => {
  const code = JSON.parse(codeJSONstr) as {
    url: string;
    isOfficial: boolean;
  };
  fileService.open(code.url);
};
</script>

<template>
      <div class="flex flex-wrap mt-1 text-xs">
        <div 
          class="flex space-x-1 bg-neutral-200 dark:bg-neutral-700 rounded-md p-1 hover:bg-neutral-300 hover:dark:bg-neutral-600 hover:shadow-sm select-none cursor-pointer mb-1 mr-1"
          v-if="arxiv"
          @click="onLinkClick(`https://arxiv.org/abs/${arxiv.toLowerCase().replaceAll('arxiv:', '').trim()}`)"
        >
          <BIconLink class="text-xs my-auto" />
          <div class="text-xxs my-auto">arXiv</div>
        </div>
        <div 
          class="flex space-x-1 bg-neutral-200 dark:bg-neutral-700 rounded-md p-1 hover:bg-neutral-300 hover:dark:bg-neutral-600 hover:shadow-sm select-none cursor-pointer mb-1 mr-1"
          v-if="doi"
          @click="onLinkClick(`https://doi.org/${doi}`)"
        >
          <BIconLink class="text-xs my-auto" />
          <div class="text-xxs my-auto">DOI</div>
        </div>
        <div
          class="flex space-x-1 bg-neutral-200 dark:bg-neutral-700 rounded-md p-1 hover:bg-neutral-300 hover:dark:bg-neutral-600 hover:shadow-sm select-none cursor-pointer mb-1 mr-1"
          v-for="code in codes"
          @click="onCodeClick(code)"
        >
          <BIconGithub class="text-xs my-auto" v-if="code.includes('github')" />
          <BIconCodeSlash class="text-xs my-auto" v-if="!code.includes('github')" />
          <div class="text-xxs my-auto">
            {{ $t(`mainview.${isCodeOfficial(code)}`) }}
          </div>
        </div>
    </div>
</template>