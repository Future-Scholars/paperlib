<script setup lang="ts">
import { ref } from "vue";

import { IPreferenceStore } from "@/common/services/preference-service";
import { APPTheme } from "@/main/services/window-process-management-service";

import Options from "./components/options.vue";
import PathPicker from "./components/path-picker.vue";
import Toggle from "./components/toggle.vue";

const prefState = preferenceService.useState();

const updatePrefs = (key: keyof IPreferenceStore, value: unknown) => {
  preferenceService.set({ [key]: value });
};

const onThemeUpdated = (value: APPTheme) => {
  PLMainAPI.windowProcessManagementService.changeTheme(value);
  updatePrefs("preferedTheme", value);
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

const customRenamingFormat = ref(prefState.customRenamingFormat);
const customRenamingFormatPreview = ref(
  getCustomRenamingFormatPreview(prefState.customRenamingFormat)
);

const onCustomRenamingFormatUpdate = (payload: Event) => {
  let formatedFileName = "";
  try {
    formatedFileName = getCustomRenamingFormatPreview(
      customRenamingFormat.value
    );
    updatePrefs("customRenamingFormat", customRenamingFormat.value);
  } catch (e) {
    console.error(e);
  }
  customRenamingFormatPreview.value = formatedFileName
    ? formatedFileName + "_"
    : "";
};

const onRenameAllClicked = () => {
  paperService.renameAll();
};

const onChangePDFViewer = async (pdfViewer: string) => {
  if (pdfViewer === "custom") {
    const pickedViewer = (await PLMainAPI.fileSystemService.showFilePicker())
      .filePaths[0];
    if (pickedViewer) {
      updatePrefs("selectedPDFViewer", "custom");
      updatePrefs("selectedPDFViewerPath", pickedViewer);
    }
  } else {
    updatePrefs("selectedPDFViewer", "default");
  }
};

const getPDFViewerName = (pdfViewerPath: string) => {
  if (prefState.selectedPDFViewer === "default") {
    return "";
  } else {
    return pdfViewerPath.split("/").pop();
  }
};

const onChangeLanguage = (language: string) => {
  updatePrefs("language", language);
};
</script>

<template>
  <div
    class="flex flex-col text-neutral-800 dark:text-neutral-300 w-[400px] md:w-[500px] lg:w-[700px]"
  >
    <div class="text-base font-semibold mb-4">
      Paperlib {{ $t("preference.library") }}
    </div>
    <div class="text-xs font-semibold">
      {{ $t("preference.storagefolder") }}
    </div>
    <div class="text-xxs text-neutral-600 dark:text-neutral-500">
      {{ $t("preference.storagefolderintro") }}
    </div>

    <PathPicker
      type="folder"
      :picked-path="prefState.appLibFolder"
      @event:picked-path="updatePrefs('appLibFolder', $event)"
    />

    <Options
      class="mb-5"
      :title="$t('preference.sourcefileopration')"
      :info="$t('preference.sourcefileoprationintro')"
      :selected="prefState.sourceFileOperation"
      :options="{
        cut: 'Cut',
        copy: 'Copy',
        link: 'Symlink',
      }"
      @update="
        (value) => {
          updatePrefs('sourceFileOperation', value);
        }
      "
    />

    <Options
      class="mb-5"
      :title="$t('preference.renamingformat')"
      info="Full: FullTitle_id.pdf; Short: FirstCharTitle_id.pdf; A-T: Author-Title_id.pdf"
      :selected="prefState.renamingFormat"
      :options="{
        short: 'Short',
        full: 'Full',
        authortitle: 'A-T',
        custom: 'Custom',
      }"
      @update="
        (value) => {
          updatePrefs('renamingFormat', value);
        }
      "
    />

    <div
      class="flex space-x-2 justify-between mb-1"
      v-if="prefState.renamingFormat === 'custom'"
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
      v-if="prefState.renamingFormat === 'custom'"
    >
      ⓘ <b>Avaliable components:</b> title, firstchartitle, author, firstname,
      lastname, year, publication <br />
      &nbsp;&nbsp;&nbsp; <b>Example:</b> {lastname}{year}-{firstchartitle} -->
      he2022-MAE_id.pdf
    </div>
    <div
      class="text-xxs text-neutral-600 dark:text-neutral-500 w-[550px] flex pl-3"
      v-if="prefState.renamingFormat === 'custom'"
    >
      <div><b>Preview:</b> &nbsp;</div>
      <div class="grow">{{ customRenamingFormatPreview }}id.pdf</div>
    </div>

    <hr class="mt-5 mb-5 dark:border-neutral-600" />
    <div class="text-base font-semibold mb-4">
      {{ $t("preference.generaloptions") }}
    </div>

    <div class="flex justify-between mb-5">
      <div class="flex flex-col max-w-[90%]">
        <div class="text-xs font-semibold">
          {{ $t("preference.language") }}
        </div>
        <div class="text-xxs text-neutral-600 dark:text-neutral-500">
          {{ $t("preference.pleaserestart") }}
        </div>
      </div>
      <div>
        <select
          id="language"
          class="my-auto bg-gray-50 border text-xxs border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-28 h-6 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          v-model="prefState.language"
          @change="
            (e) => {
              // @ts-ignore
              onChangeLanguage(e.target.value);
            }
          "
        >
          <option value="en-GB">en-GB</option>
          <option value="zh-CN">zh-CN</option>
        </select>
      </div>
    </div>

    <Options
      class="mb-5"
      :title="$t('preference.colortheme')"
      :info="$t('preference.colorthemeintro')"
      :selected="prefState.preferedTheme"
      :options="{
        light: $t('preference.light'),
        dark: $t('preference.dark'),
        system: $t('preference.system'),
      }"
      @update="
        (value) => {
          onThemeUpdated(value);
        }
      "
    />

    <Toggle
      class="mb-5"
      :title="$t('preference.invertpreviewcolor')"
      :info="$t('preference.invertpreviewcolorintro')"
      :enable="prefState.invertColor"
      @update="(value) => updatePrefs('invertColor', value)"
    />

    <div class="flex justify-between mb-5">
      <div class="flex flex-col max-w-[90%]">
        <div class="text-xs font-semibold">
          {{ $t("preference.openpdfwith") }}
        </div>
        <div class="text-xxs text-neutral-600 dark:text-neutral-500">
          {{ $t("preference.openpdfwithintro") }}
          {{ getPDFViewerName(prefState.selectedPDFViewerPath) }}
        </div>
      </div>
      <div>
        <select
          id="countries"
          class="my-auto bg-gray-50 border text-xxs border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-28 h-6 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          v-model="prefState.selectedPDFViewer"
          @change="
            (e) => {
              // @ts-ignore
              onChangePDFViewer(e.target.value);
            }
          "
        >
          <option value="default">{{ $t("preference.default") }}</option>
          <option value="custom">{{ $t("preference.custom") }}</option>
        </select>
      </div>
    </div>
  </div>
</template>
