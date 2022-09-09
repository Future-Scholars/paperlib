<script setup lang="ts">
import { BIconPlus } from "bootstrap-icons-vue";

import { ScraperPreference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import ScraperItem from "./components/scraper.vue";
import Toggle from "./components/toggle.vue";

const prefState = MainRendererStateStore.usePreferenceState();
const viewState = MainRendererStateStore.useViewState();

const onAddNewScraperClicked = () => {
  const newScraperPref = {
    name: "newscraper" + Math.floor(Math.random() * 100),
    description: "a custom scraper",
    enable: false,
    custom: true,
    args: "",
    priority: 1,
    preProcessCode: "",
    parsingProcessCode: "",
    scrapeImplCode: "",
  };

  let scraperPrefs = prefState.scrapers;
  if (!scraperPrefs.find((item) => item.name === newScraperPref.name)) {
    scraperPrefs.push(newScraperPref);
  }
  window.appInteractor.setPreference("scrapers", scraperPrefs);
  viewState.scraperReinited = Date.now();
};

const onDeleteScraper = (name: string) => {
  let scraperPrefs = prefState.scrapers;
  scraperPrefs = scraperPrefs.filter((item) => item.name !== name);
  window.appInteractor.setPreference("scrapers", scraperPrefs);
  viewState.scraperReinited = Date.now();
};

const onUpdateScraper = (name: string, scraperPref: ScraperPreference) => {
  let scraperPrefs = prefState.scrapers;
  scraperPrefs = scraperPrefs.map((item) => {
    if (item.name === name) {
      return scraperPref;
    }
    return item;
  });
  window.appInteractor.setPreference("scrapers", scraperPrefs);
  viewState.scraperReinited = Date.now();
};

const onUpdate = (key: string, value: unknown) => {
  window.appInteractor.setPreference(key, value);
};

const onClickGuide = () => {
  window.appInteractor.open(
    "https://github.com/GeoffreyChen777/paperlib/wiki/"
  );
};
</script>

<template>
  <div class="flex flex-col w-full text-neutral-800 dark:text-neutral-300">
    <div class="text-base font-semibold mb-4">Metadata Scrapers</div>
    <div class="flex text-xxs font-semibold">
      <div class="pl-4 w-[17%]">Scraper</div>
      <div>Priority</div>
      <div class="pl-4">Description</div>
    </div>
    <hr class="mx-2 mb-1 dark:border-neutral-600" />
    <div class="flex flex-col px-2 rounded-md max-h-[450px] overflow-scroll">
      <ScraperItem
        v-for="(scraperPref, index) in prefState.scrapers"
        :key="index"
        :scraperPref="scraperPref"
        class="even:bg-neutral-200 even:dark:bg-neutral-700"
        @delete="onDeleteScraper(scraperPref.name)"
        @update="
          (name, scraperPref) => {
            onUpdateScraper(name, scraperPref);
          }
        "
      />
    </div>
    <div class="flex justify-end mt-2 px-2 space-x-2">
      <div
        class="text-xxs my-auto underline hover:text-accentlight hover:dark:text-accentdark cursor-pointer"
        @click="onClickGuide"
      >
        Guide: Custom Scraper
      </div>
      <div
        class="flex w-8 h-6 my-auto text-center rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 hover:dark:bg-neutral-500 text-xs cursor-pointer"
        @click="onAddNewScraperClicked"
      >
        <BIconPlus class="m-auto text-lg" />
      </div>
    </div>

    <hr class="mt-5 mb-5 dark:border-neutral-600" />
    <div class="text-base font-semibold mb-4">Routine Scrape</div>
    <Toggle
      class="mb-3"
      title="Enable Routine Rescraping"
      info="Automatically rescrape the metadata of the preprint version papers, e.g., arXiv, every week."
      :enable="prefState.allowRoutineMatch"
      @update="(value) => onUpdate('allowRoutineMatch', value)"
    />
  </div>
</template>
