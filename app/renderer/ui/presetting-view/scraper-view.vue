<script setup lang="ts">
import { BIconGripVertical } from "bootstrap-icons-vue";
import { Ref, onMounted, ref, watch } from "vue";

import { disposable } from "@/base/dispose";
import { ScraperPreference } from "@/preference/preference";

const emit = defineEmits(["close"]);

const prefState = preferenceService.useState();

const presetSelection = ref("");

const enabledScraperList: Ref<ScraperPreference[]> = ref([]);
const disabledScraperList: Ref<ScraperPreference[]> = ref([]);

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

  // TODO: reinit scraper here.
  // viewState.scraperReinited = Date.now();
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

  // TODO: reinit scraper here.
  // viewState.scraperReinited = Date.now();
};

disposable(
  preferenceService.onChanged("scrapers", () => {
    splitEnabledDisabledScraper();
  })
);

onMounted(() => {
  splitEnabledDisabledScraper();
});
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-75"
    enter-from-class="transform opacity-0"
    enter-to-class="transform opacity-100"
    leave-active-class="transition ease-in duration-75"
    leave-from-class="transform opacity-100"
    leave-to-class="transform opacity-0"
  >
    <div
      class="flex mx-auto bg-white dark:bg-neutral-800 z-50 overflow-auto dark:text-neutral-200"
    >
      <div class="m-auto space-y-5 w-[600px]">
        <div class="font-bold text-lg">{{ $t("presetting.scraperintro") }}</div>
        <div class="text-xs">{{ $t("presetting.scraperintrosub") }}</div>

        <div class="flex justify-between mb-5">
          <div class="flex flex-col max-w-[90%]">
            <div class="text-xs font-semibold">
              {{ $t("preference.preset") }}
            </div>
            <div class="text-xxs text-neutral-600 dark:text-neutral-500">
              {{ $t("preference.presetintro") }}
            </div>
          </div>
          <div>
            <select
              id="presetting-scrapers-preset-select"
              class="my-auto bg-gray-50 border text-xxs border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-28 h-6 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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
              class="p-1 max-h-[335px] overflow-scroll w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded-md"
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
                    class="flex bg-neutral-100 dark:bg-neutral-800 rounded-md pr-2"
                  >
                    <BIconGripVertical
                      class="my-auto text-neutral-400 dark:text-neutral-500 w-[15px] flex-none"
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
              class="p-1 max-h-[335px] overflow-scroll w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded-md"
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
                    class="flex bg-neutral-100 dark:bg-neutral-800 rounded-md pr-2"
                  >
                    <BIconGripVertical
                      class="my-auto text-neutral-400 dark:text-neutral-500 w-[15px] flex-none"
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

          <div class="flex justify-end space-x-2 mt-5">
            <div
              id="presetting-scraper-continue-btn"
              class="flex h-6 rounded-md bg-neutral-300 dark:bg-neutral-600 hover:shadow-sm w-20 cursor-pointer"
              @click.stop="emit('close')"
            >
              <span class="m-auto text-xs selection-none">
                {{ $t("presetting.continue") }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
