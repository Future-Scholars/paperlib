<script setup lang="ts">
import NotificationBar from "./components/notification-bar.vue";
import SwitcherTitle from "./components/switcher-title.vue";
import WindowControlBar from "./components/window-control-bar.vue";
import SidebarFeedsView from "./sidebar-feeds-view.vue";
import SidebarLibraryView from "./sidebar-library-view.vue";
import { onMounted, ref, watch } from "vue";
import darkLogo from "@/renderer/assets/logo-dark.png";
import lightLogo from "@/renderer/assets/logo-light.png";

const uiState = uiStateService.useState();

const onViewContentSwitch = (view: number) => {
  if (view === 0) {
    uiState.selectedIndex = [];
    uiState.selectedQuerySentenceIds = ["lib-all"];
    uiState.querySentencesSidebar = [];
  } else {
    uiState.selectedIndex = [];
    uiState.selectedFeed = "feed-all";
  }
  uiState.contentType = ["library", "feed"][view];
};

const darkMode = ref(false);
onMounted(async () => {
  darkMode.value = await PLMainAPI.windowProcessManagementService.isDarkMode();
});
preferenceService.on("preferedTheme", async () => {
  darkMode.value = await PLMainAPI.windowProcessManagementService.isDarkMode();
});
</script>

<template>
  <div class="flex-none flex flex-col w-full h-screen justify-between">
    <WindowControlBar class="flex-none" v-if="uiState.os !== 'win32'" />
    <div
      class="h-16 draggable-title flex w-full pl-6"
      v-if="uiState.os === 'win32'"
    >
      <div class="flex-row flex items-center space-x-3">
        <img class="w-4" :src="darkMode ? darkLogo : lightLogo" />
        <span class="text-sm font-semibold">PAPERLIB</span>
      </div>
    </div>

    <SwitcherTitle
      class="h-7"
      :titles="[$t('mainview.library'), $t('mainview.feeds')]"
      @changed="onViewContentSwitch"
    />

    <SidebarLibraryView
      class="w-full h-[calc(100vh-5rem)] px-2 overflow-y-auto no-scrollbar"
      v-if="uiState.contentType === 'library'"
    />
    <SidebarFeedsView
      class="w-full h-[calc(100vh-5rem)] px-2 overflow-y-auto no-scrollbar"
      v-if="uiState.contentType === 'feed'"
    />

    <NotificationBar class="flex-none" />
  </div>
</template>
