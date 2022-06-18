<script setup lang="ts">
import { ref } from "vue";
import Toggle from "./components/toggle.vue";

import { PreferenceStore } from "../../../../preload/utils/preference";

const scrapers = [
  {
    title: "PDF builtin",
    info: "Extract the PDF's builtin metadata.",
    key: "pdfBuiltinScraper",
  },
  { title: "arXiv", info: "Query from arXiv.org.", key: "arXivScraper" },
  {
    title: "DOI",
    info: "Query metadatas according to the avaliable DOI.",
    key: "doiScraper",
  },
  { title: "DBLP", info: "Query from dblp.com.", key: "dblpScraper" },
  {
    title: "Openreview",
    info: "Query from openreview.com.",
    key: "openreviewScraper",
  },
  { title: "The CVF", info: "Query from the CVF.", key: "cvfScraper" },
  {
    title: "Paper with Code",
    info: "Query the avaliable code repositories from paperwithcode.com.",
    key: "pwcScraper",
  },
  {
    title: "IEEE",
    info: "Query from IEEE xplore",
    key: "ieeeScraper",
  },
  {
    title: "Google Scholar",
    info: "Query from Google Scholar",
    key: "googlescholarScraper",
  },
];

const props = defineProps({
  preference: {
    type: Object as () => PreferenceStore,
    required: true,
  },
});

const ieeeAPIKey = ref(props.preference.ieeeAPIKey);

const onClickGuide = () => {
  window.appInteractor.open("https://developer.ieee.org/");
};

const onUpdate = (key: string, value: unknown) => {
  window.appInteractor.updatePreference(key, value);
};
</script>

<template>
  <div class="flex flex-col w-full text-neutral-800 dark:text-neutral-300">
    <div class="text-base font-semibold mb-4">Metadata Scrapers</div>
    <Toggle
      class="mb-2"
      :title="scraper.title"
      :info="scraper.info"
      :enable="preference[scraper.key] as boolean"
      v-for="scraper in scrapers"
      @update="(value) => onUpdate(scraper.key, value)"
    />

    <div class="flex justify-between">
      <div class="flex flex-col max-w-[90%]">
        <div class="text-xs font-semibold">IEEE API Key</div>
        <div class="text-xxs text-neutral-600 dark:text-neutral-500">
          Apply
          <span
            class="underline cursor-pointer text-accentlight dark:text-accentdark"
            @click="onClickGuide"
          >
            here </span
          >.
        </div>
      </div>
      <input
        class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none w-56"
        type="text"
        placeholder="IEEE API Key"
        v-model="ieeeAPIKey"
        @input="(event) => onUpdate('ieeeAPIKey', ieeeAPIKey)"
      />
    </div>

    <hr class="mt-5 mb-5 dark:border-neutral-600" />
    <div class="text-base font-semibold mb-4">Routine Scrape</div>
    <Toggle
      class="mb-3"
      title="Enable Routine Rescraping"
      info="Automatically rescrape the metadata of the preprint version papers, e.g., arXiv, every week."
      :enable="preference.allowRoutineMatch"
      @update="(value) => onUpdate('allowRoutineMatch', value)"
    />
  </div>
</template>
