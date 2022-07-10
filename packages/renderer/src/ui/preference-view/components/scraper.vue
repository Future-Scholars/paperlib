<script setup lang="ts">
import { Switch } from "@headlessui/vue";
import { PropType, ref } from "vue";

import { ScraperPreference } from "../../../../../preload/utils/preference";

const props = defineProps({
  scraperPref: {
    type: Object as PropType<ScraperPreference>,
    required: true,
  },
});

const scraperPrefDraft = ref(JSON.parse(JSON.stringify(props.scraperPref)));

const showEdit = ref(false);

const emit = defineEmits(["update", "delete"]);
const enabled = ref(props.scraperPref.enable);

const onApplyUpdate = () => {
  showEdit.value = false;
  emit(
    "update",
    props.scraperPref.name,
    JSON.parse(JSON.stringify(scraperPrefDraft.value))
  );
};
</script>

<template>
  <div
    class="flex flex-col rounded-md text-xs"
    :class="showEdit ? 'bg-neutral-200 dark:bg-neutral-700 my-2' : ''"
  >
    <div class="flex justify-between py-1 px-2">
      <div class="flex w-[80%] space-x-2">
        <div
          class="font-semibold w-[22%] overflow-hidden text-ellipsis pr-1 my-auto"
        >
          {{ scraperPref.name }}
        </div>

        <div
          class="text-right text-neutral-600 w-[5%] dark:text-neutral-500 overflow-hidden text-ellipsis pr-1 my-auto"
        >
          {{ scraperPref.priority }}
        </div>

        <div
          class="w-[70%] text-neutral-600 dark:text-neutral-500 overflow-hidden text-ellipsis pr-1"
        >
          {{ scraperPref.description }}
        </div>
      </div>

      <div class="flex space-x-2 my-auto">
        <div
          class="hover:text-accentlight hover:dark:text-accentdark cursor-pointer"
          v-if="!showEdit"
          @click="showEdit = true"
        >
          Edit
        </div>
        <div v-if="scraperPref.custom && !showEdit">|</div>
        <div
          class="hover:text-accentlight hover:dark:text-accentdark cursor-pointer"
          v-if="scraperPref.custom"
          @click="emit('delete', scraperPref.name)"
        >
          Remove
        </div>
        <input
          type="checkbox"
          value=""
          :checked="enabled"
          class="w-[14px] h-[14px] my-auto accent-neutral-500"
          @change="
            () => {
              scraperPrefDraft.enable = !scraperPrefDraft.enable;
              onApplyUpdate();
            }
          "
        />
      </div>
    </div>
    <div class="py-1 px-2 mb-2 flex flex-col space-y-1" v-if="showEdit">
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
      <div class="flex">
        <div class="w-[30%]">Priority: (restart required)</div>
        <input
          class="bg-neutral-100 dark:bg-neutral-600 focus:outline-none w-[70%] px-1 rounded-sm"
          type="number"
          v-model="scraperPrefDraft.priority"
        />
      </div>
      <div class="flex" v-if="scraperPref.custom">
        <div class="w-[30%]">Preprocess:</div>
        <textarea
          class="bg-neutral-100 dark:bg-neutral-600 focus:outline-none w-[70%] px-1 rounded-sm min-h-[100px]"
          type="text"
          v-model="scraperPrefDraft.preProcessCode"
        />
      </div>
      <div class="flex" v-if="scraperPref.custom">
        <div class="w-[30%]">Parsing process:</div>
        <textarea
          class="bg-neutral-100 dark:bg-neutral-600 focus:outline-none w-[70%] px-1 rounded-sm min-h-[100px]"
          type="text"
          v-model="scraperPrefDraft.parsingProcessCode"
        />
      </div>
      <div class="flex mb-2" v-if="scraperPref.custom">
        <div class="w-[30%]">ScrapeImpl: (restart required)</div>
        <textarea
          class="bg-neutral-100 dark:bg-neutral-600 focus:outline-none w-[70%] px-1 rounded-sm min-h-[100px]"
          type="text"
          v-model="scraperPrefDraft.scrapeImplCode"
        />
      </div>
      <div class="flex justify-end space-x-2 pt-1">
        <div
          class="hover:text-accentlight hover:dark:text-accentdark cursor-pointer"
          @click="showEdit = false"
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
