<script setup lang="ts">
import { ref } from "vue";

import {
  BIconGearWideConnected,
  BIconLayoutSidebar,
  BIconBinoculars,
  BIconCloudArrowUp,
  BIconBoxArrowDown,
  BIconBoxArrowInDown,
  BIconGlobe,
  BIconKeyboard,
  BIconInfoCircle,
} from "bootstrap-icons-vue";

import SectionItem from "./components/section-item.vue";
import GeneralView from "./general-view.vue";
import SidebarView from "./sidebar-view.vue";
import ScraperView from "./scraper-view.vue";
import CloudView from "./cloud-view.vue";
import AboutView from "./about-view.vue";
import ExportView from "./export-view.vue";
import ProxyView from "./proxy-view.vue";
import ImportView from "./import-view.vue";
import HotkeyView from "./hotkey-view.vue";

import { PreferenceStore } from "../../../../preload/utils/preference";

defineProps({
  preference: {
    type: Object as () => PreferenceStore,
    required: true,
  },
});

const isPreferenceViewShown = ref(false);
const preferenceTab = ref("general");

const onCloseClicked = () => {
  window.appInteractor.setState("viewState.isPreferenceViewShown", false);
};

window.appInteractor.registerState(
  "viewState.isPreferenceViewShown",
  (value) => {
    isPreferenceViewShown.value = value as boolean;
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
      v-if="isPreferenceViewShown"
    >
      <div class="flex justify-center items-center w-full h-full">
        <div
          class="m-auto flex bg-neutral-100 dark:bg-neutral-800 min-h-[600px] w-[750px] rounded-lg shadow-lg select-none space-y-2"
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
              name="Scraper"
              :active="preferenceTab === 'scraper'"
              @click="preferenceTab = 'scraper'"
            >
              <BIconBinoculars class="my-auto text-xs" />
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
            <GeneralView
              :preference="preference"
              v-if="preferenceTab === 'general'"
            />
            <SidebarView
              :preference="preference"
              v-if="preferenceTab === 'sidebar'"
            />
            <ScraperView
              :preference="preference"
              v-if="preferenceTab === 'scraper'"
            />
            <ProxyView
              :preference="preference"
              v-if="preferenceTab === 'proxy'"
            />
            <CloudView
              :preference="preference"
              v-if="preferenceTab === 'cloud'"
            />
            <ImportView
              :preference="preference"
              v-if="preferenceTab === 'import'"
            />
            <ExportView
              :preference="preference"
              v-if="preferenceTab === 'export'"
            />
            <HotkeyView
              :preference="preference"
              v-if="preferenceTab === 'hotkey'"
            />
            <AboutView
              :preference="preference"
              v-if="preferenceTab === 'about'"
            />
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
