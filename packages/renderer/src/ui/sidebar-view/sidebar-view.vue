<script setup lang="ts">
import { ref } from "vue";

import WindowControlBar from "./components/window-control-bar.vue";
import SwitcherTitle from "./components/switcher-title.vue";
import {
  PaperTag,
  PaperFolder,
} from "../../../../preload/models/PaperCategorizer";
import { Feed } from "../../../../preload/models/Feed";
import NotificationBar from "./components/notification-bar.vue";

import SidebarLibraryView from "./sidebar-library-view.vue";
import SidebarFeedsView from "./sidebar-feeds-view.vue";

const props = defineProps({
  tags: Array as () => Array<PaperTag>,
  folders: Array as () => Array<PaperFolder>,
  feeds: Array as () => Array<Feed>,
  showSidebarCount: Boolean,
  compact: Boolean,
});

const selectedView = ref(0);

const onViewSwitch = (view: number) => {
  selectedView.value = view;
  window.appInteractor.setState(
    "viewState.contentType",
    ["library", "feed"][view]
  );
  if (view === 0) {
    window.appInteractor.setState("viewState.selectedCategorizer", "lib-all");
  } else {
    window.appInteractor.setState("viewState.selectedFeed", "feed-all");
  }
};
</script>

<template>
  <div class="flex-none flex flex-col w-full h-screen justify-between">
    <WindowControlBar class="flex-none" />

    <SwitcherTitle
      class="h-7"
      :titles="['Library', 'Feeds']"
      @changed="onViewSwitch"
    />
    <SidebarLibraryView
      class="w-full h-[calc(100vh-5rem)] px-3 overflow-y-auto no-scrollbar"
      :tags="tags"
      :folders="folders"
      :showSidebarCount="showSidebarCount"
      :compact="compact"
      v-if="selectedView === 0"
    />
    <SidebarFeedsView
      class="w-full h-[calc(100vh-5rem)] px-3 overflow-y-auto no-scrollbar"
      :feeds="feeds"
      :showSidebarCount="showSidebarCount"
      :compact="compact"
      v-if="selectedView === 1"
    />
    <NotificationBar class="flex-none" />
  </div>
</template>
