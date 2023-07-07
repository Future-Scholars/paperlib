<script setup lang="ts">
import { BIconPlus } from "bootstrap-icons-vue";

import { DownloaderPreference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import DownloaderItem from "./components/downloader.vue";

const prefState = preferenceService.useState();
const viewState = MainRendererStateStore.useViewState();

const onAddNewDownloaderClicked = () => {
  const newDownloaderPref = {
    name: "newdownloader" + Math.floor(Math.random() * 100),
    description: "a custom downloader",
    enable: false,
    custom: true,
    args: "",
    priority: 1,
    preProcessCode: "",
    queryProcessCode: "",
    downloadImplCode: "",
  };

  let downloaderPrefs = prefState.downloaders;
  if (!downloaderPrefs.find((item) => item.name === newDownloaderPref.name)) {
    downloaderPrefs.push(newDownloaderPref);
  }
  preferenceService.set({ downloaders: downloaderPrefs });
  viewState.downloaderReinited = Date.now();
};

const onDeleteDownloaders = (name: string) => {
  let downloaderPrefs = prefState.downloaders;
  downloaderPrefs = downloaderPrefs.filter((item) => item.name !== name);
  preferenceService.set({ downloaders: downloaderPrefs });
  viewState.downloaderReinited = Date.now();
};

const onUpdateDownloader = (
  name: string,
  downloaderPref: DownloaderPreference
) => {
  let downloaderPrefs = prefState.downloaders;
  downloaderPrefs = downloaderPrefs.map((item) => {
    if (item.name === name) {
      return downloaderPref;
    }
    return item;
  });
  preferenceService.set({ downloaders: downloaderPrefs });
};

const onClickGuide = () => {
  fileService.open("https://github.com/Future-Scholars/paperlib/wiki/");
};
</script>

<template>
  <div class="flex flex-col w-full text-neutral-800 dark:text-neutral-300">
    <div class="text-base font-semibold mb-4">
      Paper PDF File {{ $t("preference.downloader") }}
    </div>
    <div class="flex text-xxs font-semibold">
      <div class="pl-4 w-[17%]">{{ $t("preference.downloader") }}</div>
      <div>{{ $t("preference.priority") }}</div>
      <div class="pl-2">{{ $t("preference.description") }}</div>
    </div>
    <hr class="mx-2 mb-1 dark:border-neutral-600" />
    <div class="flex flex-col px-2 rounded-md max-h-[450px] overflow-scroll">
      <DownloaderItem
        v-for="(downloaderPref, index) in prefState.downloaders"
        :key="index"
        :downloaderPref="downloaderPref"
        class="even:bg-neutral-200 even:dark:bg-neutral-700"
        @delete="onDeleteDownloaders(downloaderPref.name)"
        @update="
          (name, downloaderPref) => {
            onUpdateDownloader(name, downloaderPref);
          }
        "
      />
    </div>
    <div class="flex justify-end mt-2 px-2 space-x-2 mb-2">
      <div
        class="text-xxs my-auto underline hover:text-accentlight hover:dark:text-accentdark cursor-pointer"
        @click="onClickGuide"
      >
        Guide: Custom Downloader
      </div>
      <div
        class="flex w-8 h-6 my-auto text-center rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 hover:dark:bg-neutral-500 text-xs cursor-pointer"
        @click="onAddNewDownloaderClicked"
      >
        <BIconPlus class="m-auto text-lg" />
      </div>
    </div>
  </div>
</template>
