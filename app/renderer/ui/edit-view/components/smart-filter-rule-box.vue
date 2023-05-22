<script setup lang="ts">
import { BIconDash } from "bootstrap-icons-vue";
import { ref } from "vue";

import { MainRendererStateStore } from "@/state/renderer/appstate";

// ================================
// State
// ================================
const viewState = MainRendererStateStore.useViewState();

// ================================
// Data
// ================================

const startOps = ["", "ALL", "ANY", "NONE", "NOT"];

const fields = [
  "title",
  "authors",
  "publication",
  "pubTime",
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

const emit = defineEmits(["changed", "deleteClicked"]);
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
    emit("changed", filter);
  }
};
</script>

<template>
  <div class="flex space-x-1">
    <div
      class="rounded-md bg-neutral-200 dark:bg-neutral-700 w-1/6 flex h-8 flex-none"
    >
      <v-select
        placeholder="StartOps"
        :options="startOps"
        v-model="selectedStartOp"
        class="vue-select text-xs dark:text-neutral-300 my-auto w-full"
        transition="none"
        :clearable="false"
        @option:selected="onSelectStartOp"
      ></v-select>
    </div>
    <div
      class="rounded-md bg-neutral-200 dark:bg-neutral-700 w-1/6 flex h-8 flex-none"
    >
      <v-select
        placeholder="Fields"
        :options="fields"
        v-model="selectedField"
        class="vue-select text-xs dark:text-neutral-300 my-auto w-full"
        transition="none"
        :clearable="false"
        @option:selected="onSelectField"
      ></v-select>
    </div>
    <div
      class="rounded-md bg-neutral-200 dark:bg-neutral-700 w-1/6 flex h-8 flex-none"
    >
      <v-select
        placeholder="OP"
        :options="ops"
        v-model="selectedOp"
        class="vue-select text-xs dark:text-neutral-300 my-auto w-full"
        transition="none"
        :clearable="false"
        @option:selected="onSelectOp"
      ></v-select>
    </div>
    <div
      class="rounded-md bg-neutral-200 dark:bg-neutral-700 flex h-8 px-3 grow"
    >
      <input
        class="text-xs bg-transparent focus:outline-none dark:text-neutral-300"
        type="text"
        placeholder=""
        v-model="value"
        :name="value"
        @input="onInput"
        @focus="viewState.inputFieldFocused = true"
        @blur="viewState.inputFieldFocused = false"
      />
    </div>
    <div
      class="rounded-md bg-neutral-200 dark:bg-neutral-700 w-1/8 px-2 flex hover:bg-neutral-300 dark:hover:bg-neutral-600 cursor-pointer"
      @click="emit('deleteClicked')"
    >
      <BIconDash class="my-auto" />
    </div>
  </div>
</template>
