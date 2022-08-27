<script setup lang="ts">
import { ref } from "vue";
import Options from "./components/options.vue";
import Toggle from "./components/toggle.vue";

import { PreferenceStore } from "../../../../preload/utils/preference";

const props = defineProps({
  preference: {
    type: Object as () => PreferenceStore,
    required: true,
  },
});

const customRenamingFormat = ref(props.preference.customRenamingFormat);
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

const getCustomRenamingFormatPreview = (customRenamingFormat: string) => {
  const title = "Masked Autoencoders Are Scalable Vision Learners";
  const firstchartitle = "MAASVL";
  const author = "Kaiming He";
  const year = "2022";
  const lastname = "He";
  const firstname = "Kaiming";
  const publication = "CVPR";

  return customRenamingFormat
    .replaceAll("{title}", title)
    .replaceAll("{firstchartitle}", firstchartitle)
    .replaceAll("{author}", author)
    .replaceAll("{year}", year)
    .replaceAll("{lastname}", lastname)
    .replaceAll("{firstname}", firstname)
    .replaceAll("{publication}", publication);
};

const customRenamingFormatPreview = ref(
  getCustomRenamingFormatPreview(customRenamingFormat.value)
);

const onCustomRenamingFormatUpdate = (payload: Event) => {
  let formatedFileName = "";
  try {
    formatedFileName = getCustomRenamingFormatPreview(
      customRenamingFormat.value
    );
    window.appInteractor.updatePreference(
      "customRenamingFormat",
      customRenamingFormat.value
    );
  } catch (e) {
    console.error(e);
  }
  customRenamingFormatPreview.value = formatedFileName
    ? formatedFileName + "_"
    : "";
};

const onRenameAllClicked = () => {
  window.entityInteractor.renameAll();
};

const selectedPDFViewer = ref(props.preference.selectedPDFViewer);
const selectedPDFViewerPath = ref(
  window.appInteractor.filename(props.preference.selectedPDFViewerPath)
);

const checkPDFViewerPreference = () => {
  if (selectedPDFViewer.value === "default") {
    selectedPDFViewerPath.value = "";
  }
};

checkPDFViewerPreference();

const onChangePDFViewer = async (pdfViewer: string) => {
  if (pdfViewer === "custom") {
    const pickedViewer = (await window.appInteractor.showFilePicker())
      .filePaths[0];
    if (pickedViewer) {
      window.appInteractor.updatePreference("selectedPDFViewer", "custom");
      window.appInteractor.updatePreference(
        "selectedPDFViewerPath",
        pickedViewer
      );
      selectedPDFViewerPath.value = window.appInteractor.filename(pickedViewer);
    } else {
      selectedPDFViewer.value = props.preference.selectedPDFViewer;
    }
  } else {
    window.appInteractor.updatePreference("selectedPDFViewer", "default");
  }

  checkPDFViewerPreference();
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
      <span class="w-full">
        {{ preference.appLibFolder }}
      </span>
    </div>

    <Toggle
      class="mb-5"
      title="Delete Source File"
      info="Automatically delete the source file of the imported papers."
      :enable="preference.deleteSourceFile"
      @update="(value) => onUpdate('deleteSourceFile', value)"
    />

    <Options
      class="mb-5"
      title="Renaming Format"
      info="Full: FullTitle_id.pdf; Short: FirstCharTitle_id.pdf; A-T: Author-Title_id.pdf"
      :selected="preference.renamingFormat"
      :options="{
        short: 'Short',
        full: 'Full',
        authortitle: 'A-T',
        custom: 'Custom',
      }"
      @update="
        (value) => {
          onUpdate('renamingFormat', value);
        }
      "
    />

    <div
      class="flex space-x-2 justify-between mb-1"
      v-if="preference.renamingFormat === 'custom'"
    >
      <input
        class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none grow text-neutral-700 dark:text-neutral-300"
        type="text"
        placeholder="Custom Format"
        v-model="customRenamingFormat"
        @input="onCustomRenamingFormatUpdate"
      />
      <button
        class="flex h-full text-xs px-2 my-auto text-center rounded-md bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-600 hover:dark:bg-neutral-500"
        @click="onRenameAllClicked"
      >
        <span class="m-auto">Rename All files</span>
      </button>
    </div>
    <div
      class="text-xxs text-neutral-600 dark:text-neutral-500"
      v-if="preference.renamingFormat === 'custom'"
    >
      ⓘ <b>Avaliable components:</b> title, firstchartitle, author, firstname,
      lastname, year, publication <br />
      &nbsp;&nbsp;&nbsp; <b>Example:</b> {lastname}{year}-{firstchartitle} -->
      he2022-MAE_id.pdf
    </div>
    <div
      class="text-xxs text-neutral-600 dark:text-neutral-500 w-[550px] flex pl-3"
      v-if="preference.renamingFormat === 'custom'"
    >
      <div><b>Preview:</b> &nbsp;</div>
      <div class="grow">{{ customRenamingFormatPreview }}id.pdf</div>
    </div>

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

    <div class="flex justify-between">
      <div class="flex flex-col max-w-[90%]">
        <div class="text-xs font-semibold">Open PDF with</div>
        <div class="text-xxs text-neutral-600 dark:text-neutral-500">
          Use {{ selectedPDFViewer }} viewer to open PDF files.
          {{ selectedPDFViewerPath }}
        </div>
      </div>
      <div>
        <select
          id="countries"
          class="my-auto bg-gray-50 border text-xxs border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-28 h-6 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          v-model="selectedPDFViewer"
          @change="
            (e) => {
              // @ts-ignore
              onChangePDFViewer(e.target.value);
            }
          "
        >
          <option value="default">Default</option>
          <option value="custom">Custom</option>
        </select>
      </div>
    </div>
  </div>
</template>
