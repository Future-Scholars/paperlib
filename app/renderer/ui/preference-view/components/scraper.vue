<script setup lang="ts">
import { PropType, ref } from "vue";

import { ScraperPreference } from "@/preference/preference";

const props = defineProps({
  scraperPref: {
    type: Object as PropType<ScraperPreference>,
    required: true,
  },
});

const scraperPrefDraft = ref(JSON.parse(JSON.stringify(props.scraperPref)));

const emit = defineEmits(["update", "delete", "hide"]);
const enabled = ref(props.scraperPref.enable);

const onApplyUpdate = () => {
  emit("update", scraperPrefDraft.value);
};
</script>

<template>
  <div
    class="flex flex-col rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 my-2"
  >
    <div class="flex justify-between py-1 px-2">
      <div class="flex space-x-2 my-auto"></div>
    </div>
    <div class="py-1 px-2 mb-2 flex flex-col space-y-1">
      <div class="flex" v-if="scraperPref.custom">
        <div class="w-[30%]">Name:</div>
        <input
          class="bg-neutral-100 dark:bg-neutral-600 focus:outline-none w-[70%] px-1 rounded-sm"
          type="text"
          v-model="scraperPrefDraft.name"
        />
      </div>
      <div class="flex" v-if="scraperPref.custom">
        <div class="w-[30%]">Description:</div>
        <input
          class="bg-neutral-100 dark:bg-neutral-600 focus:outline-none w-[70%] px-1 rounded-sm"
          type="text"
          v-model="scraperPrefDraft.description"
        />
      </div>
      <div class="flex">
        <div class="w-[30%]">Args:</div>
        <input
          class="bg-neutral-100 dark:bg-neutral-600 focus:outline-none w-[70%] px-1 rounded-sm"
          type="text"
          v-model="scraperPrefDraft.args"
        />
      </div>
      <div class="flex" v-if="scraperPref.custom">
        <div class="w-[30%]">Preprocess:</div>
        <textarea
          class="bg-neutral-100 dark:bg-neutral-600 focus:outline-none w-[70%] px-1 rounded-sm min-h-[100px] font-mono text-xxs"
          type="text"
          v-model="scraperPrefDraft.preProcessCode"
        />
      </div>
      <div class="flex" v-if="scraperPref.custom">
        <div class="w-[30%]">Parsing process:</div>
        <textarea
          class="bg-neutral-100 dark:bg-neutral-600 focus:outline-none w-[70%] px-1 rounded-sm min-h-[100px] font-mono text-xxs"
          type="text"
          v-model="scraperPrefDraft.parsingProcessCode"
        />
      </div>
      <div class="flex mb-2" v-if="scraperPref.custom">
        <div class="w-[30%]">ScrapeImpl:</div>
        <textarea
          class="bg-neutral-100 dark:bg-neutral-600 focus:outline-none w-[70%] px-1 rounded-sm min-h-[100px] font-mono text-xxs"
          type="text"
          v-model="scraperPrefDraft.scrapeImplCode"
        />
      </div>
      <div class="flex justify-end space-x-2 pt-1">
        <div
          class="hover:text-accentlight hover:dark:text-accentdark cursor-pointer"
          v-if="scraperPref.custom"
          @click="emit('delete', scraperPref.name)"
        >
          {{ $t("menu.delete") }}
        </div>

        <div
          class="hover:text-accentlight hover:dark:text-accentdark cursor-pointer"
          @click="emit('hide')"
        >
          Close
        </div>
        <div
          class="hover:text-accentlight hover:dark:text-accentdark cursor-pointer"
          @click="onApplyUpdate"
        >
          Save
        </div>
      </div>
    </div>
  </div>
</template>
