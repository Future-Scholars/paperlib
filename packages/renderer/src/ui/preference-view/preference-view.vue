<script setup lang="ts">
import { PropType, ref } from "vue";

import {
  BIconGearWideConnected,
  BIconBinoculars,
  BIconCloudArrowUp,
  BIconBoxArrowDown,
  BIconInfoCircle,
} from "bootstrap-icons-vue";

import SectionItem from "./components/section-item.vue";
import GeneralView from "./general-view.vue";

const isPreferenceViewShown = ref(false);
const preferenceTab = ref("general");

const onCloseClicked = () => {
  window.appInteractor.setState("viewState.isPreferenceViewShown", false);
};

const onSaveClicked = async () => {
  window.appInteractor.setState("viewState.isPreferenceViewShown", false);
};

window.appInteractor.registerState(
  "viewState.isPreferenceViewShown",
  (value) => {
    isPreferenceViewShown.value = JSON.parse(value as string) as boolean;
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
      class="fixed top-0 right-0 left-0 z-50 w-screen h-screen bg-neutral-800 bg-opacity-50"
      v-if="isPreferenceViewShown"
    >
      <div class="flex justify-center items-center w-full h-full">
        <div
          class="m-auto flex bg-neutral-100 h-[550px] w-[700px] rounded-lg shadow-lg select-none space-y-2"
        >
          <div
            class="flex flex-col space-y-1 h-full w-36 rounded-l-lg px-2 py-14 bg-neutral-300"
          >
            <SectionItem
              name="General"
              :active="preferenceTab === 'general'"
              @click="preferenceTab = 'general'"
            >
              <BIconGearWideConnected class="my-auto text-xs" />
            </SectionItem>
            <SectionItem
              name="Scraper"
              :active="preferenceTab === 'scraper'"
              @click="preferenceTab = 'scraper'"
            >
              <BIconBinoculars class="my-auto text-xs" />
            </SectionItem>
            <SectionItem
              name="Cloud"
              :active="preferenceTab === 'cloud'"
              @click="preferenceTab = 'cloud'"
            >
              <BIconCloudArrowUp class="my-auto text-xs" />
            </SectionItem>
            <SectionItem
              name="Export"
              :active="preferenceTab === 'export'"
              @click="preferenceTab = 'export'"
            >
              <BIconBoxArrowDown class="my-auto text-xs" />
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
            <div class="flex justify-end space-x-2">
              <div
                class="flex w-24 h-8 rounded-lg bg-neutral-300 hover:shadow-sm"
                @click="onCloseClicked"
              >
                <span class="m-auto text-xs">Cancel</span>
              </div>
              <div
                class="flex w-24 h-8 rounded-lg bg-accentlight hover:shadow-sm"
                @click="onSaveClicked"
              >
                <span class="m-auto text-xs text-white">Save</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
