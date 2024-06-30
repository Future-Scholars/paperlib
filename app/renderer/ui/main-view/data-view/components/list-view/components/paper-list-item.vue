<script setup lang="ts">
import {
  BIconFlagFill,
  BIconFolder,
  BIconStarFill,
  BIconTag,
  BIconFileEarmarkPdf,
  BIconFileEarmark,
  BIconGithub,
} from "bootstrap-icons-vue";
import { PropType, ref } from "vue";
import WordHighlighter from "vue-word-highlighter";

import { getCategorizerString, getPubTypeString } from "@/base/string";
import { PaperEntity } from "@/models/paper-entity";

const props = defineProps({
  item: {
    type: Object as PropType<PaperEntity>,
    required: true,
  },
  fieldEnables: {
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
      doi: false,
      arxiv: false,
      pages: false,
      volume: false,
      number: false,
      publisher: false,
      mainURL: false,
      supURLs: false,
      codes: false,
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
  queryHighlight: {
    type: String,
    default: "",
  },
  showCandidateBtn: {
    type: Boolean,
    default: false,
  },
});

const renderTitle = (title: string) => {
  return renderService.renderMath(title);
};

const emits = defineEmits(["event:click-candidate-btn"]);

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
    :class="active ? `bg-accentlight dark:bg-accentdark` : ''"
    :style="`height: ${height}px`"
  >
    <div class="flex space-x-2" :class="active ? 'text-white' : ''">
      <div
        class="text-[0.84rem] leading-[1.1rem] font-semibold truncate overflow-hidden grow"
      >
        <WordHighlighter
          :query="queryHighlight"
          highlight-class="bg-yellow-300 rounded-sm px-0.5"
          :html-to-highlight="renderTitle(item.title)"
          :split-by-space="true"
        >
        </WordHighlighter>
      </div>
      <div 
        class="flex flex-none justify-end text-xxs rounded-md px-1.5 shadow-md" 
        :class="active ? 'bg-blue-500 hover:bg-blue-400' : 'bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600'"
        @click.stop="$emit('event:click-candidate-btn')"
        v-if="showCandidateBtn"
      >
        <span class="m-auto">{{ $t("mainview.foundcandidates") }}</span>
      </div>
    </div>
    <div
      class="text-[0.7rem] leading-[0.9rem] truncate overflow-hidden"
      :class="active ? 'text-white' : ''"
    >
      <WordHighlighter
        :query="queryHighlight"
        highlight-class="bg-yellow-300 rounded-sm px-0.5"
        :text-to-highlight="item.authors"
        :split-by-space="true"
      >
      </WordHighlighter>
    </div>
    <div
      class="text-[0.7rem] leading-[0.9rem] text-neutral-400 flex space-x-2"
      :class="active ? 'text-neutral-300' : ''"
    >
      <div v-if="fieldEnables.pubTime">{{ item.pubTime }}</div>
      <div
        class="flex space-x-2 text-ellipsis overflow-hidden shrink"
        v-if="fieldEnables.publication"
      >
        <div>|</div>
        <div class="italic truncate">
          {{ item.publication }}
        </div>
      </div>
      <div class="flex space-x-2" v-if="fieldEnables.pubType">
        <div>|</div>
        <div class="">
          {{ getPubTypeString(item.pubType) }}
        </div>
      </div>

      <div
        class="flex space-x-2"
        v-if="fieldEnables.tags && item.tags.length > 0"
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
        v-if="fieldEnables.folders && item.folders.length > 0"
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

      <div class="flex space-x-2" v-if="fieldEnables.rating && item.rating > 0">
        <div>|</div>
        <div class="flex text-xxxs">
          <BIconStarFill v-for="_ in item.rating" class="my-auto mr-[1px]" />
        </div>
      </div>

      <div class="flex space-x-2" v-if="fieldEnables.flag && item.flag">
        <div>|</div>
        <div class="flex">
          <BIconFlagFill class="m-auto text-xxs" />
        </div>
      </div>

      <div
        class="flex space-x-2 shrink text-ellipsis overflow-hidden"
        v-if="fieldEnables.note && item.note"
      >
        <div>|</div>
        <div class="truncate underline">
          {{ item.note.substring(0, 4) === `<md>` ? item.note.replace(`<md>`, "") : item.note }}
        </div>
      </div>

      <div
        class="flex space-x-2 shrink text-ellipsis overflow-hidden"
        v-if="fieldEnables.doi && item.doi"
      >
        <div>|</div>
        <div class="truncate">DOI: {{ item.doi }}</div>
      </div>

      <div
        class="flex space-x-2 shrink text-ellipsis overflow-hidden"
        v-if="fieldEnables.arxiv && item.arxiv"
      >
        <div>|</div>
        <div class="truncate">ArXiv: {{ item.arxiv }}</div>
      </div>

      <div
        class="flex space-x-2 shrink text-ellipsis overflow-hidden"
        v-if="fieldEnables.pages && item.pages"
      >
        <div>|</div>
        <div class="truncate">pp. {{ item.pages }}</div>
      </div>

      <div
        class="flex space-x-2 shrink text-ellipsis overflow-hidden"
        v-if="fieldEnables.volume && item.volume"
      >
        <div>|</div>
        <div class="truncate">vol. {{ item.volume }}</div>
      </div>

      <div
        class="flex space-x-2 shrink text-ellipsis overflow-hidden"
        v-if="fieldEnables.number && item.number"
      >
        <div>|</div>
        <div class="truncate">num. {{ item.number }}</div>
      </div>

      <div
        class="flex space-x-2 shrink text-ellipsis overflow-hidden"
        v-if="fieldEnables.publisher && item.publisher"
      >
        <div>|</div>
        <div class="truncate">
          {{ item.publisher }}
        </div>
      </div>

      <div
        class="flex space-x-2 shrink text-ellipsis overflow-hidden"
        v-if="fieldEnables.mainURL && item.mainURL"
      >
        <div>|</div>
        <BIconFileEarmarkPdf class="my-auto text-xs" />
      </div>

      <div
        class="flex space-x-2 shrink text-ellipsis overflow-hidden"
        v-if="fieldEnables.supURLs && item.supURLs.length > 0"
      >
        <div>|</div>
        <BIconFileEarmark class="my-auto text-xs" />
      </div>

      <div
        class="flex space-x-2 shrink text-ellipsis overflow-hidden"
        v-if="fieldEnables.codes && item.codes"
      >
        <div>|</div>
        <BIconGithub class="my-auto text-xs" />
      </div>
    </div>
  </div>
</template>
