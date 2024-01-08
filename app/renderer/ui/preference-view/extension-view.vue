<script setup lang="ts">
import { Process } from "@/base/process-id";
import {
  BIconEmojiTear,
  BIconFire,
  BIconGlobe,
  BIconPatchCheckFill,
  BIconSearch,
} from "bootstrap-icons-vue";
import { onMounted, onUnmounted, ref } from "vue";
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
    homepage?: string;
    preference: Map<
      string,
      {
        name: string;
        description: string;
        type: string;
        value: any;
        options?: Record<string, string>;
      }
    >;
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
const isMarketHotShown = ref(true);
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
  homepage?: string;
  preference: Map<
    string,
    {
      name: string;
      description: string;
      type: string;
      value: any;
      options?: Record<string, string>;
    }
  >;
}>();

const listenCallbacks: (() => void)[] = [];
const showSettingView = async (id: string) => {
  const PLExtAPIExposed = await rendererRPCService.waitForAPI(
    Process.extension,
    "PLExtAPI",
    5000
  );

  if (!PLExtAPIExposed) {
    logService.warn("Extension process is not ready.", "", true, "UIPref");
    return;
  }

  editingExtension.value = installedExtensions.value[id];

  editingExtension.value.preference =
    await PLExtAPI.extensionPreferenceService.getAllMetadata(id);

  for (const [key, value] of editingExtension.value.preference.entries()) {
    listenCallbacks.push(
      PLExtAPI.extensionPreferenceService.onChanged(
        `${id}:${key}`,
        (newValue) => {
          editingExtension.value?.preference.set(key, newValue.value);
        }
      )
    );
  }

  isSettingShown.value = true;
};

const updateExtensionPreference = async (key: string, value: any) => {
  if (editingExtension.value) {
    try {
      const patch = {
        [key]: value,
      };
      await PLExtAPI.extensionPreferenceService.set(
        editingExtension.value.id,
        patch
      );
    } catch (e) {
      logService.error(
        "Failed to save extension preference",
        e as Error,
        true,
        "Extension"
      );
    }
  }
};

const onCloseExtensionPreferenceClicked = async () => {
  isSettingShown.value = false;
  editingExtension.value = undefined;
  for (const callback of listenCallbacks) {
    callback();
  }
  listenCallbacks.length = 0;
};

const onMarketClicked = async () => {
  viewMode.value = "marketplace";
  reloadMarket();
};

const reloadMarket = async () => {
  isMarketLoading.value = true;
  marketExtensions.value =
    await PLExtAPI.extensionManagementService.listExtensionMarketplace(
      marketSearchText.value
    );

  if (marketSearchText.value.length === 0) {
    isMarketHotShown.value = true;
  } else {
    isMarketHotShown.value = false;
  }
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

  installingExtID.value = "";
};

const onOpenHomepageClicked = async (homepage?: string) => {
  if (homepage && homepage.match(/^(https?|ftp):\/\//)) {
    await PLAPI.fileService.open(homepage);
  }
};

onMounted(async () => {
  installedExtensions.value =
    await PLExtAPI.extensionManagementService.installedExtensions();
});

onUnmounted(() => {
  onCloseExtensionPreferenceClicked();
});
</script>

<template>
  <div
    class="flex flex-col text-neutral-800 dark:text-neutral-300 w-[400px] md:w-[500px] lg:w-[700px] h-full"
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
          :homepage="extension.homepage"
          installed
          :installing="false"
          @event:homepageclicked="onOpenHomepageClicked(extension.homepage)"
          @event:reload="reloadExtension(extension.id)"
          @event:uninstall="uninstallExtension(extension.id)"
          @event:setting="showSettingView(extension.id)"
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
          @change="reloadMarket"
          @input="if (marketSearchText.length === 0) reloadMarket();"
        />

        <div class="ml-2 flex space-x-2" v-if="isMarketHotShown">
          <BIconFire />
          <span class="text-sm font-semibold">Hotest</span>
        </div>
        <div class="ml-2 flex space-x-2" v-else>
          <BIconGlobe />
          <span class="text-sm font-semibold">Results</span>
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
            @event:install="installExtension(extension.id)"
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
        <div
          class="text-xxs text-neutral-500 dark:text-neutral-400 truncate mb-1 px-2"
        >
          {{ editingExtension?.version }} by {{ editingExtension?.author }}
        </div>
        <div
          class="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-4 mb-1 px-2"
        >
          {{ editingExtension?.description }}
        </div>
        <div class="my-2 h-[0.5px] mx-2 bg-neutral-300 dark:bg-neutral-600" />

        <div class="px-2 overflow-scroll h-full flex flex-col py-4 space-y-3">
          <div
            v-for="(keypref, index) in editingExtension?.preference.entries() ||
            []"
          >
            <ExtensionSetting
              :pref="keypref[1]"
              @event:change="
                (value) => {
                  updateExtensionPreference(keypref[0], value);
                }
              "
            />
          </div>
        </div>

        <div class="flex justify-end space-x-2 px-2">
          <button
            class="flex h-6 w-[5.5rem] text-center rounded-md bg-neutral-200 dark:bg-neutral-600"
            @click="onCloseExtensionPreferenceClicked"
          >
            <span class="m-auto text-xs">{{ $t("menu.close") }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
