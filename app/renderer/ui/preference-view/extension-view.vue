<script setup lang="ts">
import {
  BIconEmojiTear,
  BIconFire,
  BIconPatchCheckFill,
  BIconSearch,
} from "bootstrap-icons-vue";
import { onMounted, ref } from "vue";
import Spinner from "../components/spinner.vue";
import ExtensionCard from "./components/extension-card.vue";
import ExtensionSetting from "./components/extension-setting.vue";

const installedExtensions = ref<{
  [id: string]: {
    id: string;
    name: string;
    version: string;
    author: string;
    verified: boolean;
    description: string;
    preference: {
      [key: string]: any;
    };
  };
}>({});

const marketExtensions = ref<{
  [id: string]: {
    id: string;
    name: string;
    version: string;
    author: string;
    verified: boolean;
    description: string;
  };
}>({});

const viewMode = ref<"installed" | "marketplace">("installed");
const isSettingShown = ref(false);
const isMarketLoading = ref(false);
const marketSearchText = ref("");
const installingExtID = ref("");

const reloadExtension = async (id: string) => {
  await PLExtAPI.extensionManagementService.reload(id);
  installedExtensions.value =
    await PLExtAPI.extensionManagementService.installedExtensions();
};

const uninstallExtension = async (id: string) => {
  await PLExtAPI.extensionManagementService.uninstall(id);
  installedExtensions.value =
    await PLExtAPI.extensionManagementService.installedExtensions();

  editingExtension.value = installedExtensions.value[id];
};

const onLocalInstallClicked = async () => {
  const pickedFolder = (await PLMainAPI.fileSystemService.showFolderPicker())
    .filePaths[0];
  if (pickedFolder) {
    await PLExtAPI.extensionManagementService.install(pickedFolder);
    installedExtensions.value =
      await PLExtAPI.extensionManagementService.installedExtensions();
  }
};

const editingExtension = ref<{
  id: string;
  name: string;
  version: string;
  author: string;
  verified: boolean;
  description: string;
  preference: {
    [key: string]: any;
  };
}>();

const editingExtensionBuffer = ref<{
  id: string;
  name: string;
  version: string;
  author: string;
  verified: boolean;
  description: string;
  preference: {
    [key: string]: any;
  };
}>();

const showSettingView = (id: string) => {
  isSettingShown.value = true;
  editingExtension.value = installedExtensions.value[id];
  editingExtensionBuffer.value = JSON.parse(
    JSON.stringify(installedExtensions.value[id])
  );
};

const updateExtensionPreference = async (key: string, value: any) => {
  if (editingExtensionBuffer.value) {
    editingExtensionBuffer.value.preference[key].value = value;
  }
};

const saveExtensionPreference = async () => {
  if (editingExtension.value && editingExtensionBuffer.value) {
    try {
      const patch = {};

      for (const [key, value] of Object.entries(
        editingExtensionBuffer.value.preference
      )) {
        if (value.value !== editingExtension.value.preference[key].value) {
          patch[key] = value.value;
        }
      }

      await PLExtAPI.extensionPreferenceService.set(
        editingExtension.value.id,
        patch
      );

      installedExtensions.value =
        await PLExtAPI.extensionManagementService.installedExtensions();
    } catch (e) {
      logService.error(
        "Failed to save extension preference",
        e as Error,
        true,
        "Extension"
      );
    }
  }

  isSettingShown.value = false;
};

const onMarketClicked = async () => {
  viewMode.value = "marketplace";
  reloadMarket();
};

const reloadMarket = async () => {
  isMarketLoading.value = true;
  marketExtensions.value =
    await PLExtAPI.extensionManagementService.listExtensionMarketplace();
  isMarketLoading.value = false;
};

const installExtension = async (id: string) => {
  installingExtID.value = id;
  try {
    await PLExtAPI.extensionManagementService.install(id);
  } catch (e) {
    logService.error(
      "Failed to install extension",
      e as Error,
      true,
      "Extension"
    );
  }

  installedExtensions.value =
    await PLExtAPI.extensionManagementService.installedExtensions();

  editingExtension.value = installedExtensions.value[id];

  installingExtID.value = "";
};

onMounted(async () => {
  installedExtensions.value =
    await PLExtAPI.extensionManagementService.installedExtensions();
});

//TODO: check all window color in dark mode
</script>

<template>
  <div
    class="flex flex-col text-neutral-800 dark:text-neutral-300 w-[400px] md:w-[500px] lg:w-[700px] h-full pb-20"
  >
    <div class="flex justify-between items-end mb-2 flex-none">
      <div class="flex space-x-2">
        <span class="text-base font-semibold my-auto">
          {{
            viewMode === "installed"
              ? $t("preference.extension")
              : $t("preference.extensionmarketplace")
          }}
        </span>
        <Spinner
          class="my-auto"
          v-if="viewMode === 'marketplace' && isMarketLoading"
        />
      </div>
      <div
        class="flex text-xs space-x-4 text-neutral-400 dark:text-neutral-500 cursor-pointer"
      >
        <div
          class="transition ease-in-out hover:text-neutral-500 dark:hover:text-neutral-300"
          :class="
            viewMode == 'installed'
              ? 'text-neutral-500 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-200'
              : ''
          "
          @click="viewMode = 'installed'"
        >
          Installed
        </div>

        <div
          class="transition ease-in-out hover:text-neutral-500 dark:hover:text-neutral-300"
          @click="onLocalInstallClicked"
        >
          Install from Local
        </div>

        <div
          class="transition ease-in-out hover:text-neutral-500 dark:hover:text-neutral-300"
          :class="
            viewMode == 'marketplace'
              ? 'text-neutral-500 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-200'
              : ''
          "
          @click="onMarketClicked"
        >
          Marketplace
        </div>
      </div>
    </div>

    <div
      class="flex space-x-2 mx-auto text-neutral-400 mt-4"
      v-if="
        Object.keys(installedExtensions).length === 0 &&
        viewMode === 'installed'
      "
    >
      <BIconEmojiTear class="my-auto" />
      <span class="my-auto text-xs">No Extension Installed</span>
    </div>

    <div class="h-full" :class="isSettingShown ? 'flex' : ''">
      <div
        class="p-2"
        :class="
          isSettingShown
            ? 'w-1/2 flex-none flex flex-col space-y-2'
            : 'grid grid-cols-2 gap-2'
        "
        v-if="viewMode == 'installed'"
      >
        <ExtensionCard
          class="h-34"
          v-for="extension in installedExtensions"
          :name="extension.name"
          :verified="extension.verified"
          :version="extension.version"
          :author="extension.author"
          :description="extension.description"
          installed
          :installing="false"
          @reload="reloadExtension(extension.id)"
          @uninstall="uninstallExtension(extension.id)"
          @setting="showSettingView(extension.id)"
        />
      </div>
      <div class="flex flex-col flex-none" v-else>
        <div class="ml-2 flex space-x-2 mt-4">
          <BIconSearch />
          <span class="text-sm font-semibold">Search</span>
        </div>

        <input
          class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none mt-2 mb-4"
          type="text"
          placeholder="Search in Marketplace"
          v-model="marketSearchText"
        />

        <div class="ml-2 flex space-x-2">
          <BIconFire />
          <span class="text-sm font-semibold">Hotest</span>
        </div>
        <div class="grid grid-cols-2 p-2 gap-2">
          <ExtensionCard
            v-for="extension in marketExtensions"
            :name="extension.name.replace('@future-scholars/', '')"
            :verified="extension.verified"
            :version="extension.version"
            :author="extension.author"
            :description="extension.description"
            :installed="false"
            :installing="installingExtID === extension.id"
            @install="installExtension(extension.id)"
          />
        </div>
      </div>

      <div class="w-1/2 my-2 flex flex-col p-2" v-if="isSettingShown">
        <div class="flex space-x-2 px-2">
          <span class="font-semibold text-sm truncate my-auto">
            {{ editingExtension?.name }}
          </span>
          <BIconPatchCheckFill
            class="my-auto text-sm"
            v-if="editingExtension?.verified"
          />
        </div>
        <div class="text-xxs text-neutral-500 truncate mb-1 px-2">
          {{ editingExtension?.version }} by {{ editingExtension?.author }}
        </div>
        <div class="text-xs text-neutral-600 line-clamp-4 mb-1 px-2">
          {{ editingExtension?.description }}
        </div>
        <div class="my-2 h-[0.5px] mx-2 bg-neutral-300" />

        <div class="px-2 overflow-scroll h-full flex flex-col space-y-6 py-4">
          <ExtensionSetting
            v-for="[key, value] of Object.entries(
              editingExtension?.preference || {}
            ).sort((a, b) => {
              return a[1].order > b[1].order ? 1 : -1;
            })"
            :title="value.name"
            :description="value.description"
            :type="value.type"
            :value="value.value"
            :options="value.options ? value.options : {}"
            @update="
              (value) => {
                updateExtensionPreference(key, value);
              }
            "
          />
        </div>

        <div class="flex justify-end space-x-2 px-2">
          <button
            class="flex h-8 w-[5.5rem] text-center rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 hover:dark:bg-neutral-600"
            @click="saveExtensionPreference"
          >
            <span class="m-auto text-xs">Save</span>
          </button>
          <button
            class="flex h-8 w-[5.5rem] text-center rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 hover:dark:bg-neutral-600"
            @click="isSettingShown = false"
          >
            <span class="m-auto text-xs">Cancel</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
