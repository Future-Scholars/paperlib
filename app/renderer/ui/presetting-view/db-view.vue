<script setup lang="ts">
import { MainRendererStateStore } from "@/state/renderer/appstate";

const emit = defineEmits(["close"]);

const viewState = MainRendererStateStore.useViewState();
const prefState = MainRendererStateStore.usePreferenceState();

const onPickerClicked = async () => {
  const pickedFolder = (await window.appInteractor.showFolderPicker())
    .filePaths[0];
  if (pickedFolder) {
    window.appInteractor.setPreference("appLibFolder", pickedFolder);
    viewState.realmReiniting = Date.now();
  }
};
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
      <div class="m-auto space-y-5 w-[400px]">
        <div class="font-bold text-lg">{{ $t("presetting.dbintro") }}</div>

        <div class="flex flex-col space-y-1">
          <div class="text-xs font-semibold">
            {{ $t("preference.storagefolder") }}
          </div>
          <div class="text-xxs text-neutral-600 dark:text-neutral-500">
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
        <span class="underline text-xxs">
          {{ $t("presetting.cloudintro") }}
        </span>

        <div class="flex justify-end space-x-2">
          <div
            class="flex h-6 rounded-md bg-neutral-300 dark:bg-neutral-600 hover:shadow-sm w-20 selection-none"
            @click.stop="emit('close')"
          >
            <span class="m-auto text-xs cursor-pointer">
              {{ $t("presetting.continue") }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
