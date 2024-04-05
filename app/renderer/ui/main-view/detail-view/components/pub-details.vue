<script setup lang="ts">
import { BIconLink } from "bootstrap-icons-vue";
import { ref } from "vue";
import { shell } from "electron";

const props = defineProps({
  publication: String,
  volume: String,
  pages: String,
  number: String,
  publisher: String,
  arxiv: String,
  doi: String,
});

const isExpanded = ref(false);
</script>

<template>
  <div class="pt-3">
    <div class="text-xxs text-neutral-400 dark:text-neutral-500 select-none">
      {{ $t("mainview.publication") }}
    </div>
    <div
      class="group text-xxs cursor-pointer"
      @click="
        () => {
          if (volume || pages || number || publisher) {
            isExpanded = !isExpanded;
          }
        }
      "
    >
      {{ publication }}
      <span
        class="hidden group-hover:block"
        v-if="(volume || pages || number || publisher) && !isExpanded"
        >»</span
      >
    </div>
    <div
      class="group text-xxs cursor-pointer space-x-3"
      v-if="isExpanded"
      @click="isExpanded = !isExpanded"
    >
      <span v-if="volume"
        ><span class="italic">volume: </span>{{ volume }}</span
      >
      <span v-if="pages"><span class="italic">pages: </span>{{ pages }}</span>
      <span v-if="number">
        <span class="italic">issue/number: </span>{{ number }}
      </span>
      <span v-if="publisher">
        <span class="italic">publisher: </span>{{ publisher }}
      </span>
      <span class="invisible group-hover:visible">«</span>
    </div>
    <div class="flex gap-1 my-1">
        <div 
          class="max-w-12 flex space-x-1 bg-neutral-200 dark:bg-neutral-700 rounded-md p-1 hover:bg-neutral-300 hover:dark:bg-neutral-600 hover:shadow-sm select-none cursor-pointer text-md"
          v-if="arxiv"
          @click="() => shell.openExternal(`https://arxiv.org/abs/${arxiv}`)"
        >
          <BIconLink class="text-xs my-auto" />
          <div class="text-xxs my-auto">Arxiv</div>
        </div>
        <div 
          class="max-w-12 flex space-x-1 bg-neutral-200 dark:bg-neutral-700 rounded-md p-1 hover:bg-neutral-300 hover:dark:bg-neutral-600 hover:shadow-sm select-none cursor-pointer text-md"
          v-if="doi"
          @click="() => shell.openExternal(`https://doi.org/${doi}`)"
        >
          <BIconLink class="text-xs my-auto" />
          <div class="text-xxs my-auto">DOI</div>
        </div>
      </div>
  </div>
</template>
