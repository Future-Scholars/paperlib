<script setup lang="ts">
import { BIconDash } from "bootstrap-icons-vue";
import { ref } from "vue";

import SelectBox from "./select-box.vue";

// ================================
// Data
// ================================

const startOps = ["", "ALL", "ANY", "NONE", "NOT"];

const fields = [
  "title",
  "authors",
  "publication",
  "pubTime",
  "pubType",
  "rating",
  "note",
  "tags.name",
  "tags.count",
  "folders.name",
  "folders.count",
  "addTime",
  "flag",
];

const ops = [
  "==",
  "<",
  ">",
  "<=",
  ">=",
  "!=",
  "in",
  "CONTAINS",
  "LIKE",
  "BEGINSWITH",
  "ENDSWITH",
];

const selectedStartOp = ref("");
const selectedField = ref("Fields");
const selectedOp = ref("OPs");
const value = ref("");

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
  value.value = (payload.target as HTMLInputElement).value;
  constructFilter();
};

const emits = defineEmits(["event:change", "event:delete-click"]);
const constructFilter = () => {
  if (
    selectedField.value !== "" &&
    selectedOp.value !== "" &&
    value.value !== ""
  ) {
    const filter = `${selectedStartOp.value}(${selectedField.value} ${
      selectedOp.value
    } ${
      selectedField.value.includes("count") ||
      selectedField.value.includes("rating") ||
      selectedField.value.includes("flag") ||
      selectedField.value.includes("addTime")
        ? value.value
        : `"${value.value}"`
    })`;
    emits("event:change", filter);
  }
};
</script>

<template>
  <div class="flex space-x-1">
    <div
      class="rounded-md bg-neutral-200 dark:bg-neutral-700 w-1/6 flex h-10 flex-none"
    >
      <SelectBox
        class="w-full"
        placeholder="StartOps"
        :options="startOps"
        :value="selectedStartOp"
        @option:selected="onSelectStartOp"
      />
    </div>
    <div
      class="rounded-md bg-neutral-200 dark:bg-neutral-700 w-1/6 flex h-10 flex-none"
    >
      <SelectBox
        class="w-full"
        placeholder="Fields"
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
        placeholder="OP"
        :options="ops"
        :value="selectedOp"
        @event:change="onSelectOp"
      />
    </div>
    <div
      class="rounded-md bg-neutral-200 dark:bg-neutral-700 flex h-10 px-3 grow"
    >
      <input
        class="text-xs bg-transparent focus:outline-none dark:text-neutral-300"
        type="text"
        placeholder=""
        v-model="value"
        :name="value"
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
