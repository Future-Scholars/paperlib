<script setup lang="ts">
import {
  BIconAppIndicator,
  BIconBroadcast,
  BIconRss,
} from "bootstrap-icons-vue";
import { Ref, inject, ref, watch } from "vue";

import { Feed } from "@/models/feed";
import { FeedResults } from "@/repositories/db-repository/feed-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import CollopseGroup from "./components/collopse-group.vue";
import SectionItem from "./components/section-item.vue";

// ================================
// State
// ================================
const viewState = MainRendererStateStore.useViewState();
const selectionState = MainRendererStateStore.useSelectionState();
const prefState = MainRendererStateStore.usePreferenceState();
const bufferState = MainRendererStateStore.useBufferState();

const isSpinnerShown = ref(false);

// ================================
// Data
// ================================
const feeds = inject<Ref<FeedResults>>("feeds");

// ================================
// Event Functions
// ================================
const onSelectFeed = (feed: string) => {
  selectionState.selectedFeed = feed;
};

const onItemRightClicked = (event: MouseEvent, feed: Feed) => {
  window.appInteractor.showContextMenu("show-sidebar-context-menu", {
    data: feed.name,
    type: "feed",
  });
};

const onAddNewFeedClicked = () => {
  const feedDraft = new Feed(true);
  bufferState.editingFeedDraft = feedDraft;
  viewState.isFeedEditViewShown = true;
};

// ================================
// Register Context Menu Callbacks
// ================================

window.appInteractor.registerMainSignal(
  "sidebar-context-menu-delete",
  (args) => {
    if (viewState.contentType === "feed") {
      window.feedInteractor.deleteFeed(args[0]);
      selectionState.selectedFeed = "feed-all";
    }
  }
);

window.appInteractor.registerMainSignal(
  "sidebar-context-menu-feed-refresh",
  (args) => {
    if (viewState.contentType === "feed") {
      window.feedInteractor.refresh([args[0]]);
    }
  }
);

window.appInteractor.registerMainSignal(
  "sidebar-context-menu-color",
  (args) => {
    if (viewState.contentType === "feed") {
      window.feedInteractor.colorizeFeed(args[2], args[0]);
    }
  }
);

watch(
  () => viewState.processingQueueCount,
  (value) => {
    if (value > 0) {
      isSpinnerShown.value = true;
    } else {
      isSpinnerShown.value = false;
    }
  }
);
</script>

<template>
  <div>
    <SectionItem
      :name="$t('mainview.allfeeds')"
      :count="viewState.feedEntitiesCount"
      :with-counter="prefState.showSidebarCount"
      :with-spinner="isSpinnerShown"
      :compact="prefState.isSidebarCompact"
      :active="selectionState.selectedFeed === 'feed-all'"
      @click="onSelectFeed('feed-all')"
    >
      <BIconRss class="text-sm my-auto text-blue-500 min-w-[1em]" />
    </SectionItem>
    <SectionItem
      :name="$t('mainview.unread')"
      :with-counter="false"
      :with-spinner="false"
      :compact="prefState.isSidebarCompact"
      :active="selectionState.selectedFeed === 'feed-unread'"
      @click="onSelectFeed('feed-unread')"
    >
      <BIconAppIndicator class="text-sm my-auto text-blue-500 min-w-[1em]" />
    </SectionItem>

    <CollopseGroup
      :title="$t('mainview.feeds')"
      :with-add="true"
      @add="onAddNewFeedClicked"
    >
      <SectionItem
        :name="feed.name"
        :count="feed.count"
        :with-counter="prefState.showSidebarCount"
        :with-spinner="false"
        :compact="prefState.isSidebarCompact"
        v-for="feed in feeds"
        :active="selectionState.selectedFeed === `feed-${feed.name}`"
        @click="onSelectFeed(`feed-${feed.name}`)"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, feed)}"
      >
        <BIconBroadcast
          class="text-sm my-auto min-w-[1em]"
          :class="{
            'text-blue-500': feed.color === 'blue' || feed.color === null,
            'text-red-500': feed.color === 'red',
            'text-green-500': feed.color === 'green',
            'text-yellow-500': feed.color === 'yellow',
          }"
        />
      </SectionItem>
    </CollopseGroup>
  </div>
</template>
