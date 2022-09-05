<script setup lang="ts">
import WindowControlBar from "./components/window-control-bar.vue";
import SwitcherTitle from "./components/switcher-title.vue";
import NotificationBar from "./components/notification-bar.vue";
import SidebarLibraryView from "./sidebar-library-view.vue";
// import SidebarFeedsView from "./sidebar-feeds-view.vue";
import { MainRendererStateStore } from "@/state/renderer/appstate";

const viewState = MainRendererStateStore.useViewState();
const selectionState = MainRendererStateStore.useSelectionState();

const onViewContentSwitch = (view: number) => {
  viewState.contentType = ["library", "feed"][view];
  if (view === 0) {
    selectionState.selectedCategorizer = "lib-all";
  } else {
    selectionState.selectedFeed = "feed-all";
  }
};
</script>

<template>
  <div class="flex-none flex flex-col w-full h-screen justify-between">
    <WindowControlBar class="flex-none" />

    <SwitcherTitle
      class="h-7"
      :titles="['Library', 'Feeds']"
      @changed="onViewContentSwitch"
    />
    <SidebarLibraryView
      class="w-full h-[calc(100vh-5rem)] px-3 overflow-y-auto no-scrollbar"
      v-if="viewState.contentType === 'library'"
    />

    <!-- 
    <SidebarFeedsView
      class="w-full h-[calc(100vh-5rem)] px-3 overflow-y-auto no-scrollbar"
      :feeds="feeds"
      :showSidebarCount="showSidebarCount"
      :compact="compact"
      v-if="selectedView === 1"
    /> -->
    <NotificationBar class="flex-none" />
  </div>
</template>
