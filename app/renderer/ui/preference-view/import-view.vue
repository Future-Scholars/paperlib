<script setup lang="ts">
import { ref } from "vue";

import { eraseProtocol, listAllFiles } from "@/base/url";

const pickedFolderPath = ref("");
const zoteroCSVPath = ref("");

const onPickerClicked = async () => {
  const pickedFolder = (await PLMainAPI.fileSystemService.showFolderPicker())
    .filePaths[0];
  if (pickedFolder) {
    pickedFolderPath.value = pickedFolder;
  }
};

const onCSVPickerClicked = async () => {
  const zoteroCSV = (await PLMainAPI.fileSystemService.showFilePicker())
    .filePaths[0];
  if (zoteroCSV) {
    zoteroCSVPath.value = zoteroCSV;
  }
};

const importFromFolderClicked = async () => {
  if (pickedFolderPath.value) {
    paperService.create(listAllFiles(eraseProtocol(pickedFolderPath.value)));
  }
};

const importFromZoteroCSVClicked = async () => {
  if (zoteroCSVPath.value) {
    paperService.create([zoteroCSVPath.value]);
  }
};
</script>

<template>
  <div
    class="flex flex-col text-neutral-800 dark:text-neutral-300 w-[400px] md:w-[500px] lg:w-[700px]"
  >
    <div class="text-base font-semibold mb-4">
      {{ $t("preference.importfromafolder") }}
    </div>
    <div class="text-xxs text-neutral-600 dark:text-neutral-500">
      {{ $t("preference.importfromafolderintro") }}
    </div>
    <div class="flex justify-between">
      <div
        class="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 hover:dark:bg-neutral-600 cursor-pointer rounded-md px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 mb-5 grow mr-3"
        @click="onPickerClicked"
      >
        <span class="truncate">
          {{ pickedFolderPath ? pickedFolderPath : "Choose..." }}
        </span>
      </div>
      <button
        class="flex h-8 w-[5.5rem] text-center rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 hover:dark:bg-neutral-600"
        @click="importFromFolderClicked"
      >
        <span class="m-auto text-xs"> {{ $t("preference.import") }}</span>
      </button>
    </div>

    <hr class="mb-5 dark:border-neutral-600" />

    <div class="text-base font-semibold mb-4">
      {{ $t("preference.importfromzotero") }}
    </div>
    <div class="text-xxs text-neutral-600 dark:text-neutral-500">
      {{ $t("preference.importfromzoterointro") }}
    </div>
    <div class="flex justify-between">
      <div
        class="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 hover:dark:bg-neutral-600 cursor-pointer rounded-md px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 mb-5 grow mr-3"
        @click="onCSVPickerClicked"
      >
        <span class="truncate">
          {{ zoteroCSVPath ? zoteroCSVPath : "Choose a CSV..." }}
        </span>
      </div>
      <button
        class="flex h-8 w-[5.5rem] text-center rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 hover:dark:bg-neutral-600"
        @click="importFromZoteroCSVClicked"
      >
        <span class="m-auto text-xs"> {{ $t("preference.import") }}</span>
      </button>
    </div>
  </div>
</template>
