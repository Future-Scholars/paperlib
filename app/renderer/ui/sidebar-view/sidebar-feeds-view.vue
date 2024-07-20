<script setup lang="ts">
import {
  BIconAppIndicator,
  BIconBroadcast,
  BIconRss,
} from "bootstrap-icons-vue";
import { Ref, inject } from "vue";

import { Feed } from "@/models/feed";
import { IFeedCollection } from "@/service/repositories/db-repository/feed-repository";

import { disposable } from "@/base/dispose";
import CollopseGroup from "./components/collopse-group.vue";
import SectionItem from "./components/section-item.vue";

const colorClass = (color?: string) => {
  switch (color) {
    case "blue":
    case null:
    case undefined:
      return "text-blue-500";
    case "red":
      return "text-red-500";
    case "green":
      return "text-green-500";
    case "yellow":
      return "text-yellow-500";
    case "purple":
      return "text-purple-500";
    case "pink":
      return "text-pink-500";
    case "orange":
      return "text-orange-500";
    case "cyan":
      return "text-cyan-500";
    default:
      return "text-blue-500";
  }
};

// ================================
// State
// ================================
const prefState = PLMainAPI.preferenceService.useState();
const uiState = PLUIAPILocal.uiStateService.useState();
const feedState = PLAPI.feedService.useState();
const processingState = PLUIAPILocal.uiStateService.processingState.useState();

// ================================
// Data
// ================================
const feeds = inject<Ref<IFeedCollection>>("feeds");

// ================================
// Event Functions
// ================================
const onSelectFeed = (feed: string) => {
  uiState.selectedFeed = feed;
};

const onItemRightClicked = (event: MouseEvent, feed: Feed) => {
  PLMainAPI.contextMenuService.showSidebarMenu(`${feed.id}`, "feed");
};

const onAddNewFeedClicked = () => {
  uiState.feedEditViewShown = true;
};

// ================================
// Register Context Menu Callbacks
// ================================
disposable(
  PLMainAPI.contextMenuService.on(
    "sidebarContextMenuDeleteClicked",
    (newValue: { value: { data: string; type: string } }) => {
      if (uiState.contentType === "feed") {
        PLAPI.feedService.delete([newValue.value.data]);
        uiState.selectedFeed = "feed-all";
      }
    }
  )
);

disposable(
  PLMainAPI.contextMenuService.on(
    "sidebarContextMenuFeedRefreshClicked",
    (newValue: { value: { data: string; type: string } }) => {
      if (uiState.contentType === "feed") {
        PLAPI.feedService.refresh([newValue.value.data]);
      }
    }
  )
);

disposable(
  PLMainAPI.contextMenuService.on(
    "sidebarContextMenuColorClicked",
    (newValue: { value: { data: string; color: string } }) => {
      if (uiState.contentType === "feed") {
        PLAPI.feedService.colorize(newValue.value.color as any, newValue.value.data);
      }
    }
  )
);
</script>

<template>
  <div>
    <SectionItem
      :name="$t('mainview.allfeeds')"
      :count="feedState.entitiesCount"
      :with-counter="prefState.showSidebarCount"
      :with-spinner="processingState.general > 0"
      :compact="prefState.isSidebarCompact"
      :active="uiState.selectedFeed === 'feed-all'"
      @click="onSelectFeed('feed-all')"
    >
      <BIconRss class="text-sm my-auto text-blue-500 min-w-[1em]" />
    </SectionItem>
    <SectionItem
      :name="$t('mainview.unread')"
      :with-counter="false"
      :with-spinner="false"
      :compact="prefState.isSidebarCompact"
      :active="uiState.selectedFeed === 'feed-unread'"
      @click="onSelectFeed('feed-unread')"
    >
      <BIconAppIndicator class="text-sm my-auto text-blue-500 min-w-[1em]" />
    </SectionItem>

    <CollopseGroup
      :title="$t('mainview.feeds')"
      :with-add="true"
      @event:add-click="onAddNewFeedClicked"
    >
      <SectionItem
        :name="feed.name"
        :count="feed.count"
        :with-counter="prefState.showSidebarCount"
        :with-spinner="false"
        :compact="prefState.isSidebarCompact"
        v-for="feed in feeds"
        :active="uiState.selectedFeed === `feed-${feed.name}`"
        @click="onSelectFeed(`feed-${feed.name}`)"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, feed)}"
      >
        <BIconBroadcast
          class="text-sm my-auto min-w-[1em]"
          :class="colorClass(feed.color)"
        />
      </SectionItem>
    </CollopseGroup>
  </div>
</template>
