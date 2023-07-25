<script setup lang="ts">
import {
  BIconBinoculars,
  BIconBoxArrowDown,
  BIconBoxArrowInDown,
  BIconCloudArrowUp,
  BIconDownload,
  BIconGearWideConnected,
  BIconGlobe,
  BIconInfoCircle,
  BIconKeyboard,
  BIconLayoutSidebar,
  BIconViewList,
} from "bootstrap-icons-vue";
import { ref, watch } from "vue";

import { MainRendererStateStore } from "@/state/renderer/appstate";

import AboutView from "./about-view.vue";
import CloudView from "./cloud-view.vue";
import SectionItem from "./components/section-item.vue";
import DownloaderView from "./downloader-view.vue";
import ExportView from "./export-view.vue";
import GeneralView from "./general-view.vue";
import HotkeyView from "./hotkey-view.vue";
import ImportView from "./import-view.vue";
import MainviewView from "./mainview-view.vue";
import ProxyView from "./proxy-view.vue";
import ScraperView from "./scraper-view.vue";
import SidebarView from "./sidebar-view.vue";

// ==============================
// State
// ==============================
const viewState = MainRendererStateStore.useViewState();

const preferenceTab = ref("general");

const onCloseClicked = () => {
  viewState.isPreferenceViewShown = false;
};

shortcutService.register("Escape", onCloseClicked);
shortcutService.registerInInputField("Escape", onCloseClicked);
</script>

<template>
  <div
    class="fixed top-0 right-0 left-0 z-50 w-screen h-screen bg-neutral-800 dark:bg-neutral-900 bg-opacity-50 dark:bg-opacity-80"
  >
    <div class="flex justify-center items-center w-full h-full">
      <div
        class="m-auto flex bg-neutral-100 dark:bg-neutral-800 h-[650px] w-[800px] rounded-lg shadow-lg select-none space-y-2"
      >
        <div
          class="flex flex-col space-y-1 h-full w-36 rounded-l-lg px-2 py-14 border-r-[1px] dark:border-r-neutral-700"
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
            :name="$t('preference.scraper')"
            :active="preferenceTab === 'scraper'"
            @click="preferenceTab = 'scraper'"
          >
            <BIconBinoculars class="my-auto text-xs" />
          </SectionItem>
          <SectionItem
            :name="$t('preference.downloader')"
            :active="preferenceTab === 'downloader'"
            @click="preferenceTab = 'downloader'"
          >
            <BIconDownload class="my-auto text-xs" />
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
            :name="$t('preference.about')"
            :active="preferenceTab === 'about'"
            @click="preferenceTab = 'about'"
          >
            <BIconInfoCircle class="my-auto text-xs" />
          </SectionItem>
        </div>
        <div class="flex flex-col w-full pt-11 pb-4 px-8 justify-between">
          <GeneralView v-if="preferenceTab === 'general'" />
          <SidebarView v-if="preferenceTab === 'sidebar'" />
          <MainviewView v-if="preferenceTab === 'mainview'" />
          <ScraperView v-if="preferenceTab === 'scraper'" />
          <DownloaderView v-if="preferenceTab === 'downloader'" />
          <ProxyView v-if="preferenceTab === 'proxy'" />
          <CloudView v-if="preferenceTab === 'cloud'" />
          <ImportView v-if="preferenceTab === 'import'" />
          <ExportView v-if="preferenceTab === 'export'" />
          <HotkeyView v-if="preferenceTab === 'hotkey'" />

          <AboutView v-if="preferenceTab === 'about'" />
          <div class="flex justify-end space-x-2 py-1">
            <div
              class="flex w-20 h-6 rounded-md bg-neutral-300 dark:bg-neutral-600 dark:text-neutral-300 hover:shadow-sm cursor-pointer"
              @click="onCloseClicked"
            >
              <span class="m-auto text-xs">{{ $t("menu.close") }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
