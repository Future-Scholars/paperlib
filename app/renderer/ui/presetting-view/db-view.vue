<script setup lang="ts">
const prefState = PLMainAPI.preferenceService.useState();

const onPickerClicked = async () => {
  const pickedFolder = (await PLMainAPI.fileSystemService.showFolderPicker())
    .filePaths[0];
  if (pickedFolder) {
    PLMainAPI.preferenceService.set({ appLibFolder: pickedFolder });
    PLAPI.databaseService.initialize();
  }
};
</script>

<template>
  <div class="flex flex-col">
    <div class="font-bold text-lg mb-2">{{ $t("presetting.dbintro") }}</div>

    <span class="underline text-xs mb-4">
      {{ $t("presetting.cloudintro") }}
    </span>
    <div class="flex flex-col space-y-1">
      <div class="text-sm font-semibold">
        {{ $t("preference.storagefolder") }}
      </div>
      <div class="text-xs text-neutral-600 dark:text-neutral-400">
        {{ $t("preference.storagefolderintro") }}
      </div>
      <div
        class="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 hover:dark:bg-neutral-600 cursor-pointer rounded-md px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 mb-5"
        @click="onPickerClicked"
      >
        <span class="w-full">
          {{ prefState.appLibFolder }}
        </span>
      </div>
    </div>
  </div>
</template>
