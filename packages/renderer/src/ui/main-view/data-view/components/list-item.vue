<script setup lang="ts">
import {
  BIconFlagFill,
  BIconStarFill,
  BIconTag,
  BIconFolder,
  BIconCircleFill
} from "bootstrap-icons-vue";

const props = defineProps({
  title: String,
  authors: String,
  year: String,
  publication: String,
  pubType: {
    type: Number,
    required: true,
  },
  flag: Boolean,
  rating: {
    type: Number,
    required: true,
  },
  tags: Array,
  folders: Array,
  note: String,
  active: Boolean,
  read: Boolean,
});

const getPubTypeString = (pubType: any) => {
    switch (pubType) {
        case 0:
        return "Article";
        case 1:
        return "Conference";
        case 2:
        return "Others";
        case 3:
        return "Book";
        default:
        return "Others";
    };
}

</script>

<template>
  <div
    class="flex flex-col h-[4rem] w-full p-2 rounded-md select-none cursor-pointer"
    :class="active ? 'bg-accentlight dark:bg-accentdark' : ''"
  >
    <div class="flex space-x-2">
        <div class="my-auto h-1.5 w-1.5 rounded-md" :class="active ? 'bg-red-400' : 'bg-red-500 '" v-if="!read" />
        <div
        class="text-[0.84rem] leading-[1.1rem] font-semibold truncate overflow-hidden"
        :class="active ? 'text-white' : ''"
        >
        {{ title }}
        </div>
    </div>
    <div
      class="text-[0.7rem] leading-[0.9rem] truncate overflow-hidden"
      :class="active ? 'text-white' : ''"
    >
      {{ authors }}
    </div>
    <div
      class="text-[0.7rem] leading-[0.9rem] text-neutral-400 flex space-x-2"
      :class="active ? 'text-neutral-300' : ''"
    >
      <div v-if="year">{{ year }}</div>
      <div v-if="publication && year">|</div>
      <div class="italic truncate overflow-hidden max-w-[80%] flex-none" v-if="publication">
        {{ publication }}
      </div>

      <div v-if="(publication || year) && pubType >= 0">|</div>

      <div class="italic truncate overflow-hidden max-w-[80%] flex-none" v-if="pubType >= 0">
        {{ getPubTypeString(pubType) }}
      </div>

      <div v-if="(publication || year || pubType >= 0) && (tags?.length ?? 0) > 0">|</div>
      <BIconTag
        v-if="tags?.length ?? 0 > 0"
        class="my-auto min-w-[11px]"
        style="margin-right: -5px !important"
      />
      <div
        class="truncate overflow-hidden min-w-[40px]"
        v-if="tags?.length ?? 0 > 0"
      >
        {{ tags?.map((tag) => (tag as Record<string, string>).name).join(" / ") }}
      </div>

      <div v-if="(publication || year || pubType >= 0) && (folders?.length ?? 0) > 0 && (tags?.length ?? 0) < 1">|</div>
      <BIconFolder
        v-if="folders?.length ?? 0 > 0"
        class="my-auto min-w-[11px]"
        style="margin-right: -5px !important"
      />
      <div
        class="truncate overflow-hidden min-w-[40px]"
        v-if="folders?.length ?? 0 > 0"
      >
        {{ folders?.map((folder) => (folder as Record<string, string>).name).join(" / ") }}
      </div>

      <div v-if="(publication || year || pubType >= 0 || (folders?.length ?? 0) > 0 || (tags?.length ?? 0) > 0 || flag) && rating > 0">|</div>
      <div class="flex text-xxxs" v-if="rating > 0">
        <BIconStarFill v-for="n in rating" class="my-auto mr-[1px]" />
      </div>

      <div v-if=" (publication || year || pubType >= 0 || (folders?.length ?? 0) > 0 || (tags?.length ?? 0) > 0 ) && flag">|</div>
      <div class="flex" v-if="flag">
        <BIconFlagFill class="m-auto text-xxs" />
      </div>

      <div v-if="(publication || year || pubType >= 0 || (folders?.length ?? 0) > 0 || (tags?.length ?? 0) > 0 || flag || rating > 0) && note">|</div>
      <div class="truncate overflow-hidden underline shrink">
        {{ note }}
      </div>
    </div>
  </div>
</template>
