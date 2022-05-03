<script setup lang="ts">
import Options from "./components/options.vue";
import Toggle from "./components/toggle.vue";

import { PreferenceStore } from "../../../../preload/utils/preference";

const props = defineProps({
  preference: {
    type: Object as () => PreferenceStore,
    required: true,
  },
});

const onPickerClicked = async () => {
  const pickedFolder = (await window.appInteractor.showFolderPicker())
    .filePaths[0];
  if (pickedFolder) {
    window.appInteractor.updatePreference("appLibFolder", pickedFolder);
    window.entityInteractor.initDB();
  }
};

const onUpdate = (key: string, value: unknown) => {
  window.appInteractor.updatePreference(key, value);
};

const onThemeUpdate = (value: string) => {
  window.appInteractor.changeTheme(value);
  onUpdate("preferedTheme", value);
};
</script>

<template>
  <div class="flex flex-col w-full text-neutral-800 dark:text-neutral-300">
    <div class="text-base font-semibold mb-4">Paperlib Library</div>
    <div class="text-xs font-semibold">Storage Folder</div>
    <div class="text-xxs text-neutral-600 dark:text-neutral-500">
      Choose a folder to store paper files (e.g., PDF etc.) and the database
      files.
    </div>
    <div
      class="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 hover:dark:bg-neutral-600 cursor-pointer rounded-md px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 mb-5"
      @click="onPickerClicked"
    >
      <span class="truncate"> {{ preference.appLibFolder }} </span>
    </div>

    <Toggle
      title="Delete Source File"
      info="Automatically delete the source file of the imported papers."
      :enable="preference.deleteSourceFile"
      @update="(value) => onUpdate('deleteSourceFile', value)"
    />

    <hr class="mt-5 mb-5 dark:border-neutral-600" />
    <div class="text-base font-semibold mb-4">General Options</div>

    <Options
      class="mb-5"
      title="Color Theme"
      info="Choose a theme for Paperlib UI."
      :selected="preference.preferedTheme"
      :options="{ light: 'Light', dark: 'Dark', system: 'System' }"
      @update="
        (value) => {
          onThemeUpdate(value);
        }
      "
    />

    <Toggle
      class="mb-5"
      title="Invert Preview Color"
      info="Invert PDF preview colors in the detail panel if the current theme is Dark."
      :enable="preference.invertColor"
      @update="(value) => onUpdate('invertColor', value)"
    />
    <Toggle
      title="Display Count Number"
      info="Show the count badges in the sidebar."
      :enable="preference.showSidebarCount"
      @update="(value) => onUpdate('showSidebarCount', value)"
    />
  </div>
</template>
