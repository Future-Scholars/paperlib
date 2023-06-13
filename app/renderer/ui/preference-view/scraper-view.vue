<script setup lang="ts">
import { BIconGear, BIconGripVertical, BIconPlus } from "bootstrap-icons-vue";
import { Ref, onMounted, ref, watch } from "vue";

import { ScraperPreference } from "@/preference/preference";
import { IPreferenceStore } from "@/services/preference-service";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import ScraperItem from "./components/scraper.vue";
import Toggle from "./components/toggle.vue";

const prefState = preferenceService.useState();
const viewState = MainRendererStateStore.useViewState();
const presetSelection = ref("");

const enabledScraperList: Ref<ScraperPreference[]> = ref([]);
const disabledScraperList: Ref<ScraperPreference[]> = ref([]);
const editingScraper: Ref<ScraperPreference | null> = ref(null);
const editingScraperName: Ref<string> = ref("");

const splitEnabledDisabledScraper = () => {
  enabledScraperList.value = [];
  disabledScraperList.value = [];
  for (const [name, scraper] of Object.entries(prefState.scrapers)) {
    if (scraper.enable) {
      enabledScraperList.value.push(scraper);
    } else {
      disabledScraperList.value.push(scraper);
    }
  }
  enabledScraperList.value.sort((a, b) => b.priority - a.priority);
  disabledScraperList.value.sort((a, b) => (b.category > a.category ? 1 : -1));
};

const categoryColor = (category: string) => {
  switch (category) {
    case "cs":
      return "text-blue-600";
    case "ee":
      return "text-blue-400";
    case "es":
      return "text-gray-500";
    case "phys":
      return "text-blue-900";
    case "astron / phys":
      return "text-blue-900";
    case "official":
      return "text-red-700";
    case "bio / med":
      return "text-pink-600";
    case "chem":
      return "text-orange-600";
    default:
      return "text-gray-400";
  }
};

const onDisabledChanged = (change: any) => {};

const onEnabledChanged = (change: any) => {
  let scraperPrefs = prefState.scrapers;
  for (const [index, enabledScraper] of enabledScraperList.value.entries()) {
    scraperPrefs[enabledScraper.name].priority = 1000 - index;
    scraperPrefs[enabledScraper.name].enable = true;
  }
  for (const disabledScraper of disabledScraperList.value) {
    scraperPrefs[disabledScraper.name].enable = false;
  }
  preferenceService.set({ scrapers: JSON.parse(JSON.stringify(scraperPrefs)) });
  viewState.scraperReinited = Date.now();
};

const onEditClicked = (scraper: ScraperPreference) => {
  editingScraper.value = scraper;
  editingScraperName.value = scraper.name;
};
const onAddNewScraperClicked = () => {
  const newScraperPref = {
    name: "newscraper" + Math.floor(Math.random() * 100),
    category: "custom",
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
  if (!scraperPrefs[newScraperPref.name]) {
    scraperPrefs[newScraperPref.name] = newScraperPref;
    preferenceService.set({ scrapers: scraperPrefs });
    viewState.scraperReinited = Date.now();
  }
};

const onDeleteScraper = () => {
  let scraperPrefs = prefState.scrapers;
  const newScrapers: Record<string, ScraperPreference> = {};
  for (const [name, scraper] of Object.entries(scraperPrefs)) {
    if (name !== editingScraperName.value) {
      newScrapers[name] = scraper;
    }
  }
  preferenceService.set({ scrapers: newScrapers });
  viewState.scraperReinited = Date.now();
  editingScraper.value = null;
};

const onUpdateScraper = (scraperPref: ScraperPreference) => {
  let scraperPrefs = prefState.scrapers;
  delete scraperPrefs[editingScraperName.value];
  scraperPrefs[scraperPref.name] = scraperPref;
  preferenceService.set({ scrapers: scraperPrefs });
  viewState.scraperReinited = Date.now();
  editingScraper.value = null;
};

const onUpdate = (key: keyof IPreferenceStore, value: unknown) => {
  preferenceService.set({ [key]: value });
};

const presets = {
  cs: [
    "arxiv",
    "doi",
    "dblp",
    "openreview",
    "semanticscholar",
    "crossref",
    "googlescholar",
    "pwc",
  ],
  es: [
    "doi",
    "semanticscholar",
    "scopus",
    "springer",
    "crossref",
    "googlescholar",
  ],
  phys: [
    "arxiv",
    "doi",
    "semanticscholar",
    "adsabs",
    "springer",
    "scopus",
    "spie",
    "crossref",
    "googlescholar",
  ],
  default: ["arxiv", "doi", "semanticscholar", "crossref", "googlescholar"],
};

const onChangePreset = (preset: "cs" | "es" | "phys" | "default") => {
  let scraperPrefs = prefState.scrapers;
  for (const [name, scraper] of Object.entries(scraperPrefs)) {
    scraper.enable = presets[preset].includes(name);
    scraper.priority = 1000 - presets[preset].indexOf(name);
  }
  preferenceService.set({ scrapers: scraperPrefs });
  viewState.scraperReinited = Date.now();
};

const onClickGuide = () => {
  window.appInteractor.open(
    "https://github.com/Future-Scholars/paperlib/wiki/"
  );
};

preferenceService.onChanged("scrapers", () => {
  splitEnabledDisabledScraper();
});

onMounted(() => {
  splitEnabledDisabledScraper();
});
</script>

<template>
  <div
    class="flex flex-col w-full text-neutral-800 dark:text-neutral-300 max-w-xl overflow-scroll"
  >
    <div class="text-base font-semibold mb-4">
      Metadata {{ $t("preference.scraper") }}
    </div>

    <div class="flex justify-between mb-5">
      <div class="flex flex-col max-w-[90%] mr-5">
        <div class="text-xs font-semibold">
          {{ $t("preference.preset") }}
        </div>
        <div class="text-xxs text-neutral-600 dark:text-neutral-500">
          {{ $t("preference.presetintro") }}
        </div>
      </div>
      <div class="flex">
        <select
          class="my-auto cursor-pointer bg-gray-50 border text-xxs border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-28 h-6 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          v-model="presetSelection"
          @change="
            (e) => {
              // @ts-ignore
              onChangePreset(e.target.value);
            }
          "
        >
          <option value="default">Default</option>
          <option value="cs">Computer Science</option>
          <option value="es">Earth Science</option>
          <option value="phys">Physics</option>
        </select>
      </div>
    </div>

    <div class="flex flex-col max-h-[520px] overflow-scroll px-2 mb-5">
      <div class="flex space-x-2 mb-1">
        <div class="w-1/2 text-center text-sm font-semibold">
          {{ $t("preference.available") }}
        </div>
        <div class="w-1/2 text-center text-sm font-semibold">
          {{ $t("preference.enabled") }}
        </div>
      </div>

      <div class="flex space-x-2">
        <div
          class="p-1 max-h-[255px] overflow-scroll w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded-md"
        >
          <draggable
            class="space-y-1 min-h-[332px]"
            :list="disabledScraperList"
            group="scrapers"
            itemKey="name"
            @change="onDisabledChanged"
          >
            <template #item="{ element, index }">
              <div
                class="flex bg-neutral-100 dark:bg-neutral-800 rounded-md pr-2 group"
              >
                <BIconGripVertical
                  class="my-auto text-neutral-400 dark:text-neutral-500 w-[15px] flex-none"
                />
                <BIconGear
                  class="text-xs cursor-pointer my-auto h-full w-[12px] mr-1 text-neutral-400 hidden group-hover:block"
                  @click="onEditClicked(element)"
                />
                <div class="flex flex-col grow">
                  <div class="flex justify-between text-xxs">
                    <div class="text-xxs uppercase font-semibold">
                      {{ element.name }}
                    </div>
                    <div
                      class="uppercase"
                      :class="categoryColor(element.category)"
                    >
                      {{ element.category }}
                    </div>
                  </div>
                  <div
                    class="truncate overflow-ellipsis w-48 text-xxs text-neutral-500"
                    :title="element.description"
                  >
                    {{ element.description }}
                  </div>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <div
          class="p-1 max-h-[255px] overflow-scroll w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded-md"
        >
          <draggable
            class="space-y-1 min-h-[332px]"
            :list="enabledScraperList"
            group="scrapers"
            itemKey="name"
            @change="onEnabledChanged"
          >
            <template #item="{ element, index }">
              <div
                class="flex bg-neutral-100 dark:bg-neutral-800 rounded-md pr-2 group"
              >
                <BIconGripVertical
                  class="my-auto text-neutral-400 dark:text-neutral-500 w-[15px] flex-none"
                />
                <BIconGear
                  class="text-xs cursor-pointer my-auto h-full w-[12px] mr-1 text-neutral-400 hidden group-hover:block"
                  @click="onEditClicked(element)"
                />
                <div class="flex flex-col grow">
                  <div class="flex justify-between text-xxs">
                    <div class="text-xxs uppercase font-semibold">
                      {{ element.name }}
                    </div>
                    <div
                      class="uppercase"
                      :class="categoryColor(element.category)"
                    >
                      {{ element.category }}
                    </div>
                  </div>
                  <div
                    class="truncate overflow-ellipsis w-48 text-xxs text-neutral-500"
                    :title="element.description"
                  >
                    {{ element.description }}
                  </div>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>

      <ScraperItem
        :scraperPref="editingScraper"
        v-if="editingScraper"
        @hide="editingScraper = null"
        @delete="onDeleteScraper"
        @update="onUpdateScraper"
      />

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
      <div class="text-base font-semibold mb-4">
        {{ $t("preference.routinescrape") }}
      </div>
      <Toggle
        class="mb-3"
        :title="$t('preference.enableroutionscrape')"
        :info="$t('preference.enableroutionscrapeintro')"
        :enable="prefState.allowRoutineMatch"
        @update="(value) => onUpdate('allowRoutineMatch', value)"
      />
    </div>
  </div>
</template>
