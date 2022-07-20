<script setup lang="ts">
import { ref } from "vue";

import {
  BIconRss,
  BIconAppIndicator,
  BIconBroadcast,
} from "bootstrap-icons-vue";

import SectionItem from "./components/section-item.vue";
import CollopseGroup from "./components/collopse-group.vue";
import { Feed } from "../../../../preload/models/Feed";
import { FeedDraft } from "../../../../preload/models/FeedDraft";

const props = defineProps({
  feeds: Array as () => Array<Feed>,
  showSidebarCount: Boolean,
  compact: Boolean,
});

const feedEntitiesCount = ref(
  window.appInteractor.getState("viewState.feedEntitiesCount") as number
);
const selectedFeed = ref("feed-all");
const isSpinnerShown = ref(false);

const onSelectFeed = (feed: string) => {
  window.appInteractor.setState("selectionState.selectedFeed", feed);
};

const onAddNewFeedClicked = () => {
  window.appInteractor.setState(
    "sharedData.editFeedDraft",
    JSON.stringify(new FeedDraft(true))
  );
  window.appInteractor.setState("viewState.isFeedEditViewShown", true);
};

const deleteFeed = (feed: string) => {
  window.feedInteractor.delete(feed.replaceAll("feed-", ""));
};

const refreshFeed = (feed: string) => {
  window.feedInteractor.refresh(feed);
};

const onItemRightClicked = (event: MouseEvent, feed: string) => {
  window.appInteractor.showContextMenu("show-sidebar-context-menu", feed);
};

window.appInteractor.registerMainSignal(
  "sidebar-context-menu-delete",
  (args) => {
    deleteFeed(args);
  }
);

window.appInteractor.registerMainSignal(
  "sidebar-context-menu-feed-refresh",
  (args) => {
    refreshFeed(args.replaceAll("feed-", ""));
  }
);

window.appInteractor.registerState(
  "viewState.processingQueueCount",
  (value) => {
    const processingQueueCount = JSON.parse(value as string) as number;
    if (processingQueueCount > 0) {
      isSpinnerShown.value = true;
    } else {
      isSpinnerShown.value = false;
    }
  }
);

window.appInteractor.registerState("viewState.feedEntitiesCount", (value) => {
  feedEntitiesCount.value = JSON.parse(value as string) as number;
});

window.appInteractor.registerState("selectionState.selectedFeed", (value) => {
  selectedFeed.value = value as string;
});

const onDbClicked = () => {
  window.feedInteractor.deleteOutdatedFeedEntities();
};
</script>

<template>
  <div>
    <SectionItem
      name="All Feeds"
      :count="feedEntitiesCount"
      :with-counter="showSidebarCount"
      :with-spinner="isSpinnerShown"
      :compact="compact"
      :active="selectedFeed === 'feed-all'"
      @click="onSelectFeed('feed-all')"
    >
      <BIconRss class="text-sm my-auto text-blue-500 min-w-[1em]" />
    </SectionItem>
    <SectionItem
      name="Unread"
      :with-counter="false"
      :with-spinner="false"
      :compact="compact"
      :active="selectedFeed === 'feed-unread'"
      @click="onSelectFeed('feed-unread')"
    >
      <BIconAppIndicator class="text-sm my-auto text-blue-500 min-w-[1em]" />
    </SectionItem>
    <CollopseGroup title="Feeds" :with-add="true" @add="onAddNewFeedClicked">
      <SectionItem
        :name="feed.name"
        :count="feed.count"
        :with-counter="showSidebarCount"
        :with-spinner="false"
        :compact="compact"
        v-for="feed in feeds"
        :active="selectedFeed === `feed-${feed.name}`"
        @click="onSelectFeed(`feed-${feed.name}`)"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, `feed-${feed.name}`)}"
        @dblclick="onDbClicked"
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
