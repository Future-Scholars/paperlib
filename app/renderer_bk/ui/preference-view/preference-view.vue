<script setup lang="ts">
import {
  BIconBoxArrowDown,
  BIconBoxArrowInDown,
  BIconCloudArrowUp,
  BIconGearWideConnected,
  BIconGlobe,
  BIconInfoCircle,
  BIconKeyboard,
  BIconLayoutSidebar,
  BIconPuzzle,
  BIconViewList,
} from "bootstrap-icons-vue";
import { onMounted, onUnmounted, ref } from "vue";

import { disposable } from "@/base/dispose";
import AboutView from "./about-view.vue";
import CloudView from "./cloud-view.vue";
import SectionItem from "./components/section-item.vue";
import ExportView from "./export-view.vue";
import ExtensionView from "./extension-view.vue";
import GeneralView from "./general-view.vue";
import HotkeyView from "./hotkey-view.vue";
import ImportView from "./import-view.vue";
import MainviewView from "./mainview-view.vue";
import ProxyView from "./proxy-view.vue";
import SidebarView from "./sidebar-view.vue";

// ==============================
// State
// ==============================
const uiState = uiStateService.useState();
const preferenceTab = ref("general");

const onCloseClicked = () => {
  uiState.preferenceViewShown = false;
};

disposable(
  shortcutService.updateWorkingViewScope(shortcutService.viewScope.OVERLAY)
);
disposable(shortcutService.register("Escape", onCloseClicked));

const darkMode = ref(false);
onMounted(async () => {
  darkMode.value = await PLMainAPI.windowProcessManagementService.isDarkMode();
});
</script>

<template>
  <div
    class="fixed top-0 right-0 left-0 z-40 w-screen h-screen bg-neutral-100 dark:bg-neutral-800"
  >
    <div class="h-8 w-full absolute draggable-title"></div>
    <div class="flex h-full m-auto justify-center space-x-4 py-20">
      <div class="flex flex-col justify-between flex-none overflow-y-auto">
        <div
          class="flex flex-col space-y-1 h-full w-36 rounded-l-lg pr-4 border-r-[1px] dark:border-r-neutral-700"
        >
          <SectionItem
            :name="$t('preference.general')"
            :active="preferenceTab === 'general'"
            @click="preferenceTab = 'general'"
          >
            <BIconGearWideConnected class="my-auto text-xs" />
          </SectionItem>
          <SectionItem
            :name="$t('preference.sidebar')"
            :active="preferenceTab === 'sidebar'"
            @click="preferenceTab = 'sidebar'"
          >
            <BIconLayoutSidebar class="my-auto text-xs" />
          </SectionItem>
          <SectionItem
            :name="$t('preference.mainview')"
            :active="preferenceTab === 'mainview'"
            @click="preferenceTab = 'mainview'"
          >
            <BIconViewList class="my-auto text-xs" />
          </SectionItem>
          <SectionItem
            :name="$t('preference.proxy')"
            :active="preferenceTab === 'proxy'"
            @click="preferenceTab = 'proxy'"
          >
            <BIconGlobe class="my-auto text-xs" />
          </SectionItem>
          <SectionItem
            :name="$t('preference.cloud')"
            :active="preferenceTab === 'cloud'"
            @click="preferenceTab = 'cloud'"
          >
            <BIconCloudArrowUp class="my-auto text-xs" />
          </SectionItem>
          <SectionItem
            :name="$t('preference.import')"
            :active="preferenceTab === 'import'"
            @click="preferenceTab = 'import'"
          >
            <BIconBoxArrowInDown class="my-auto text-xs" />
          </SectionItem>
          <SectionItem
            :name="$t('preference.export')"
            :active="preferenceTab === 'export'"
            @click="preferenceTab = 'export'"
          >
            <BIconBoxArrowDown class="my-auto text-xs" />
          </SectionItem>
          <SectionItem
            :name="$t('preference.hotkeys')"
            :active="preferenceTab === 'hotkey'"
            @click="preferenceTab = 'hotkey'"
          >
            <BIconKeyboard class="my-auto text-xs" />
          </SectionItem>
          <SectionItem
            :name="$t('preference.extension')"
            :active="preferenceTab === 'extension'"
            @click="preferenceTab = 'extension'"
          >
            <BIconPuzzle class="my-auto text-xs" />
          </SectionItem>
          <SectionItem
            :name="$t('preference.about')"
            :active="preferenceTab === 'about'"
            @click="preferenceTab = 'about'"
          >
            <BIconInfoCircle class="my-auto text-xs" />
          </SectionItem>
        </div>
        <div class="flex justify-end space-x-2 pr-4">
          <div
            class="flex w-20 h-6 rounded-md bg-neutral-300 dark:bg-neutral-600 dark:text-neutral-300 hover:shadow-sm cursor-pointer"
            @click="onCloseClicked"
          >
            <span class="m-auto text-xs">{{ $t("menu.close") }}</span>
          </div>
        </div>
      </div>

      <div class="overflow-auto px-6">
        <GeneralView v-if="preferenceTab === 'general'" />
        <SidebarView v-if="preferenceTab === 'sidebar'" />
        <MainviewView v-if="preferenceTab === 'mainview'" />
        <ProxyView v-if="preferenceTab === 'proxy'" />
        <CloudView v-if="preferenceTab === 'cloud'" />
        <ImportView v-if="preferenceTab === 'import'" />
        <ExportView v-if="preferenceTab === 'export'" />
        <HotkeyView v-if="preferenceTab === 'hotkey'" />
        <AboutView v-if="preferenceTab === 'about'" />
        <ExtensionView v-if="preferenceTab === 'extension'" />
      </div>
    </div>
  </div>
</template>
