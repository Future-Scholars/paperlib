<script setup lang="ts">
import NotificationBar from "./components/notification-bar.vue";
import SwitcherTitle from "./components/switcher-title.vue";
import WindowControlBar from "./components/window-control-bar.vue";
import SidebarFeedsView from "./sidebar-feeds-view.vue";
import SidebarLibraryView from "./sidebar-library-view.vue";

const uiState = uiStateService.useState();

const onViewContentSwitch = (view: number) => {
  if (view === 0) {
    uiState.selectedIndex = [];
    uiState.selectedQuerySentenceId = "lib-all";
  } else {
    uiState.selectedIndex = [];
    uiState.selectedFeed = "feed-all";
  }
  uiState.contentType = ["library", "feed"][view];
};
</script>

<template>
  <div class="flex-none flex flex-col w-full h-screen justify-between">
    <WindowControlBar class="flex-none" v-if="uiState.os !== 'win32'" />
    <div class="h-6 draggable-title" v-if="uiState.os === 'win32'"></div>

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
