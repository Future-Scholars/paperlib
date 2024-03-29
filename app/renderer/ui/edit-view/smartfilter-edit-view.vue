<script setup lang="ts">
import { BIconPlus } from "bootstrap-icons-vue";
import { onMounted, onUnmounted, ref } from "vue";

import { PaperSmartFilter, PaperSmartFilterType } from "@/models/smart-filter";

import { disposable } from "@/base/dispose";
import InputBox from "./components/input-box.vue";
import SelectBox from "./components/select-box.vue";
import SmartFilterRuleBox from "./components/smart-filter-rule-box.vue";

// ==============================
// State
// ==============================
const uiState = uiStateService.useState();
const editingPaperSmartFilterDraft = ref<PaperSmartFilter>(
  new PaperSmartFilter()
);
const selfName = ref<string>("");

// ==============================
// Data
// ==============================
const filterMatchType = ref<string>("AND");
const filterRules = ref<string[]>([]);
const infoText = ref<string>("");

// ==============================
// Event Handler
// ==============================
const onCloseClicked = () => {
  uiState.paperSmartFilterEditViewShown = false;
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

  editingPaperSmartFilterDraft.value.name = selfName.value;

  smartFilterService.update(
    PaperSmartFilterType.smartfilter,
    editingPaperSmartFilterDraft.value
  );

  onCloseClicked();
};

const onAddRuleClicked = () => {
  filterRules.value.push("");
};

const onDeleteRuleClicked = (index: number) => {
  filterRules.value = filterRules.value.filter((_, i) => i !== index);
  constructFilter();
};

const onRuleUpdated = (index: number, filter: string) => {
  filterRules.value[index] = filter;
  constructFilter();
};

const constructFilter = () => {
  const filter = filterRules.value.join(` ${filterMatchType.value} `);
  editingPaperSmartFilterDraft.value.filter = filter;
};

disposable(
  shortcutService.updateWorkingViewScope(shortcutService.viewScope.OVERLAY)
);

disposable(shortcutService.register("Escape", onCloseClicked));

onMounted(() => {
  editingPaperSmartFilterDraft.value.initialize(
    uiState.editingPaperSmartFilter
  );
  selfName.value = editingPaperSmartFilterDraft.value.name.split("/").pop()!;

  if (!["", "true"].includes(editingPaperSmartFilterDraft.value.filter)) {
    const filter = editingPaperSmartFilterDraft.value.filter;
    const rules = filter.split(" AND ");

    // Check if all rules are a atomic rule.
    const isAtomicRule = rules.every(
      (rule) => !rule.includes(" OR ") && !rule.includes(" AND ")
    );

    if (isAtomicRule) {
      filterRules.value = rules;
    } else {
      filterRules.value = [];
    }
  } else {
    filterRules.value = [];
  }

  filterMatchType.value = "AND";
  infoText.value = "";
});
</script>

<template>
  <div
    class="fixed top-0 right-0 left-0 z-50 w-screen h-screen bg-neutral-800 dark:bg-neutral-900 bg-opacity-50 dark:bg-opacity-80"
  >
    <div class="flex flex-col justify-center items-center w-full h-full">
      <div
        class="m-auto flex flex-col justify-between p-2 border-[1px] dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 w-[700px] rounded-lg shadow-lg select-none space-y-2"
      >
        <InputBox
          :placeholder="$t('smartfilter.name')"
          :value="selfName"
          @event:change="(value) => (selfName = value)"
        />
        <InputBox
          :placeholder="$t('smartfilter.filter')"
          :value="editingPaperSmartFilterDraft.filter"
          @event:change="
            (value) => (editingPaperSmartFilterDraft.filter = value)
          "
        />
        <div class="dark:bg-neutral-700 w-full h-[1px]" />

        <SelectBox
          :placeholder="$t('smartfilter.match')"
          :options="{
            [$t('smartfilter.and')]: 'AND',
            [$t('smartfilter.or')]: 'OR',
          }"
          :value="filterMatchType"
          @event:change="(value) => (filterMatchType = value)"
        />

        <SmartFilterRuleBox
          :init-filter="filterRule"
          @event:delete-click="onDeleteRuleClicked(i)"
          @event:change="(filter) => onRuleUpdated(i, filter)"
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
            <BIconPlus class="m-auto text-neutral-500 dark:text-neutral-400" />
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
            <span class="m-auto text-xs text-white">{{ $t("menu.save") }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
