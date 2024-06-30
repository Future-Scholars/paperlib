<script setup lang="ts">
import {
  BIconFlagFill,
  BIconStarFill,
  BIconCheck2,
  BIconFileEarmarkPdf,
  BIconGithub,
} from "bootstrap-icons-vue";
import { computed, PropType } from "vue";
import WordHighlighter from "vue-word-highlighter";

import {
  getCategorizerString,
  getPubTypeString,
  getShortAuthorString,
} from "@/base/string";
import { PaperEntity } from "@/models/paper-entity";
import { FieldTemplate, ItemField } from "@/renderer/types/data-view";

const props = defineProps({
  item: {
    type: Object as PropType<PaperEntity>,
    required: true,
  },
  fieldTemplates: {
    type: Object as PropType<Map<string, FieldTemplate>>,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  striped: {
    type: Boolean,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
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

const fields = computed(() => {
  const fields: ItemField[] = [];

  for (const [fieldKey, fieldTemplate] of props.fieldTemplates.entries()) {
    let value = props.item[fieldKey];
    if (value === undefined) {
      continue;
    }

    switch (fieldKey) {
      case "addTime": {
        value = new Date(value).toLocaleDateString();
        break;
      }
      case "tags":
      case "folders": {
        value = getCategorizerString(
          value,
          fieldTemplate.sortBy || "addTime",
          fieldTemplate.sortOrder || "desc"
        );
        break;
      }
      case "pubType": {
        value = getPubTypeString(value);
        break;
      }
      case "mainURL": {
        value = value !== "" && value !== undefined;
        break;
      }
      case "codes": {
        value = value.length > 0;
        break;
      }
      case "supURLs": {
        value = value.length > 0;
        break;
      }
      case "authors": {
        if (fieldTemplate.short) {
          value = getShortAuthorString(value);
        }
        break;
      }
      case "feed": {
        value = value.name;
        break;
      }
      case "title": {
        if (value.includes("$")) {
          value = renderService.renderMath(value);
        } else {
          value = value;
        }
        break;
      }
      case "note": {
        value =
          value.substring(0, 4) === "<md>" ? value.replace("<md>", "") : value;
        break;
      }
    }

    const field = {
      type: fieldTemplate.type,
      value: value,
      width: fieldTemplate.width,
      highlightable: fieldKey === "title" || fieldKey === "authors",
    };
    fields.push(field);
  }

  return fields;
});

const emits = defineEmits(["event:click-candidate-btn"]);
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
    <div
      class="my-auto px-2 flex"
      v-for="(field, index) in fields"
      :style="`width: ${field.width}%`"
    >
      <span
        class="my-auto truncate"
        v-if="field.type === 'string' && !field.highlightable"
        >{{ field.value }}</span
      >
      <WordHighlighter
        class="my-auto truncate"
        v-else-if="field.type === 'string' && field.highlightable"
        :query="queryHighlight"
        highlight-class="bg-yellow-300 rounded-sm px-0.5"
        :text-to-highlight="field.value"
        :split-by-space="true"
      />
      <span
        class="my-auto truncate"
        v-html="field.value"
        v-else-if="field.type === 'html' && !field.highlightable"
      ></span>
      <WordHighlighter
        class="my-auto truncate"
        v-else-if="field.type === 'html' && field.highlightable"
        :query="queryHighlight"
        highlight-class="bg-yellow-300 rounded-sm px-0.5"
        :html-to-highlight="field.value"
        :split-by-space="true"
      />
      <span class="my-auto" v-else-if="field.type === 'flag'">
        <BIconFlagFill
          class="my-auto text-xxs"
          :calss="active ? 'text-white' : ''"
          v-if="field.value"
        />
      </span>
      <span class="my-auto text-xxxs flex" v-else-if="field.type === 'rating'">
        <BIconStarFill v-for="_ in field.value" class="my-auto mr-[1px]" />
      </span>
      <span class="my-auto" v-else-if="field.type === 'boolean'">
        <BIconCheck2
          class="my-auto text-xxs"
          :calss="active ? 'text-white' : ''"
          v-if="field.value"
        />
      </span>
      <span class="my-auto" v-else-if="field.type === 'file'">
        <BIconFileEarmarkPdf
          class="my-auto text-sm"
          :calss="active ? 'text-white' : ''"
          v-if="field.value"
        />
      </span>
      <span class="my-auto" v-else-if="field.type === 'code'">
        <BIconGithub
          class="my-auto text-sm"
          :calss="active ? 'text-white' : ''"
          v-if="field.value"
        />
      </span>
      <span
        class="my-auto truncate flex"
        v-else-if="field.type === 'html-read'"
      >
        <div
          class="my-auto h-1.5 w-1.5 rounded-md flex-none mr-1"
          :class="active ? 'bg-red-400' : 'bg-red-500 '"
          v-if="!read"
        />
        <span class="my-auto truncate" v-html="field.value"> </span>
      </span>
      <span class="my-auto truncate" v-else>
        {{ field.value }}
      </span>
    </div>
      <div
        class="absolute mt-0.5 right-2 flex justify-end text-xxs rounded-md px-1.5 shadow-md"
        :class="
          active
            ? 'bg-blue-500 hover:bg-blue-400'
            : 'bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600'
        "
        @click.stop="$emit('event:click-candidate-btn')"
        v-if="showCandidateBtn"
      >
        <span class="m-auto">{{ $t("mainview.foundcandidates") }}</span>
      </div>

  </div>
</template>
