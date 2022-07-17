<script setup lang="ts">
import { ref } from "vue";
import { BIconArrowRight, BIconPlus } from "bootstrap-icons-vue";

import Toggle from "./components/toggle.vue";
import Replacement from "./components/replacement.vue";

import { PreferenceStore } from "../../../../preload/utils/preference";

const props = defineProps({
  preference: {
    type: Object as () => PreferenceStore,
    required: true,
  },
});

const newReplacementFrom = ref("");
const newReplacementTo = ref("");

const onUpdate = (key: string, value: unknown) => {
  window.appInteractor.updatePreference(key, value);
};

const onReplacementAdd = () => {
  // Remove duplicates
  let replacements = props.preference.exportReplacement.filter(
    (item) => item.from !== newReplacementFrom.value
  );
  // Add new replacement
  replacements.push({
    from: newReplacementFrom.value,
    to: newReplacementTo.value,
  });
  // Update preference
  window.appInteractor.updatePreference(
    "exportReplacement",
    JSON.stringify(replacements),
    true
  );

  newReplacementFrom.value = "";
  newReplacementTo.value = "";
};

const onReplacementDelete = (replacement: { from: string; to: string }) => {
  // Remove
  let replacements = props.preference.exportReplacement.filter(
    (item) => item.from !== replacement.from && item.to !== replacement.to
  );
  // Update preference
  window.appInteractor.updatePreference(
    "exportReplacement",
    JSON.stringify(replacements),
    true
  );
};
</script>

<template>
  <div class="flex flex-col text-neutral-800 dark:text-neutral-300">
    <div class="text-base font-semibold mb-4">Export</div>

    <Toggle
      class="mb-2"
      title="Export Replacement"
      info="Enable replacing publication titles with customed strings when
                export papers. For example, replacing 'Conference on
                Computer Vision and Pattern Recognition' by 'CVPR'."
      :enable="preference.enableExportReplacement"
      @update="(value) => onUpdate('enableExportReplacement', value)"
    />

    <div class="flex space-x-1 mb-2">
      <input
        class="p-2 w-full rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none my-auto"
        type="text"
        placeholder="Source Publication"
        v-model="newReplacementFrom"
      />
      <BIconArrowRight class="my-auto w-6" />
      <input
        class="p-2 w-full rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none my-auto"
        type="text"
        placeholder="Target Publication"
        v-model="newReplacementTo"
      />
      <div
        class="flex h-full w-20 my-auto text-center rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 hover:dark:bg-neutral-500 text-xs cursor-pointer"
        @click="onReplacementAdd"
      >
        <BIconPlus class="m-auto text-lg" />
      </div>
    </div>

    <div
      class="flex flex-col bg-neutral-200 dark:bg-neutral-700 rounded-md h-[22rem] overflow-auto"
    >
      <Replacement
        :from="replacement.from"
        :to="replacement.to"
        v-for="replacement of preference.exportReplacement"
        @delete="onReplacementDelete(replacement)"
      />
    </div>
  </div>
</template>
