<script setup lang="ts">
import {
  BIconFlagFill,
  BIconFolder,
  BIconStarFill,
  BIconTag,
} from "bootstrap-icons-vue";
import { PropType } from "vue";

import { PaperEntity } from "@/models/paper-entity";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { getCategorizerString, getPubTypeString } from "@/utils/string";

const props = defineProps({
  item: {
    type: Object as PropType<PaperEntity>,
    required: true,
  },
  showPubTime: {
    type: Boolean,
    default: true,
  },
  showPublication: {
    type: Boolean,
    default: true,
  },
  showRating: {
    type: Boolean,
    default: false,
  },
  showPubType: {
    type: Boolean,
    default: false,
  },
  showTags: {
    type: Boolean,
    default: false,
  },
  showFolders: {
    type: Boolean,
    default: false,
  },
  showFlag: {
    type: Boolean,
    default: true,
  },
  showNote: {
    type: Boolean,
    default: false,
  },
  active: Boolean,
  read: {
    type: Boolean,
    default: true,
  },
});

const prefState = MainRendererStateStore.usePreferenceState();
</script>

<template>
  <div
    class="flex flex-col h-[4rem] w-full p-2 rounded-md select-none cursor-pointer"
    :class="active ? 'bg-accentlight dark:bg-accentdark' : ''"
  >
    <div class="flex space-x-2">
      <div
        class="my-auto h-1.5 w-1.5 rounded-md"
        :class="active ? 'bg-red-400' : 'bg-red-500 '"
        v-if="!read"
      />
      <div
        class="text-[0.84rem] leading-[1.1rem] font-semibold truncate overflow-hidden"
        :class="active ? 'text-white' : ''"
      >
        {{ item.title }}
      </div>
    </div>
    <div
      class="text-[0.7rem] leading-[0.9rem] truncate overflow-hidden"
      :class="active ? 'text-white' : ''"
    >
      {{ item.authors }}
    </div>
    <div
      class="text-[0.7rem] leading-[0.9rem] text-neutral-400 flex space-x-2"
      :class="active ? 'text-neutral-300' : ''"
    >
      <div v-if="showPubTime">{{ item.pubTime }}</div>
      <div
        class="flex space-x-2 text-ellipsis overflow-hidden shrink"
        v-if="showPublication"
      >
        <div>|</div>
        <div class="italic truncate">
          {{ item.publication }}
        </div>
      </div>
      <div class="flex space-x-2" v-if="showPubType">
        <div>|</div>
        <div class="">
          {{ getPubTypeString(item.pubType) }}
        </div>
      </div>

      <div class="flex space-x-2" v-if="showTags && item.tags.length > 0">
        <div>|</div>
        <BIconTag
          class="my-auto min-w-[11px]"
          style="margin-right: -5px !important"
        />
        <div class="truncate overflow-hidden">
          {{
            getCategorizerString(
              item.tags,
              prefState.sidebarSortBy,
              prefState.sidebarSortOrder
            )
          }}
        </div>
      </div>

      <div class="flex space-x-2" v-if="showFolders && item.folders.length > 0">
        <div>|</div>
        <BIconFolder
          v-if="item.folders.length > 0 && showFolders"
          class="my-auto min-w-[11px]"
          style="margin-right: -5px !important"
        />
        <div class="truncate overflow-hidden">
          {{
            getCategorizerString(
              item.folders,
              prefState.sidebarSortBy,
              prefState.sidebarSortOrder
            )
          }}
        </div>
      </div>

      <div class="flex space-x-2" v-if="showRating && item.rating > 0">
        <div>|</div>
        <div class="flex text-xxxs">
          <BIconStarFill v-for="_ in item.rating" class="my-auto mr-[1px]" />
        </div>
      </div>

      <div class="flex space-x-2" v-if="showFlag && item.flag">
        <div>|</div>
        <div class="flex">
          <BIconFlagFill class="m-auto text-xxs" />
        </div>
      </div>

      <div
        class="flex space-x-2 shrink text-ellipsis overflow-hidden"
        v-if="showNote && item.note"
      >
        <div>|</div>
        <div class="truncate underline">
          {{ item.note }}
        </div>
      </div>
    </div>
  </div>
</template>
