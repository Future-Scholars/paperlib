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

const keyDownListener = (e: KeyboardEvent) => {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement
  ) {
    if (e.key === "Escape") {
      onCloseClicked();
    }
    return true;
  }

  e.preventDefault();
  if (e.key === "Escape") {
    onCloseClicked();
  }
};

watch(
  () => viewState.isPreferenceViewShown,
  (value) => {
    if (value) {
      document.addEventListener("keydown", keyDownListener, { once: true });
    }
  }
);
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
      class="fixed top-0 right-0 left-0 z-50 w-screen h-screen bg-neutral-800 dark:bg-neutral-900 bg-opacity-50 dark:bg-opacity-80"
      v-if="viewState.isPreferenceViewShown"
    >
      <div class="flex justify-center items-center w-full h-full">
        <div
          class="m-auto flex bg-neutral-100 dark:bg-neutral-800 min-h-[600px] min-w-[750px] rounded-lg shadow-lg select-none space-y-2"
        >
          <div
            class="flex flex-col space-y-1 h-full w-36 rounded-l-lg px-2 py-14 border-r-[1px] dark:border-r-neutral-700"
          >
            <SectionItem
              name="General"
              :active="preferenceTab === 'general'"
              @click="preferenceTab = 'general'"
            >
              <BIconGearWideConnected class="my-auto text-xs" />
            </SectionItem>
            <SectionItem
              name="Sidebar"
              :active="preferenceTab === 'sidebar'"
              @click="preferenceTab = 'sidebar'"
            >
              <BIconLayoutSidebar class="my-auto text-xs" />
            </SectionItem>
            <SectionItem
              name="Mainview"
              :active="preferenceTab === 'mainview'"
              @click="preferenceTab = 'mainview'"
            >
              <BIconViewList class="my-auto text-xs" />
            </SectionItem>
            <SectionItem
              name="Scraper"
              :active="preferenceTab === 'scraper'"
              @click="preferenceTab = 'scraper'"
            >
              <BIconBinoculars class="my-auto text-xs" />
            </SectionItem>
            <SectionItem
              name="Downloader"
              :active="preferenceTab === 'downloader'"
              @click="preferenceTab = 'downloader'"
            >
              <BIconDownload class="my-auto text-xs" />
            </SectionItem>
            <SectionItem
              name="Proxy"
              :active="preferenceTab === 'proxy'"
              @click="preferenceTab = 'proxy'"
            >
              <BIconGlobe class="my-auto text-xs" />
            </SectionItem>
            <SectionItem
              name="Cloud"
              :active="preferenceTab === 'cloud'"
              @click="preferenceTab = 'cloud'"
            >
              <BIconCloudArrowUp class="my-auto text-xs" />
            </SectionItem>
            <SectionItem
              name="Import"
              :active="preferenceTab === 'import'"
              @click="preferenceTab = 'import'"
            >
              <BIconBoxArrowInDown class="my-auto text-xs" />
            </SectionItem>
            <SectionItem
              name="Export"
              :active="preferenceTab === 'export'"
              @click="preferenceTab = 'export'"
            >
              <BIconBoxArrowDown class="my-auto text-xs" />
            </SectionItem>
            <SectionItem
              name="Hotkeys"
              :active="preferenceTab === 'hotkey'"
              @click="preferenceTab = 'hotkey'"
            >
              <BIconKeyboard class="my-auto text-xs" />
            </SectionItem>
            <SectionItem
              name="About"
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
            <div class="flex justify-end space-x-2">
              <div
                class="flex w-24 h-8 rounded-lg bg-neutral-300 dark:bg-neutral-600 dark:text-neutral-300 hover:shadow-sm"
                @click="onCloseClicked"
              >
                <span class="m-auto text-xs">Close</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
