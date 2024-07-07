<script setup lang="ts">
import { BIconDash } from "bootstrap-icons-vue";
import { ref } from "vue";

import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import SelectBox from "./select-box.vue";

const i18n = useI18n();

const props = defineProps({
  initFilter: {
    type: String,
    default: "",
  },
});

// ================================
// Data
// ================================

const startOps = ref({});
const fields = ref({});
const ops = ref({});

const selectedStartOp = ref("");
const selectedField = ref("");
const selectedOp = ref("");
const selectedValue = ref("");

const parseInitFilter = () => {
  if (props.initFilter !== "") {
    const filter = props.initFilter.replace(/^\(/, "").replace(/\)$/, "");
    const comps = filter.split(" ");
    if (Array.from(Object.values(startOps.value)).includes(comps[0])) {
      selectedStartOp.value = comps[0].toUpperCase();
      selectedField.value = comps[1];
      selectedOp.value = comps[2].toUpperCase().replaceAll("[C]", "[c]");

      selectedValue.value = comps
        .slice(3)
        .join(" ")
        .replace(/^["']/, "")
        .replace(/["']$/, "");
    } else {
      selectedField.value = comps[0];
      selectedOp.value = comps[1].toUpperCase().replaceAll("[C]", "[c]");

      selectedValue.value = comps
        .slice(2)
        .join(" ")
        .replace(/^["']/, "")
        .replace(/["']$/, "");
    }
  }
};

const onSelectStartOp = (value: string) => {
  selectedStartOp.value = value;
  constructFilter();
};

const onSelectField = (value: string) => {
  selectedField.value = value;
  constructFilter();
};

const onSelectOp = (value: string) => {
  selectedOp.value = value;
  constructFilter();
};

const onInput = (payload: Event) => {
  selectedValue.value = (payload.target as HTMLInputElement).value;
  constructFilter();
};

const emits = defineEmits(["event:change", "event:delete-click"]);
const constructFilter = () => {
  if (
    selectedField.value !== "" &&
    selectedOp.value !== "" &&
    selectedValue.value !== ""
  ) {
    let filter = [
      selectedStartOp.value,
      selectedField.value,
      selectedOp.value,
      `${
        selectedField.value.includes("count") ||
        selectedField.value.includes("rating") ||
        selectedField.value.includes("flag") ||
        selectedField.value.includes("addTime") ||
        selectedOp.value === "IN"
          ? selectedValue.value
          : `"${selectedValue.value}"`
      }`,
    ]
      .filter((v) => v)
      .join(" ");
    filter = `(${filter})`;
    emits("event:change", filter);
  }
};

onMounted(() => {
  startOps.value = {
    "": "",
    [i18n.t("smartfilter.all")]: "ALL",
    [i18n.t("smartfilter.any")]: "ANY",
    [i18n.t("smartfilter.none")]: "NONE",
    [i18n.t("smartfilter.not")]: "NOT",
  };

  fields.value = {
    [i18n.t("mainview.title")]: "title",
    [i18n.t("mainview.authors")]: "authors",
    [i18n.t("mainview.publication")]: "publication",
    [i18n.t("mainview.pubTime")]: "pubTime",
    [i18n.t("mainview.pubType")]: "pubType",
    [i18n.t("mainview.rating")]: "rating",
    [i18n.t("mainview.note")]: "note",
    [i18n.t("smartfilter.tagname")]: "tags.name",
    [i18n.t("smartfilter.tagcount")]: "tags.count",
    [i18n.t("smartfilter.foldername")]: "folders.name",
    [i18n.t("smartfilter.foldercount")]: "folders.count",
    [i18n.t("mainview.addTime")]: "addTime",
    [i18n.t("mainview.flag")]: "flag",
  };

  ops.value = {
    "==": "==",
    "<": "<",
    ">": ">",
    "<=": "<=",
    ">=": ">=",
    "!=": "!=",
    [i18n.t("smartfilter.in")]: "IN",
    [i18n.t("smartfilter.contains")]: "CONTAINS",
    [i18n.t("smartfilter.containsc")]: "CONTAINS[c]",
    [i18n.t("smartfilter.like")]: "LIKE",
    [i18n.t("smartfilter.beginswith")]: "BEGINSWITH",
    [i18n.t("smartfilter.endswith")]: "ENDSWITH",
  };

  parseInitFilter();
});
</script>

<template>
  <div class="flex space-x-1">
    <div
      class="rounded-md bg-neutral-200 dark:bg-neutral-700 w-1/6 flex h-10 flex-none"
    >
      <SelectBox
        class="w-full"
        :placeholder="$t('smartfilter.startops')"
        :options="startOps"
        :value="selectedStartOp"
        @event:change="onSelectStartOp"
      />
    </div>
    <div
      class="rounded-md bg-neutral-200 dark:bg-neutral-700 w-1/6 flex h-10 flex-none"
    >
      <SelectBox
        class="w-full"
        :placeholder="$t('smartfilter.fields')"
        :options="fields"
        :value="selectedField"
        @event:change="onSelectField"
      />
    </div>
    <div
      class="rounded-md bg-neutral-200 dark:bg-neutral-700 w-1/6 flex h-10 flex-none"
    >
      <SelectBox
        class="w-full"
        :placeholder="$t('smartfilter.operators')"
        :options="ops"
        :value="selectedOp"
        @event:change="onSelectOp"
      />
    </div>
    <div
      class="rounded-md bg-neutral-200 dark:bg-neutral-700 flex h-10 px-3 grow"
    >
      <input
        class="text-xs bg-transparent focus:outline-none dark:text-neutral-300 w-full"
        type="text"
        :placeholder="$t('smartfilter.value')"
        v-model="selectedValue"
        :name="selectedValue"
        @input="onInput"
      />
    </div>
    <div
      class="rounded-md bg-neutral-200 dark:bg-neutral-700 w-1/8 px-2 flex hover:bg-neutral-300 dark:hover:bg-neutral-600 cursor-pointer"
      @click="emits('event:delete-click')"
    >
      <BIconDash class="my-auto" />
    </div>
  </div>
</template>
