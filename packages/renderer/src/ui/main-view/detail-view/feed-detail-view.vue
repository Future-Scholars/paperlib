<script setup lang="ts">
import { ref, watch } from "vue";
// @ts-ignore
import { BIconPlus, BIconCheck2 } from "bootstrap-icons-vue";

import { FeedEntity } from "../../../../../preload/models/FeedEntity";

import Section from "./components/section.vue";
import Authors from "./components/authors.vue";
import PubDetails from "./components/pub-details.vue";
import Spinner from "../../sidebar-view/components/spinner.vue";

const props = defineProps({
  feedEntity: {
    type: Object as () => FeedEntity | null,
    required: false,
  },
  feedEntityAddingStatus: {
    type: Number,
    required: true,
  },
});

const emits = defineEmits([
  "add-clicked",
  "read-timeout",
  "read-timeout-in-unread",
]);

const onAddClicked = () => {
  if (props.feedEntityAddingStatus === 0) {
    window.appInteractor.setState(
      "viewState.processInformation",
      "Adding to Library..."
    );
    emits("add-clicked");
  }
};

const timeoutID = ref();

const debounce = (fn: Function, delay: number) => {
  return () => {
    clearTimeout(timeoutID.value);
    // @ts-ignore
    var that = this;
    timeoutID.value = setTimeout(function () {
      fn.apply(that, null);
    }, delay);
  };
};

const onReadTimeout = () => {
  if (
    window.appInteractor.getState("selectionState.selectedFeed") !==
    "feed-unread"
  ) {
    debounce(() => {
      emits("read-timeout");
    }, 2000)();
  } else {
    debounce(() => {
      emits("read-timeout-in-unread");
    }, 10000)();
  }
};

watch(props, (props, prevProps) => {
  onReadTimeout();
});
</script>

<template>
  <div
    id="detail-view"
    class="flex-none flex flex-col w-80 max-h-[calc(100vh-3rem)] pl-4 pr-2 pb-4 overflow-auto"
  >
    <div
      class="flex mr-2 mb-4 h-8 bg-accentlight dark:bg-accentdark text-neutral-50 rounded-md shadow-md cursor-pointer hover:shadow-lg"
      @click="onAddClicked"
    >
      <div
        class="m-auto h-8 flex space-x-1"
        v-if="feedEntityAddingStatus === 0"
      >
        <BIconPlus class="my-auto" />
        <span class="my-auto text-xs select-none">Add to Library</span>
      </div>
      <div
        class="m-auto h-8 flex space-x-2"
        v-if="feedEntityAddingStatus === 1"
      >
        <Spinner class="my-auto" />
        <span class="my-auto text-xs select-none">Adding...</span>
      </div>
      <div
        class="m-auto h-8 flex space-x-1"
        v-if="feedEntityAddingStatus === 2"
      >
        <BIconCheck2 class="my-auto" />
        <span class="my-auto text-xs select-none">Added</span>
      </div>
    </div>
    <div class="text-md font-bold">
      {{ feedEntity?.title }}
    </div>

    <Section title="Feed Name">
      <div class="text-xxs">
        {{ feedEntity?.feed.name }}
      </div>
    </Section>

    <Section title="Authors" v-if="feedEntity?.authors">
      <Authors :authors="feedEntity?.authors" />
    </Section>
    <PubDetails
      :publication="feedEntity?.publication"
      :volume="feedEntity?.volume"
      :pages="feedEntity?.pages"
      :number="feedEntity?.number"
      :publisher="feedEntity?.publisher"
    />
    <Section title="Publication Year">
      <div class="text-xxs">
        {{ feedEntity?.pubTime }}
      </div>
    </Section>
    <Section title="Add Time">
      <div class="text-xxs">
        {{ feedEntity?.feedTime.toLocaleString() }}
      </div>
    </Section>
    <Section title="Abstract" v-if="feedEntity?.abstract" class="pr-3">
      <div class="text-xxs text-justify">
        {{ feedEntity?.abstract }}
      </div>
    </Section>
    <div class="w-40 h-10">&nbsp;</div>
    <div
      class="fixed bottom-0 w-80 h-10 bg-gradient-to-t from-white dark:from-neutral-800"
    ></div>
  </div>
</template>
