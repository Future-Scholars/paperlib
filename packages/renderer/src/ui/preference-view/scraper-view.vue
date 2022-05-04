<script setup lang="ts">
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
];

const props = defineProps({
  preference: {
    type: Object as () => PreferenceStore,
    required: true,
  },
});

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
