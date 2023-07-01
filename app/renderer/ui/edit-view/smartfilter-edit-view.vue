<script setup lang="ts">
import { BIconPlus } from "bootstrap-icons-vue";
import { onMounted, ref, watch } from "vue";

import { Feed } from "@/models/feed";
import { PaperSmartFilter } from "@/models/smart-filter";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import InputBox from "./components/input-box.vue";
import SelectBox from "./components/select-box.vue";
import SmartFilterRuleBox from "./components/smart-filter-rule-box.vue";

// ==============================
// State
// ==============================
const editingPaperSmartFilterDraft = ref(new PaperSmartFilter("", ""));
const viewState = MainRendererStateStore.useViewState();
const bufferState = MainRendererStateStore.useBufferState();

watch(
  () => viewState.isPaperSmartFilterEditViewShown,
  (value) => {
    if (value) {
      editingPaperSmartFilterDraft.value = new PaperSmartFilter("", "");
      filterRules.value = [];

      filterMatchType.value = "AND";
      infoText.value = "";
      window.addEventListener("keydown", keyDownListener, { once: true });
    }
  }
);

watch(
  () => bufferState.editingPaperSmartFilterDraft,
  (value) => {
    editingPaperSmartFilterDraft.value.initialize(value);
  }
);

// ==============================
// Data
// ==============================
const filterMatchType = ref<string>("AND");
const filterRules = ref<string[]>([]);
const infoText = ref<string>("");

const keyDownListener = (e: KeyboardEvent) => {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement
  ) {
    if (e.key === "Escape") {
      onCloseClicked();
    }
    return true;
  }
  e.preventDefault();
  if (e.key === "Escape") {
    onCloseClicked();
  }
};

const onCloseClicked = () => {
  viewState.isPaperSmartFilterEditViewShown = false;
};

const onSaveClicked = async () => {
  if (editingPaperSmartFilterDraft.value.name === "") {
    infoText.value = "Name is empty.";
    return;
  }
  if (editingPaperSmartFilterDraft.value.filter === "") {
    infoText.value = "Filter string is empty.";
    return;
  }

  window.entityInteractor.insertPaperSmartFilter(
    new PaperSmartFilter("", "").initialize(editingPaperSmartFilterDraft.value),
    "PaperPaperSmartFilter"
  );

  onCloseClicked();
};

const onAddRuleClicked = () => {
  filterRules.value.push("");
};

const onDeleteRuleClicked = (index: number) => {
  filterRules.value = filterRules.value.filter((_, i) => i !== index);
};

const onRuleUpdated = (index: number, filter: string) => {
  filterRules.value[index] = filter;
  constructFilter();
};

const constructFilter = () => {
  const filter = filterRules.value.join(` ${filterMatchType.value} `);
  editingPaperSmartFilterDraft.value.filter = filter;
};

onMounted(() => {
  editingPaperSmartFilterDraft.value = new PaperSmartFilter("", "");
  filterRules.value = [];

  filterMatchType.value = "AND";
  infoText.value = "";
});
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-75"
    enter-from-class="transform opacity-0"
    enter-to-class="transform opacity-100"
    leave-active-class="transition ease-in duration-75"
    leave-from-class="transform opacity-100"
    leave-to-class="transform opacity-0"
  >
    <div
      class="fixed top-0 right-0 left-0 z-50 w-screen h-screen bg-neutral-800 dark:bg-neutral-900 bg-opacity-50 dark:bg-opacity-80"
      v-if="viewState.isPaperSmartFilterEditViewShown"
    >
      <div class="flex flex-col justify-center items-center w-full h-full">
        <div
          class="m-auto flex flex-col justify-between p-2 border-[1px] dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 w-[700px] rounded-lg shadow-lg select-none space-y-2"
        >
          <InputBox
            placeholder="Name"
            :value="editingPaperSmartFilterDraft.name"
            @changed="(value) => (editingPaperSmartFilterDraft.name = value)"
          />
          <InputBox
            placeholder="Filter"
            :value="editingPaperSmartFilterDraft.filter"
            @changed="(value) => (editingPaperSmartFilterDraft.filter = value)"
          />
          <div class="dark:bg-neutral-700 w-full h-[1px]" />

          <SelectBox
            placeholder="Match"
            :options="['AND', 'OR']"
            :value="filterMatchType"
            @changed="(value) => (filterMatchType = value)"
          />

          <SmartFilterRuleBox
            @delete-clicked="onDeleteRuleClicked(i)"
            @changed="(filter) => onRuleUpdated(i, filter)"
            v-for="(filterRule, i) in filterRules"
          />

          <div class="flex space-x-1">
            <div
              class="bg-neutral-200 dark:bg-neutral-700 grow h-[1px] my-auto"
            />
            <div
              class="w-4 h-4 my-auto flex-none bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 rounded-sm cursor-pointer"
              @click="onAddRuleClicked"
            >
              <BIconPlus
                class="m-auto text-neutral-500 dark:text-neutral-400"
              />
            </div>
            <div
              class="bg-neutral-200 dark:bg-neutral-700 grow h-[1px] my-auto"
            />
          </div>
          <div class="flex justify-end space-x-2 py-1">
            <div class="text-xs h-6 flex text-red-500">
              <span class="my-auto">
                {{ infoText }}
              </span>
            </div>
            <div
              class="flex w-20 h-6 rounded-md bg-neutral-300 dark:bg-neutral-500 dark:text-neutral-300 hover:shadow-sm"
              @click="onCloseClicked"
            >
              <span class="m-auto text-xs">{{ $t("menu.close") }}</span>
            </div>
            <div
              class="flex w-20 h-6 rounded-md bg-accentlight dark:bg-accentdark hover:shadow-sm"
              @click="onSaveClicked"
            >
              <span class="m-auto text-xs text-white">{{
                $t("menu.save")
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
