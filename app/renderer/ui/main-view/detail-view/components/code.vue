<script setup lang="ts">
import { BIconCodeSlash, BIconGithub } from "bootstrap-icons-vue";

const props = defineProps({
  codes: Object as () => Array<string>,
});

const isOfficial = (codeJSONstr: string) => {
  const code = JSON.parse(codeJSONstr) as {
    url: string;
    isOfficial: boolean;
  };
  const official = code.isOfficial ? "codeofficial" : "codecommunity";
  return official;
};

const onClick = (codeJSONstr: string) => {
  const code = JSON.parse(codeJSONstr) as {
    url: string;
    isOfficial: boolean;
  };
  window.appInteractor.open(code.url);
};
</script>

<template>
  <div class="flex flex-wrap mt-1 text-xs space-x-1">
    <div
      class="flex space-x-1 bg-neutral-200 dark:bg-neutral-700 rounded-md p-1 hover:bg-neutral-300 hover:dark:bg-neutral-600 hover:shadow-sm select-none cursor-pointer"
      v-for="code in codes"
      @click="onClick(code)"
    >
      <BIconGithub class="text-xs my-auto" v-if="code.includes('github')" />
      <BIconCodeSlash class="text-xs my-auto" v-if="!code.includes('github')" />
      <div class="text-xxs my-auto">
        {{ $t(`mainview.${isOfficial(code)}`) }}
      </div>
    </div>
  </div>
</template>
