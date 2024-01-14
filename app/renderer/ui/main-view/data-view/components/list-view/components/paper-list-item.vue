<script setup lang="ts">
import {
  BIconFlagFill,
  BIconFolder,
  BIconStarFill,
  BIconTag,
} from "bootstrap-icons-vue";
import { PropType } from "vue";

import { getCategorizerString, getPubTypeString } from "@/base/string";
import { PaperEntity } from "@/models/paper-entity";

const props = defineProps({
  item: {
    type: Object as PropType<PaperEntity>,
    required: true,
  },
  fieldEnable: {
    type: Object as PropType<Partial<Record<keyof PaperEntity, boolean>>>,
    required: true,
    default: {
      pubTime: true,
      publication: true,
      pubType: false,
      rating: true,
      tags: false,
      folders: false,
      flag: true,
      note: false,
    },
  },
  active: {
    type: Boolean,
    default: false,
  },
  categorizerSortBy: {
    type: String,
    default: "name",
  },
  categorizerSortOrder: {
    type: String,
    default: "asce",
  },
  height: {
    type: Number,
    default: 64,
  },
});
</script>

<style>
scp {
  font-variant: small-caps;
  font-size: 0.6rem;
}
</style>

<template>
  <div
    class="flex flex-col w-full p-2 rounded-md select-none cursor-pointer"
    :class="
      active
        ? `bg-accentlight dark:bg-accentdark h-[${height}px]`
        : `h-[${height}px]`
    "
  >
    <div class="flex space-x-2">
      <!-- <div
        class="my-auto h-1.5 w-1.5 rounded-md"
        :class="active ? 'bg-red-400' : 'bg-red-500 '"
        v-if="item.read === undefined ? false : item.read"
      /> -->
      <div
        class="text-[0.84rem] leading-[1.1rem] font-semibold truncate overflow-hidden"
        :class="active ? 'text-white' : ''"
      >
        <span v-html="item.title"></span>
        <!-- {{ item.title }} -->
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
      <div v-if="fieldEnable.pubTime">{{ item.pubTime }}</div>
      <div
        class="flex space-x-2 text-ellipsis overflow-hidden shrink"
        v-if="fieldEnable.publication"
      >
        <div>|</div>
        <div class="italic truncate">
          {{ item.publication }}
        </div>
      </div>
      <div class="flex space-x-2" v-if="fieldEnable.pubType">
        <div>|</div>
        <div class="">
          {{ getPubTypeString(item.pubType) }}
        </div>
      </div>

      <div
        class="flex space-x-2"
        v-if="fieldEnable.tags && item.tags.length > 0"
      >
        <div>|</div>
        <BIconTag
          class="my-auto min-w-[11px]"
          style="margin-right: -5px !important"
        />
        <div class="truncate overflow-hidden">
          {{
            getCategorizerString(
              item.tags,
              categorizerSortBy,
              categorizerSortOrder
            )
          }}
        </div>
      </div>

      <div
        class="flex space-x-2"
        v-if="fieldEnable.folders && item.folders.length > 0"
      >
        <div>|</div>
        <BIconFolder
          class="my-auto min-w-[11px]"
          style="margin-right: -5px !important"
        />
        <div class="truncate overflow-hidden">
          {{
            getCategorizerString(
              item.folders,
              categorizerSortBy,
              categorizerSortOrder
            )
          }}
        </div>
      </div>

      <div class="flex space-x-2" v-if="fieldEnable.rating && item.rating > 0">
        <div>|</div>
        <div class="flex text-xxxs">
          <BIconStarFill v-for="_ in item.rating" class="my-auto mr-[1px]" />
        </div>
      </div>

      <div class="flex space-x-2" v-if="fieldEnable.flag && item.flag">
        <div>|</div>
        <div class="flex">
          <BIconFlagFill class="m-auto text-xxs" />
        </div>
      </div>

      <div
        class="flex space-x-2 shrink text-ellipsis overflow-hidden"
        v-if="fieldEnable.note && item.note"
      >
        <div>|</div>
        <div class="truncate underline">
          {{ item.note }}
        </div>
      </div>
    </div>
  </div>
</template>
