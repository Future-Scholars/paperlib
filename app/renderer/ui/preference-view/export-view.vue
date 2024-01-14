<script setup lang="ts">
import { BIconArrowRight, BIconPlus } from "bootstrap-icons-vue";
import { Ref, onMounted, ref } from "vue";

import { IPreferenceStore } from "@/common/services/preference-service";

import Replacement from "./components/replacement.vue";
import Toggle from "./components/toggle.vue";
import { PaperFilterOptions } from "@/renderer/services/paper-service";

const newReplacementFrom = ref("");
const newReplacementTo = ref("");

const prefState = preferenceService.useState();

const updatePref = (key: keyof IPreferenceStore, value: unknown) => {
  preferenceService.set({ [key]: value });
};

const onReplacementAdd = () => {
  // Remove duplicates
  let replacements = prefState.exportReplacement.filter(
    (item) => item.from !== newReplacementFrom.value
  );
  // Add new replacement
  replacements.push({
    from: newReplacementFrom.value,
    to: newReplacementTo.value,
  });
  // Update preference
  preferenceService.set({ exportReplacement: replacements });

  newReplacementFrom.value = "";
  newReplacementTo.value = "";
};

const onReplacementDelete = (replacement: { from: string; to: string }) => {
  // Remove
  let replacements = prefState.exportReplacement.filter(
    (item) => item.from !== replacement.from && item.to !== replacement.to
  );
  // Update preference
  preferenceService.set({ exportReplacement: replacements });
};

const selectedCSLStyle = ref(prefState.selectedCSLStyle);
const CSLStyles = ref([]) as Ref<{ key: string; name: string }[]>;

const onCSLStyleUpdate = async (CSLStyle: string) => {
  if (CSLStyle === "import-from-folder") {
    const pickedImportedCSLStylesPath = (
      await PLMainAPI.fileSystemService.showFolderPicker()
    ).filePaths[0];
    if (pickedImportedCSLStylesPath) {
      preferenceService.set({
        importedCSLStylesPath: pickedImportedCSLStylesPath,
      });
      loadCSLStyles();
    }
  } else {
    updatePref("selectedCSLStyle", CSLStyle);
  }
};

const loadCSLStyles = async () => {
  CSLStyles.value = await referenceService.loadCSLStyles();
};

const csvExportPath = ref("");
const onExportPathPickerClick = async () => {
  const pickedFolder = (
    await PLMainAPI.fileSystemService.showFolderPicker()
  ).filePaths[0];
  if (pickedFolder) {
    csvExportPath.value = pickedFolder;
  }
};
const exportCSVClicked = async () => {
  if (csvExportPath.value) {
    const paperCollection = await paperService.load(
      new PaperFilterOptions({}),
      "title",
      "asce"
    );
    const csv = await referenceService.exportCSV(Array.from(paperCollection));
    const filePath = csvExportPath.value + `/paperlib_CSV_${Date.now()}.csv`;
    PLMainAPI.fileSystemService.writeToFile(
      filePath,
      csv,
    );
  }
};


onMounted(() => {
  loadCSLStyles();
});
</script>

<template>
  <div
    class="flex flex-col text-neutral-800 dark:text-neutral-300 w-[400px] md:w-[500px] lg:w-[700px]"
  >
    <div class="text-base font-semibold mb-4">
      {{ $t("preference.export") }}
    </div>

    <div class="flex justify-between">
      <div class="flex flex-col max-w-[90%]">
        <div class="text-xs font-semibold">
          CSL (Citation Style Language) Style
        </div>
        <div class="text-xxs text-neutral-600 dark:text-neutral-500">
          {{ $t("preference.cslstyleintro") }}
        </div>
      </div>
      <div>
        <select
          id="countries"
          class="my-auto cursor-pointer bg-gray-50 border text-xxs border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-48 h-6 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          v-model="selectedCSLStyle"
          @change="
            (e) => {
              // @ts-ignore
              onCSLStyleUpdate(e.target.value);
            }
            "
        >
          <option value="import-from-folder">
            {{ $t("preference.importfromafolder") }}
          </option>
          <option :value="csl.key" v-for="csl of CSLStyles">
            {{ csl.name }}
          </option>
        </select>
      </div>
    </div>

    <hr class="my-5 dark:border-neutral-600" />

    <Toggle
      class="mb-2"
      :title="$t('preference.exportreplacement')"
      :info="$t('preference.exportreplacementintro')"
      :enable="prefState.enableExportReplacement"
      @event:change="(value) => updatePref('enableExportReplacement', value)"
    />

    <div class="flex space-x-1 mb-2">
      <input
        class="p-2 w-full rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none my-auto"
        type="text"
        placeholder="Source Publication"
        v-model="newReplacementFrom"
      />
      <BIconArrowRight class="my-auto w-6" />
      <input
        class="p-2 w-full rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none my-auto"
        type="text"
        placeholder="Target Publication"
        v-model="newReplacementTo"
      />
      <div
        class="flex h-8 w-20 my-auto text-center rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 hover:dark:bg-neutral-500 text-xs cursor-pointer"
        @click="onReplacementAdd"
      >
        <BIconPlus class="m-auto text-lg" />
      </div>
    </div>

    <div
    class="flex flex-col bg-neutral-200 dark:bg-neutral-700 rounded-md h-[240px] max-h-[240px] overflow-y-auto mb-5"
    >
      <Replacement
      :from="replacement.from"
      :to="replacement.to"
      v-for="replacement of prefState.exportReplacement"
        @event:delete="onReplacementDelete(replacement)"
        />
    </div>

    <hr class="my-5 dark:border-neutral-600" />

    <div class="text-base font-semibold mb-4">
      {{ $t("preference.exportcsv") }}
    </div>
    <div class="text-xxs text-neutral-600 dark:text-neutral-500">
      {{ $t("preference.exportcsvintro") }}
    </div>
    <div class="flex justify-between">
      <div
        class="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 hover:dark:bg-neutral-600 cursor-pointer rounded-md px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 mb-5 grow mr-3"
        @click="onExportPathPickerClick">
        <span class="truncate">
          {{ csvExportPath ? csvExportPath : "Choose a CSV export path..." }}
        </span>
      </div>
      <button
        class="flex h-8 w-[5.5rem] text-center rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 hover:dark:bg-neutral-600"
        @click="exportCSVClicked">
        <span class="m-auto text-xs"> {{ $t("preference.export") }}</span>
      </button>
    </div>
  </div>
</template>
