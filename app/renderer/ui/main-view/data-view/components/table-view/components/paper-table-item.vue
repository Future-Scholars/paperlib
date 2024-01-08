<script setup lang="ts">
import { BIconFlagFill, BIconStarFill } from "bootstrap-icons-vue";
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
      addTime: false,
    },
  },
  fieldWidth: {
    type: Object as PropType<Partial<Record<keyof PaperEntity, number>>>,
    required: true,
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
  striped: {
    type: Boolean,
    required: true,
  },
});
</script>

<template>
  <div
    class="flex w-full py-1 text-xs rounded-md select-none cursor-pointer h-7"
    :class="
      (striped && !active
        ? `bg-neutral-100 dark:bg-neutral-700 dark:bg-opacity-40`
        : ``) +
      (active
        ? `bg-accentlight dark:bg-accentdark dark:bg-opacity-100 text-white`
        : ``)
    "
  >
    <div class="my-auto pl-2 pr-1 flex" :style="`width: ${fieldWidth.title}%`">
      <div class="truncate">{{ item.title }}</div>
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${fieldWidth.authors}%`"
    >
      {{ item.authors }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${fieldWidth.publication}%`"
      v-if="fieldEnable.publication"
    >
      {{ item.publication }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${fieldWidth.pubTime}%`"
      v-if="fieldEnable.pubTime"
    >
      {{ item.pubTime }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${fieldWidth.pubType}%`"
      v-if="fieldEnable.pubType"
    >
      {{ getPubTypeString(item.pubType) }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${fieldWidth.tags}%`"
      v-if="fieldEnable.tags"
    >
      {{
        getCategorizerString(item.tags, categorizerSortBy, categorizerSortOrder)
      }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${fieldWidth.folders}%`"
      v-if="fieldEnable.folders"
    >
      {{
        getCategorizerString(
          item.folders,
          categorizerSortBy,
          categorizerSortOrder
        )
      }}
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${fieldWidth.note}%`"
      v-if="fieldEnable.note"
    >
      {{ item.note }}
    </div>

    <div
      class="flex my-auto text-xxxs truncate overflow-hidden pl-3 pr-1"
      :style="`width: ${fieldWidth.rating}%`"
      v-if="fieldEnable.rating"
    >
      <BIconStarFill v-for="_ in item.rating" class="my-auto mr-[1px]" />
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${fieldWidth.flag}%`"
      v-if="fieldEnable.flag"
    >
      <BIconFlagFill
        class="my-auto text-xxs"
        :calss="active ? 'text-white' : ''"
        v-if="item.flag"
      />
    </div>

    <div
      class="truncate overflow-hidden my-auto pl-3 pr-1"
      :style="`width: ${fieldWidth.addTime}%`"
      v-if="fieldEnable.addTime"
    >
      {{ new Date(item.addTime).toLocaleString().slice(0, 10) }}
    </div>
  </div>
</template>
